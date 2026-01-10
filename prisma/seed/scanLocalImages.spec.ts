import { describe, it, expect } from 'vitest';
import { IMAGE_FILENAME_REGEX, scanLocalImages } from './scanLocalImages';

describe('scanLocalImages', () => {
  const imagesFullDir = process.env.BASE_IMAGES_PATH!;

  it('should throw an error if directory does not exist', () => {
    const nonExistentDir = './non_existent_directory';
    expect(() => scanLocalImages(nonExistentDir)).toThrowError(
      `Directory ${nonExistentDir} does not exist.`,
    );
  });

  it('should return an array of image file names in the directory', () => {
    // Assuming the test environment has some images in the directory
    const imageFiles = scanLocalImages(imagesFullDir);
    expect(Array.isArray(imageFiles)).toBe(true);
    imageFiles.forEach((file) => {
      expect(IMAGE_FILENAME_REGEX.test(file)).toBe(true);
    });
  });

  it('should ignore system files like .DS_Store', () => {
    const imageFiles = scanLocalImages(imagesFullDir);
    imageFiles.forEach((file) => {
      expect(file).not.toBe('.DS_Store');
    });
  });
});
