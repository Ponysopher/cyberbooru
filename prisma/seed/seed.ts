import path from 'path';
import sharp from 'sharp';
import cypto from 'crypto';
import { getPrismaClient } from '../client-handle';
import type { Image } from '../generated/prisma/client';
import { scanLocalImages } from './scanLocalImages';
import generateThumbnail from './generateThumbnail';
import fs from 'fs';

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

  const generateThumbnails = thumbnailDir && fs.existsSync(thumbnailDir);

  const images: ImageModel[] = [];
  for (const file of files) {
    const fullPath = file;

    // Basic metadata
    const stats = fs.statSync(fullPath);
    if (!stats.size) {
    }
    const fileSizeKB = Math.round((stats.size || 0) / 1024);

    // Get dimensions and hashes using sharp
    let width: number | null = null;
    let height: number | null = null;
    let sha256Hash: string | null = null;

    // Use sharp to get image metadata and hash
    try {
      const image = sharp(fullPath);
      const metadata = await image.metadata();
      width = metadata.width || null;
      height = metadata.height || null;

      const buffer = await image.toBuffer();
      sha256Hash = cypto.createHash('sha256').update(buffer).digest('hex');
    } catch (err) {
      console.warn(`Could not process ${file} with sharp:`, err);
    }

    // Simple thumbnail generation
    let generatedThumbnailPath: string | undefined;
    if (generateThumbnails) {
      generatedThumbnailPath = (
        await generateThumbnail(
          fullPath,
          path.join(thumbnailDir, path.basename(fullPath)),
        )
      ).thumbnailPath;
      if (!generatedThumbnailPath) {
        console.error(`Could not generate thumbnail for ${file}`);
      }
    }

    images.push({
      fullPath,
      thumbnailPath: generatedThumbnailPath || fullPath,
      width,
      height,
      fileSizeKB,
      sha256Hash,
      nsfw: true,
      source: 'local-seed',
    });
  }

  console.log(`Prepared ${images.length} images from ${fullDir} for seeding.`);
  return images;
}

export default async function seed(): Promise<void> {
  const fullDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir) {
    console.error('BASE_IMAGES_PATH environment variable is not set.');
    return;
  }
  const thumbnailDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir) {
    console.warn(
      'BASE_IMAGES_PATH environment variable is not set. Thumbnails will not be generated.',
    );
  }

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
    const {
      fullPath,
      thumbnailPath,
      width,
      height,
      fileSizeKB,
      sha256Hash,
      nsfw,
      source,
    } = img;

    try {
      // Try to create first (fast path when record doesn't exist)
      await prisma.image.create({
        data: {
          fullPath,
          thumbnailPath: thumbnailPath || fullPath,
          width,
          height,
          fileSizeKB,
          sha256Hash,
          nsfw,
          source,
        },
      });
      insertCount++;
    } catch (err: any) {
      // Unique constraint violation → record already exists
      if (err.code === 'P2002') {
        // Overwrite
        await prisma.image.update({
          where: { fullPath },
          data: {
            thumbnailPath: thumbnailPath || fullPath,
            width,
            height,
            fileSizeKB,
            sha256Hash,
            nsfw,
            source,
          },
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
  await seed();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
