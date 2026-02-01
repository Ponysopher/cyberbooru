import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPrismaClient } from '../client-handle';
import seed from './seed';
import TEST_IMAGE_FILENAMES from '@/vitest-configs/test-image-filenames';

const EXPECTED_IMAGE_PATHS = TEST_IMAGE_FILENAMES.map(
  (fileName) => `sample_images/${fileName}`,
).sort();
const EXPECTED_IMAGE_THUMBNAIL_PATHS = TEST_IMAGE_FILENAMES.map(
  (fileName) => `thumbnails/${fileName}`,
).sort();

const EXPECTED_IMAGE_COUNT = EXPECTED_IMAGE_PATHS.length;

async function seed_and_report() {
  await seed();
  const prisma = getPrismaClient();
  await prisma.image.findMany();
  await prisma.$disconnect();
}

describe('seeding script main', () => {
  beforeEach(async () => {
    const prisma = getPrismaClient();
    await prisma.image.deleteMany();
    await prisma.$disconnect();
  });

  it('should log the records of the expected number of images', async () => {
    const logSpy = vi.spyOn(console, 'log');

    await seed();

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      `Prepared ${EXPECTED_IMAGE_COUNT} images from sample_images for seeding.`,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      `Upsert complete: ${EXPECTED_IMAGE_COUNT} images inserted, 0 duplicates, 0 failures.`,
    );

    await seed();

    expect(logSpy).toHaveBeenNthCalledWith(
      3,
      `Prepared ${EXPECTED_IMAGE_COUNT} images from sample_images for seeding.`,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      4,
      `Upsert complete: 0 images inserted, ${EXPECTED_IMAGE_COUNT} duplicates, 0 failures.`,
    );
  });

  it('should upsert the expected number of images to the database with the correct full paths', async () => {
    await seed();

    const prisma = getPrismaClient();
    const imagePaths = (await prisma.image.findMany()).map(
      ({ fullPath }) => fullPath,
    );
    await prisma.$disconnect();
    expect(imagePaths.sort()).toEqual(EXPECTED_IMAGE_PATHS);
  });

  it('should upsert the expected number of images to the database with the correct thumbnail paths', async () => {
    await seed();

    const prisma = getPrismaClient();
    const imagePaths = (await prisma.image.findMany()).map(
      ({ thumbnailPath }) => thumbnailPath,
    );
    await prisma.$disconnect();
    expect(imagePaths.sort()).toEqual(EXPECTED_IMAGE_THUMBNAIL_PATHS);
  });

  it('should only change database timestamps on subsequent runs with no changes to the files', async () => {
    const images1 = await seed_and_report();
    const images2 = await seed_and_report();

    expect(images1).toEqual(images2);
  });
});
