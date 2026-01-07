import fs from 'fs';
import path from 'path';
import sharp from 'sharp'; // Optional: remove if not installing
import cypto from 'crypto';
import 'dotenv/config';
import { getPrismaClient } from '../client-handle';

const prisma = getPrismaClient();

async function main() {
  // Define your local image directories
  const fullDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir)
    throw new Error('BASE_IMAGES_PATH environment variable is not set.');
  const thumbDir = path.join(fullDir, 'thumb');

  // Ensure directories exist
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
    console.log(`Created ${fullDir} - add images here!`);
    return;
  }

  const files = fs
    .readdirSync(fullDir)
    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

  if (files.length === 0) {
    console.log(`No images found in ${fullDir} - add some samples!`);
    return;
  }

  console.log(`Seeding ${files.length} images...`);

  for (const file of files) {
    const fullPath = path.join(fullDir, file);
    let thumbnailPath: string | null = null;

    const fullFilePath = path.join(fullDir, file);

    // Basic metadata
    const stats = fs.statSync(fullFilePath);
    const fileSizeKB = Math.round(stats.size / 1024);

    // Optional: Get dimensions and hashes using sharp
    let width: number | undefined;
    let height: number | undefined;
    let sha256Hash: string | undefined;

    try {
      const image = sharp(fullFilePath);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      const buffer = await image.toBuffer();
      sha256Hash = cypto.createHash('sha256').update(buffer).digest('hex');
    } catch (err) {
      console.warn(`Could not process ${file} with sharp:`, err);
    }

    // Simple thumbnail generation
    const thumbFilePath = path.join(thumbDir, file);
    if (!fs.existsSync(thumbFilePath)) {
      fs.mkdirSync(thumbDir, { recursive: true });
      await sharp(fullFilePath).resize(300).toFile(thumbFilePath);
      thumbnailPath = path.join(thumbDir, file);
    }

    await prisma.image.upsert({
      where: { fullPath },
      update: {},
      create: {
        fullPath,
        thumbnailPath: thumbnailPath || fullPath, // Fallback if no separate thumb
        width,
        height,
        fileSizeKB,
        sha256Hash,
        nsfw: true, // As per your comment to change default to true
        source: 'local-seed',
      },
    });

    console.log(`Seeded: ${file}`);
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
