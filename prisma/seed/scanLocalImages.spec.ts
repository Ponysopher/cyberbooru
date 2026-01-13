import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scanLocalImages } from './scanLocalImages';
import { vol } from 'memfs';

vi.mock('fs', async () => {
  const { fs: memfs } = await import('memfs');
  return {
    default: memfs,
    ...memfs,
    promises: memfs.promises,
  };
});

const imagesFullDir = '/images';
const recursiveDir = 'nested';
const hiddenFileName = '.hidden.jpg';
const recursiveFileName = 'c.png';
const expectedMockFilePaths = [
  `${imagesFullDir}/a.jpg`,
  `${imagesFullDir}/b.png`,
];

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    [`${imagesFullDir}/a.jpg`]: 'file content',
    [`${imagesFullDir}/b.png`]: 'file content',
    [`${imagesFullDir}/${hiddenFileName}`]: 'file content',
    [`${imagesFullDir}/${recursiveDir}/${recursiveFileName}`]: 'file content',
  });
});

afterEach(() => {
  vol.reset();
});

describe('scanLocalImages', () => {
  it('should throw an error if directory does not exist', async () => {
    await expect(() => scanLocalImages('/non_existent')).rejects.toThrow(
      /not exist/i,
    );
  });

  it('should return an array of image file names in the directory', async () => {
    const files = await scanLocalImages(imagesFullDir);
    expect(files.sort()).toEqual(expectedMockFilePaths.sort());
  });

  it('should ignore hidden files when ignoreHidden is true', async () => {
    const files = await scanLocalImages(imagesFullDir);
    expect(files).not.toContain(`${imagesFullDir}/${hiddenFileName}`);
  });

  it('should ignore nested directories when recurse is false', async () => {
    const files = await scanLocalImages(imagesFullDir);
    expect(files).not.toContain(
      `${imagesFullDir}/${recursiveDir}/${recursiveFileName}`,
    );
  });

  it('should include nested directories when recurse is true', async () => {
    const files = await scanLocalImages(imagesFullDir, {
      recurse: true,
      ignoreHidden: true,
    });
    expect(files).toContain(
      `${imagesFullDir}/${recursiveDir}/${recursiveFileName}`,
    );
  });
});
