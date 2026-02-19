import fs from 'fs';

import type { Image } from '../generated/prisma/client';
import { inputFromPath } from '@/lib/image-processing/input-adapters';
import generate_thumbnail from '@/lib/image-processing/generate-thumbnail';
import { getPrismaClient } from '../client-handle';
import get_metadata from '@/lib/image-processing/get-metadata';
import { scanLocalImages } from './scanLocalImages';

export type ImageModel = Omit<
  Image,
  'id' | 'createdAt' | 'updatedAt' | 'groupId' | 'perceptualHash' | 'largePath'
>;

export async function getSeedImageData(
  fullDir: string,
  thumbnailDir?: string,
): Promise<ImageModel[]> {
  if (!fullDir) {
    throw new Error('No images directory provided.');
  }
  if (!fs.existsSync(fullDir)) {
    throw new Error(`Images directory does not exist: ${fullDir}`);
  }

  const files = await scanLocalImages(fullDir);

  if (files.length === 0) return [];

  const thumbnailDirExists = thumbnailDir && fs.existsSync(thumbnailDir!);
  if (!thumbnailDir) {
    console.warn(
      'No thumbnail directory provided. Thumbnails will not be generated.',
    );
  }
  if (thumbnailDir && !thumbnailDirExists) {
    console.warn(
      `Thumbnail directory ${thumbnailDir} does not exist. Thumbnails will not be generated.`,
    );
  }
  const generateThumbnails = thumbnailDir && thumbnailDirExists;

  const images: ImageModel[] = [];
  for (const fullPath of files) {
    const { width, height, sha256Hash, mimeType, fileSizeKB } =
      await get_metadata(await inputFromPath(fullPath));

    // Simple thumbnail generation
    let generatedThumbnailPath: string | null | undefined;
    if (generateThumbnails) {
      generatedThumbnailPath = await generate_thumbnail(
        await inputFromPath(fullPath),
        thumbnailDir,
      );
      if (!generatedThumbnailPath) {
        console.error(`Could not generate thumbnail for ${fullPath}`);
      }
    }

    images.push({
      fullPath,
      thumbnailPath: generatedThumbnailPath || fullPath,
      mimeType,
      width,
      height,
      fileSizeKB,
      sha256Hash,
      nsfw: true,
      source: 'local-seed',
    });
  }

  console.log(`Prepared ${images.length} images for seeding.`);
  return images;
}

export default async function seed(
  fullDir: string,
  thumbnailDir?: string,
): Promise<void> {
  const images = await getSeedImageData(fullDir, thumbnailDir);

  if (images.length === 0) {
    console.warn(`No images found in ${fullDir} - add some samples!`);
    return;
  }

  const prisma = getPrismaClient();
  let insertCount = 0;
  let duplicateCount = 0;
  let failureCount = 0;

  for (const img of images) {
    const { fullPath } = img;
    try {
      // Try to create first (fast path when record doesn't exist)
      await prisma.image.create({
        data: img,
      });
      insertCount++;
    } catch (err: any) {
      // Unique constraint violation → record already exists
      if (err.code === 'P2002') {
        // Overwrite
        await prisma.image.update({
          where: { fullPath },
          data: img,
        });
        duplicateCount++;
      } else {
        failureCount++;
        console.error(`Failed ${fullPath}:`, err);
      }
    }
  }

  console.log(
    `Upsert complete: ${insertCount} images inserted, ${duplicateCount} duplicates, ${failureCount} failures.`,
  );
  await prisma.$disconnect();
}

export async function main(): Promise<void> {
  const fullDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir) {
    console.error('BASE_IMAGES_PATH environment variable is not set.');
    return;
  }
  const thumbnailDir = process.env.BASE_THUMBNAILS_PATH;
  if (!thumbnailDir) {
    console.warn(
      'BASE_THUMBNAILS_PATH environment variable is not set. Thumbnails will not be generated.',
    );
  }
  await seed(fullDir, thumbnailDir);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
