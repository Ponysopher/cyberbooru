import { describe, it, expect, beforeAll } from 'vitest';
import generateThumbnail from './generateThumbnail';
import { rmSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

const THUMBNAILS_DIR = process.env.BASE_THUMBNAILS_PATH;
const IMAGES_DIR = process.env.BASE_IMAGES_PATH;
const imageFileNames = [
  '133196374_p0.png',
  'GxC1rOAX0AAunLs.jpeg',
  '129193482_p0_master1200.jpg',
  '133341258_p0.png',
  '133154851_p0.jpg',
  'Rubjoy_Polyphallography.png',
];
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
            (
              await generateThumbnail(
                imagePath,
                path.join(THUMBNAILS_DIR!, path.basename(imagePath)),
              )
            ).thumbnailPath,
        ),
      )
    ).sort((a, b) => (a || '').localeCompare(b || ''));
    expect(generatedThumbnailPaths).toEqual(expectedThumbnailFilePaths);

    const actualThumbnailFilePaths = (await readdir(THUMBNAILS_DIR!))
      .map((thumbPath) => path.join(THUMBNAILS_DIR!, thumbPath))
      .sort((a, b) => a.localeCompare(b));
    expect(actualThumbnailFilePaths).toEqual(expectedThumbnailFilePaths);
  });

  it('enforces consistent thumbnail dimensions (max width/height constraint)', async () => {
    for (const imagePath of fullImageFilePaths) {
      const thumbnailPath = path.join(
        THUMBNAILS_DIR!,
        path.basename(imagePath),
      );
      const result = await generateThumbnail(imagePath, thumbnailPath);
      expect(result.width).toBeLessThanOrEqual(300);
      expect(result.height).toBeLessThanOrEqual(300);
    }
  });
});
