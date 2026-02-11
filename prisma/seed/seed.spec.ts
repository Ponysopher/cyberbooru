import { describe, it, expect } from 'vitest';
import { getSeedImageData } from './seed';
import path from 'path';
import { readdirSync } from 'fs';
import { SUPPORTED_IMAGE_FORMATS_REGEX } from '@/constants';

if (!process.env.BASE_IMAGES_PATH) {
  throw new Error('BASE_IMAGES_PATH is not set');
}

describe('getSeedImageData', () => {
  it('produces a structured list of images', async () => {
    const imageFileNames = readdirSync(process.env.BASE_IMAGES_PATH!)
      .filter((fileName) => fileName.match(SUPPORTED_IMAGE_FORMATS_REGEX))
      .map((fileName) => `sample_images/${fileName}`);

    const imageData = await getSeedImageData(process.env.BASE_IMAGES_PATH!);
    const returnedFileNames = imageData
      .map(({ fullPath }) => fullPath)
      .sort((a, b) => a.localeCompare(b));
    expect(returnedFileNames).toEqual(
      imageFileNames.sort((a, b) => a.localeCompare(b)),
    );

    imageData.forEach(({ width, height, fileSizeKB, sha256Hash, mimeType }) => {
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(fileSizeKB).toBeGreaterThan(0);
      expect(mimeType).toMatch(/^image\/(png|jpeg|jpg)$/);
      expect(sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    });

    expect(imageData.length).toBe(imageFileNames.length);
  });

  it('handles empty directories gracefully', async () => {
    const imageData = await getSeedImageData(
      path.join(process.env.BASE_IMAGES_PATH!, 'empty'),
    );
    expect(imageData.length).toBe(0);
  });

  it('handles non-existant directories gracefully', async () => {
    await expect(
      getSeedImageData('/path/to/no/directory'),
    ).rejects.toThrowError(/.*does not exist/i);
  });

  it('handles no provided directory gracefully', async () => {
    await expect(getSeedImageData(undefined!)).rejects.toThrowError(
      /no.*provided/i,
    );
  });
});
