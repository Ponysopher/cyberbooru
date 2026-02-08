import path from 'path';
import { rmSync } from 'fs';
import { readdir } from 'fs/promises';
import { describe, it, expect, beforeAll } from 'vitest';

import generate_thumbnail from './generate-thumbnail';
import TEST_IMAGE_FILENAMES from '@/vitest-configs/test-image-filenames';
import { inputFromPath } from './input-adapters';

const THUMBNAILS_DIR = process.env.BASE_THUMBNAILS_PATH;
const IMAGES_DIR = process.env.BASE_IMAGES_PATH;
const imageFileNames = TEST_IMAGE_FILENAMES;
const fullImageFilePaths = imageFileNames.map((fileName) =>
  path.join(IMAGES_DIR || 'null', fileName),
);

const expectedThumbnailFilePaths = imageFileNames
  .map((fileName) => path.join(THUMBNAILS_DIR || 'null', fileName))
  .sort((a, b) => a.localeCompare(b));

describe('generateThumbnail', () => {
  beforeAll(async () => {
    if (!THUMBNAILS_DIR)
      throw new Error('The thumbnails environment variable is not set!');
    if (!IMAGES_DIR)
      throw new Error('The images environment variable is not set!');

    const thumbnailFiles = await readdir(THUMBNAILS_DIR);
    thumbnailFiles.forEach((filePath) =>
      rmSync(path.join(THUMBNAILS_DIR, filePath)),
    );
  });

  it('generates a thumbnail for supported image formats', async () => {
    const generatedThumbnailPaths = (
      await Promise.all(
        fullImageFilePaths.map(
          async (imagePath) =>
            await generate_thumbnail(await inputFromPath(imagePath)),
        ),
      )
    ).sort((a, b) => (a || '').localeCompare(b || ''));
    expect(generatedThumbnailPaths).toEqual(expectedThumbnailFilePaths);

    const actualThumbnailFilePaths = (await readdir(THUMBNAILS_DIR!))
      .map((thumbPath) => path.join(THUMBNAILS_DIR!, thumbPath))
      .sort((a, b) => a.localeCompare(b));
    expect(actualThumbnailFilePaths).toEqual(expectedThumbnailFilePaths);
  });
});
