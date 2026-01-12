import { describe, it, expect } from 'vitest';
import { getSeedImageData } from './seed';
import mockFs, { mockEmptyDir } from './fs/mockfiles';

const imageFileNames = [
  '133196374_p0.png',
  'GxC1rOAX0AAunLs.jpeg',
  '129193482_p0_master1200.jpg',
  '133341258_p0.png',
  '133154851_p0.jpg',
  'Rubjoy_Polyphallography.png',
].map((fileName) => `sample_images/${fileName}`);

describe('getSeedImageData', () => {
  it('produces a structured list of images', async () => {
    const imageData = await getSeedImageData(
      process.env.BASE_IMAGES_PATH!,
      false,
    );
    const returnedFileNames = imageData
      .map(({ fullPath }) => fullPath)
      .sort((a, b) => a.localeCompare(b));
    expect(returnedFileNames).toEqual(
      imageFileNames.sort((a, b) => a.localeCompare(b)),
    );

    imageData.forEach(({ width, height, fileSizeKB, sha256Hash }) => {
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(fileSizeKB).toBeGreaterThan(0);
      expect(sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    });

    expect(imageData.length).toBe(imageFileNames.length);
  });

  it('handles empty directories gracefully', async () => {
    const imageData = await getSeedImageData(mockEmptyDir, false, mockFs);
    expect(imageData.length).toBe(0);
  });

  it('handles non-existant directories gracefully', async () => {
    await expect(
      getSeedImageData('/path/to/no/directory', false, mockFs),
    ).rejects.toThrowError(/.*does not exist/i);
  });

  it('handles no provided directory gracefully', async () => {
    await expect(
      getSeedImageData(undefined!, false, mockFs),
    ).rejects.toThrowError(/no.*provided/i);
  });
});
