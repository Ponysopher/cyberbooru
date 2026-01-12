import { describe, it, expect } from 'vitest';
import { scanLocalImages } from './scanLocalImages';
import mockFs, {
  expectedMockFilePaths,
  hiddenFileName,
  imagesFullDir,
  recursiveDir,
  recursiveFileName,
} from './fs/mockfiles';

describe('scanLocalImages', async () => {
  it('should throw an error if directory does not exist', async () => {
    const nonExistentDir = './non_existent_directory';
    await expect(() =>
      scanLocalImages(
        nonExistentDir,
        { recurse: false, ignoreHidden: true },
        mockFs,
      ),
    ).rejects.toThrowError(/not exist/i);
  });

  it('should return an array of image file names in the directory', async () => {
    const imageFiles = await scanLocalImages(
      imagesFullDir,
      { recurse: false, ignoreHidden: true },
      mockFs,
    );
    expect(Array.isArray(imageFiles)).toBe(true);
    expect(imageFiles).toEqual(expectedMockFilePaths);
  });

  it('should ignore hidden/system files like .hidden when ignoreHidden option is true', async () => {
    const imageFiles = scanLocalImages(
      imagesFullDir,
      { recurse: false, ignoreHidden: true },
      mockFs,
    );
    expect(imageFiles).not.toContain(hiddenFileName);
  });

  it('should ignore nested directories when recurse option is false or undefined', async () => {
    const imageFiles = scanLocalImages(
      imagesFullDir,
      { recurse: false, ignoreHidden: true },
      mockFs,
    );
    expect(imageFiles).not.toContain(recursiveFileName);
  });

  it('should include nested directories when recurse option is true', async () => {
    const imageFiles = await scanLocalImages(
      imagesFullDir,
      { recurse: true, ignoreHidden: true },
      mockFs,
    );
    const expectedNestedFile = `${imagesFullDir}/${recursiveDir}/c.png`;
    expect(imageFiles).toContain(expectedNestedFile);
  });
});
