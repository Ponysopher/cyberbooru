import { PrismaClient } from '#prisma/index.js';
// import { readFile } from 'fs/promises';
// import { Image, Tag } from "@/generated/prisma/index"
import { ImageData } from './migration-types';

interface ImageRecord {
  height: number;
  width: number;
  size?: number | undefined;
  fullPath: string;
  thumbnailPath: string;
  largeFilePath?: string | undefined;
}

type TagRecord = { name: string };

// Create an array of arrays (i.e., chunks)
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const CHUNK_SIZE = 500; // Safe chunk size for SQLite database inserts
const DATASET_CHUNK_SIZE = 5000; // Chunk size for dataset processing

// Insert records in chunks
async function createManyChunked<
  T,
  M extends {
    createMany(args?: {
      data: T[];
      skipDuplicates?: boolean;
    }): Promise<unknown>;
  },
>(records: T[], prismaModel: M) {
  if (records.length === 0) return;
  const chunks = chunkArray(records, CHUNK_SIZE);
  for (const chunk of chunks) {
    await prismaModel.createMany({ data: chunk });
  }
}

function get_unique_images(images: ImageData[]) {
  const seen = new Set<string>();
  const uniqueImages: ImageRecord[] = [];
  for (const image of images) {
    const filePath = image.fullPath;
    if (!seen.has(filePath)) {
      seen.add(filePath);
      // remove tags property by destructuring
      const { tags, ...newImageObject } = image;
      uniqueImages.push(newImageObject);
    }
  }
  return uniqueImages;
}

function get_unique_tags(images: ImageData[]) {
  const seen = new Set<string>();
  const uniqueTags: TagRecord[] = [];
  for (const image of images) {
    for (const tag of image.tags) {
      if (!seen.has(tag)) {
        seen.add(tag);
        uniqueTags.push({ name: tag });
      }
    }
  }
  return uniqueTags;
}

async function import_images(dataset: ImageData[]) {
  // Convert to objects matching Prisma schema for createMany
  const uniqueTagRecords = get_unique_tags(dataset);

  // Convert to Prisma Images without mutating dataset
  const uniqueImageRecords = get_unique_images(dataset);

  // Create a single PrismaClient instance for the entire script
  const prisma = new PrismaClient();

  // Insert tags and images in a transaction
  await prisma.$transaction(async (transaction) => {
    await createManyChunked(uniqueTagRecords, transaction.tag);
    await createManyChunked(uniqueImageRecords, transaction.image);
  });

  // Get inserted images
  const images = await prisma.image.findMany({
    where: {
      fullPath: { in: uniqueImageRecords.map(({ fullPath }) => fullPath) },
    },
    select: { id: true, fullPath: true },
  });
  const imageIdMap: Map<string, number> = new Map(
    images.map(({ id, fullPath }) => [fullPath, id]),
  );

  // Get inserted tags
  const tags = await prisma.tag.findMany({
    where: { name: { in: uniqueTagRecords.map(({ name }) => name) } },
    select: { id: true, name: true },
  });
  const tagIdMap: Map<string, number> = new Map(
    tags.map(({ id, name }) => [name, id]),
  );

  // Link tags to images in chunks with global deduplication
  interface ImageTagRecord {
    imageId: number;
    tagId: number;
  }
  const imageTagSet: Set<string> = new Set();
  const skippedRecords: Map<string, string[]> = new Map();
  const failedTransactions: ImageTagRecord[] = [];
  const datasetChunks = chunkArray(dataset, DATASET_CHUNK_SIZE);
  let totalProcessed = 0;

  // Construct set of ImageTag records
  for (let i = 0; i < datasetChunks.length; i++) {
    const chunk = datasetChunks[i];
    const imageTagRecords: ImageTagRecord[] = [];

    for (const imageObject of chunk) {
      // Lookup imageId using normalized path
      const imagePath = imageObject.fullPath;
      const imageId = imageIdMap.get(imagePath);
      if (!imageId) {
        skippedRecords.set(imagePath, skippedRecords.get(imagePath) || []);
        continue;
      }

      // Lookup tagIds
      for (const tag of imageObject.tags) {
        const tagId = tagIdMap.get(tag);
        if (!tagId) {
          const currentTags = skippedRecords.get(imagePath) || [];
          skippedRecords.set(imagePath, [...currentTags, tag]);
          continue;
        }
        // Check for duplicates globally and add to records
        const key = `${imageId}-${tagId}`;
        if (!imageTagSet.has(key)) {
          imageTagSet.add(key);
          imageTagRecords.push({ imageId, tagId });
        }
      }
    }

    // Insert chunked ImageTags records
    if (imageTagRecords.length === 0) {
      console.warn(
        `No ImageTags records to insert for chunk ${i + 1}/${datasetChunks.length}.`,
      );
    } else {
      try {
        await prisma.$transaction(async (transaction) => {
          await createManyChunked(imageTagRecords, transaction.imageTags);
        });
      } catch (error) {
        console.error(error);
        failedTransactions.concat(imageTagRecords);
      }
    }

    // Log progress
    totalProcessed += chunk.length;
    console.log(
      `Processed ${totalProcessed}/${dataset.length} images (${((totalProcessed / dataset.length) * 100).toFixed(1)}%)`,
    );
  }

  await prisma.$disconnect();

  // Log skipped records, filtering out empty tag arrays
  if (skippedRecords.size > 0) {
    const skippedLog: Record<string, string[]> = {};
    for (const [imagePath, tags] of skippedRecords) {
      if (tags.length > 0) {
        skippedLog[imagePath] = tags;
      }
    }
    if (Object.keys(skippedLog).length > 0) {
      console.warn('Skipped records:', skippedLog);
    }
  }

  // log failed transactions
  if (failedTransactions.length > 0) {
    console.error('Failed to insert Image Tag links for the following');
    failedTransactions.forEach((tx) => {
      console.error(`imageId: ${tx.imageId}, tagId: ${tx.tagId}`);
    });
  }
}

//TODO: NEED TO GET IMAGE AND TAG DATA ALREADY IN THE DATABASE TO AVOID INSERT DUPLICATES
