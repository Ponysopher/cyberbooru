import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { process_upload } from './process-upload';
import * as uploadImageModule from './upload-image';
import * as getMetadataModule from './get-metadata';
import * as generateThumbnailModule from './generate-thumbnail';
import { getPrismaClient } from '@/prisma/client-handle';
import fs from 'fs/promises';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';
import { PrismaClient } from '@/prisma/generated/prisma/client';
import { ProcessImageInput } from './types';
import { mockDeep } from 'vitest-mock-extended';
import * as uniqueFileNameModule from './get-unique-file-name';

const imagesDir = process.env.BASE_IMAGES_PATH;
if (!imagesDir) throw new Error('process.env.BASE_IMAGES_PATH is not defined');
const thumbnailDir = process.env.BASE_THUMBNAILS_PATH;
if (!thumbnailDir)
  throw new Error('process.env.BASE_THUMBNAILS_PATH is not defined');

vi.mock('./upload-image');
vi.mock('./get-metadata');
vi.mock('./generate-thumbnail');

vi.mock('@/prisma/client-handle', () => ({
  getPrismaClient: vi.fn(),
}));

const mockReturnedImage: ImageModel = {
  id: 1,
  createdAt: new Date(),
  fullPath: 'samples/test-uuid.jpeg',
  thumbnailPath: 'thumbnails/test-uuid.jpeg',
  largePath: null,
  originalFileName: 'image.jpeg',
  mimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  fileSizeKB: 245,
  sha256Hash: 'abc123hash',
  perceptualHash: null,
  source: null,
  nsfw: true,
  groupId: null,
};
const mockSuppliedImageData = {
  fullPath: 'samples/test-uuid.jpeg',
  thumbnailPath: 'thumbnails/test-uuid.jpeg',
  originalFileName: 'image.jpeg',
  mimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  fileSizeKB: 245,
  sha256Hash: 'abc123hash',
  nsfw: true,
};

const mockMetadata = {
  mimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  fileSizeKB: 245,
  sha256Hash: 'abc123hash',
  nsfw: true,
};

const mockInput: ProcessImageInput = {
  buffer: Buffer.from('fake image content'),
  filename: 'image.jpeg',
};

const mockUnqiueInput: ProcessImageInput = {
  buffer: Buffer.from('fake image content'),
  filename: 'test-uuid.jpeg',
};

const prismaMock = mockDeep<PrismaClient>();

describe('process_upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mockReset(prismaMock);
    vi.mocked(getPrismaClient).mockReturnValue(prismaMock);

    vi.mocked(uploadImageModule.default).mockResolvedValue(
      mockReturnedImage.fullPath,
    );

    vi.mocked(getMetadataModule.default).mockResolvedValue(mockMetadata);

    vi.mocked(generateThumbnailModule.default).mockResolvedValue(
      mockReturnedImage.thumbnailPath,
    );

    prismaMock.image.create.mockResolvedValue(mockReturnedImage);

    prismaMock.image.delete.mockResolvedValue(mockReturnedImage);

    vi.spyOn(fs, 'unlink').mockResolvedValue();

    vi.spyOn(uniqueFileNameModule, 'getUniqueFileName').mockReturnValue(
      'test-uuid.jpeg',
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('happy path creates file, thumbnail, db record and returns the created image', async () => {
    const result = await process_upload(mockInput, imagesDir, thumbnailDir);

    expect(uploadImageModule.default).toHaveBeenCalledWith(
      mockUnqiueInput,
      imagesDir,
    );
    expect(getMetadataModule.default).toHaveBeenCalledWith(mockUnqiueInput);
    expect(generateThumbnailModule.default).toHaveBeenCalledWith(
      mockUnqiueInput,
      thumbnailDir,
    );

    expect(prismaMock.image.create).toHaveBeenCalledWith({
      data: mockSuppliedImageData,
    });

    expect(result).toMatchObject(mockReturnedImage);

    expect(prismaMock.$disconnect).toHaveBeenCalled();
  });

  it('rolls back files when DB insert fails (no DB record is created)', async () => {
    const uploadedPath = mockReturnedImage.fullPath;
    const thumbnailPath = mockReturnedImage.thumbnailPath;

    // Ensure we reach the DB step
    vi.mocked(uploadImageModule.default).mockResolvedValue(uploadedPath);
    vi.mocked(generateThumbnailModule.default).mockResolvedValue(thumbnailPath);

    const dbError = new Error('Unique constraint failed');

    prismaMock.image.create.mockRejectedValue(dbError);

    await expect(
      process_upload(mockInput, imagesDir, thumbnailDir),
    ).rejects.toThrow(dbError);

    // Files are cleaned up
    expect(fs.unlink).toHaveBeenCalledTimes(2);
    expect(fs.unlink).toHaveBeenCalledWith(uploadedPath);
    expect(fs.unlink).toHaveBeenCalledWith(thumbnailPath);

    // No DB record was created → no delete should be attempted
    expect(prismaMock.image.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.image.delete).not.toHaveBeenCalled();

    // Disconnect still called in catch
    expect(prismaMock.$disconnect).toHaveBeenCalledTimes(1); // once in try, once in catch
  });

  it('uses originalPath as fallback for thumbnail if thumbnail generation returns null/undefined', async () => {
    vi.mocked(generateThumbnailModule.default).mockResolvedValue(null);

    await process_upload(mockInput, imagesDir, thumbnailDir);

    expect(prismaMock.image.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          thumbnailPath: mockReturnedImage.fullPath, // fallback to original
        }),
      }),
    );
  });
});
