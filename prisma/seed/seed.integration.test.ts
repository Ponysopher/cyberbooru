import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { getPrismaClient, resetDatabase } from '@/prisma/client-handle';
import seed, { getSeedImageData } from './seed';
import TEST_IMAGE_FILENAMES from '@/vitest-configs/test-image-filenames';
import path from 'path';
import fs from 'fs';
import TestWorkspace from '@/vitest-configs/utils/workspace';

const baseImagesPath = process.env.BASE_IMAGES_PATH!;
if (!baseImagesPath) throw new Error('BASE_IMAGES_PATH is not defined');
const thumbnailsPath = process.env.BASE_THUMBNAILS_PATH!;
if (!thumbnailsPath) throw new Error('BASE_THUMBNAILS_PATH is not defined');

const EXPECTED_IMAGE_COUNT = TEST_IMAGE_FILENAMES.length;

describe.sequential('seeding script main', async () => {
  let workspace = await TestWorkspace.create();
  workspace.copyImages(baseImagesPath);
  let expectedImagePaths: string[] = [];
  let expectedThumbnailPaths: string[] = [];

  async function resetWorkspace() {
    await workspace.teardown();
    workspace = await TestWorkspace.create();
    workspace.copyImages(baseImagesPath);

    expectedImagePaths = TEST_IMAGE_FILENAMES.map((fileName) =>
      path.join(workspace.imagesPath, fileName),
    );
    expectedThumbnailPaths = TEST_IMAGE_FILENAMES.map((fileName) =>
      path.join(workspace.thumbnailsPath, fileName),
    );
    await resetDatabase();
  }

  beforeAll(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetWorkspace();
  });

  async function seed_with_workspace() {
    await seed(workspace.imagesPath, workspace.thumbnailsPath);
  }

  async function seed_and_report() {
    await seed_with_workspace();
    await resetDatabase();
  }

  it('should log the records of the expected number of images', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const warrningSpy = vi.spyOn(console, 'warn');

    await seed_with_workspace();

    expect(warrningSpy).not.toHaveBeenCalled();

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      `Prepared ${EXPECTED_IMAGE_COUNT} images for seeding.`,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      `Upsert complete: ${EXPECTED_IMAGE_COUNT} images inserted, 0 duplicates, 0 failures.`,
    );

    await seed_with_workspace();

    expect(warrningSpy).not.toHaveBeenCalled();

    expect(logSpy).toHaveBeenNthCalledWith(
      3,
      `Prepared ${EXPECTED_IMAGE_COUNT} images for seeding.`,
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      4,
      `Upsert complete: 0 images inserted, ${EXPECTED_IMAGE_COUNT} duplicates, 0 failures.`,
    );
  });

  it('should upsert the expected number of images to the database with the correct full paths', async () => {
    await seed_with_workspace();

    const prisma = getPrismaClient();
    const imagePaths = (await prisma.image.findMany()).map(
      ({ fullPath }) => fullPath,
    );
    await prisma.$disconnect();
    expect(imagePaths.sort()).toEqual(expectedImagePaths);
  });

  it('should upsert the expected number of images to the database with the correct thumbnail paths', async () => {
    await seed_with_workspace();

    const prisma = getPrismaClient();
    const imagePaths = (await prisma.image.findMany()).map(
      ({ thumbnailPath }) => thumbnailPath,
    );
    await prisma.$disconnect();
    expect(imagePaths.sort()).toEqual(expectedThumbnailPaths);
  });

  it('should only change database timestamps on subsequent runs with no changes to the files', async () => {
    const images1 = await seed_and_report();
    const images2 = await seed_and_report();

    expect(images1).toEqual(images2);
  });

  it('generates thumbnails when requested', async () => {
    const thumbnailDir = path.join(baseImagesPath, 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir);
    }

    const imageData = await getSeedImageData(baseImagesPath, thumbnailDir);

    imageData.forEach(({ thumbnailPath }) => {
      expect(thumbnailPath).toBeDefined();
      expect(fs.existsSync(thumbnailPath!)).toBe(true);
    });
  });
});
