import path from 'path';
import sharp from 'sharp';
import cypto from 'crypto';
import { getPrismaClient } from '../client-handle';
import type { Image } from '../generated/prisma/client';
import { scanLocalImages } from './scanLocalImages';
import FileSystem from './fs/FileSystem';
import realFs from './fs/NodeFileSystem';

export type ImageModel = Omit<
  Image,
  'id' | 'createdAt' | 'updatedAt' | 'groupId' | 'perceptualHash' | 'largePath'
>;

export async function getSeedImageData(
  fullDir: string,
  generateThumbnails: boolean = true,
  fsImpl: FileSystem = realFs,
): Promise<ImageModel[]> {
  if (!fullDir) {
    throw new Error('No images directory provided.');
  }
  if (!fsImpl.existsSync(fullDir)) {
    throw new Error(`Images directory does not exist: ${fullDir}`);
  }

  const thumbDir = path.join(path.dirname(path.resolve(fullDir)), 'thumbnails');

  const files = await scanLocalImages(
    fullDir,
    { recurse: false, ignoreHidden: true },
    fsImpl,
  );

  if (files.length === 0) return [];

  const images: ImageModel[] = [];
  for (const file of files) {
    const fullPath = file;
    let thumbnailPath: string | null = null;

    // Basic metadata
    const stats = await fsImpl.stat(fullPath);
    if (!stats.size) {
    }
    const fileSizeKB = Math.round((stats.size || 0) / 1024);

    // Get dimensions and hashes using sharp
    let width: number | null = null;
    let height: number | null = null;
    let sha256Hash: string | null = null;

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
    const thumbFilePath = path.join(thumbDir, file);
    if (!fsImpl.existsSync(thumbFilePath) && generateThumbnails) {
      fsImpl.mkdirSync(thumbDir, { recursive: true });
      await sharp(fullPath).resize(300).toFile(thumbFilePath);
      thumbnailPath = path.join(thumbDir, file);
    }

    images.push({
      fullPath,
      thumbnailPath: thumbnailPath || fullPath,
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

  const images = await getSeedImageData(fullDir, true);
  console.log(`Prepared ${images.length} images for seeding.`);
  if (images.length === 0) {
    console.warn(`No images found in ${fullDir} - add some samples!`);
    return;
  }

  const prisma = getPrismaClient();
  images.forEach(
    async ({
      fullPath,
      thumbnailPath,
      width,
      height,
      fileSizeKB,
      sha256Hash,
      nsfw,
      source,
    }) => {
      await prisma.image.upsert({
        where: { fullPath },
        update: {},
        create: {
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
      console.log(`Seeded: ${fullPath}`);
    },
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
