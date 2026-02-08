import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { process_upload } from './process-upload';
import * as uploadImageModule from './upload-image';
import * as getMetadataModule from './get-metadata';
import * as generateThumbnailModule from './generate-thumbnail';
import { getPrismaClient } from '@/prisma/client-handle';
import fs from 'fs/promises';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';

// ────────────────────────────────────────────────
// Mock all external dependencies
// ────────────────────────────────────────────────

vi.mock('./upload-image');
vi.mock('./get-metadata');
vi.mock('./generate-thumbnail');
vi.mock('@/prisma/client-handle');

const mockPrisma = {
  image: {
    create: vi.fn(),
    delete: vi.fn(),
  },
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mocked(getPrismaClient).mockReturnValue(mockPrisma as any);

const mockReturnedImage: ImageModel = {
  id: 1,
  createdAt: new Date(),
  fullPath: 'samples/image.jpeg',
  thumbnailPath: 'thumbnails/image.jpeg',
  largePath: null,
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
  fullPath: 'samples/image.jpeg',
  thumbnailPath: 'thumbnails/image.jpeg',
  mimeType: 'image/jpeg',
  width: 1920,
  height: 1080,
  fileSizeKB: 245,
  sha256Hash: 'abc123hash',
  // source: null,
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

describe('process_upload', () => {
  const mockInput = {
    file: Buffer.from('fake image content'),
    filename: 'test.jpg',
    // ... other fields your ProcessImageInput might have
  } as any;

  let mockPrisma: any; // or better type it if possible

  beforeEach(() => {
    vi.clearAllMocks();

    // Fresh mock prisma every test
    mockPrisma = {
      image: {
        create: vi.fn(),
        delete: vi.fn(),
      },
      $disconnect: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma);

    // Default mocks
    vi.mocked(uploadImageModule.default).mockResolvedValue(
      mockReturnedImage.fullPath,
    );
    vi.mocked(getMetadataModule.default).mockResolvedValue(mockMetadata);
    vi.mocked(generateThumbnailModule.default).mockResolvedValue(
      mockReturnedImage.thumbnailPath,
    );

    // Default prisma behavior
    mockPrisma.image.create.mockResolvedValue(mockReturnedImage);
    mockPrisma.image.delete.mockResolvedValue(undefined);

    vi.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('happy path creates file, thumbnail, db record and returns the created image', async () => {
    const result = await process_upload(mockInput);

    expect(uploadImageModule.default).toHaveBeenCalledWith(mockInput);
    expect(getMetadataModule.default).toHaveBeenCalledWith(mockInput);
    expect(generateThumbnailModule.default).toHaveBeenCalledWith(mockInput);

    expect(mockPrisma.image.create).toHaveBeenCalledWith({
      data: mockSuppliedImageData,
    });

    expect(result).toMatchObject(mockReturnedImage);

    expect(mockPrisma.$disconnect).toHaveBeenCalled();
  });

  it('rolls back files when DB insert fails (no DB record is created)', async () => {
    const uploadedPath = mockReturnedImage.fullPath;
    const thumbnailPath = mockReturnedImage.thumbnailPath;

    // Ensure we reach the DB step
    vi.mocked(uploadImageModule.default).mockResolvedValue(uploadedPath);
    vi.mocked(generateThumbnailModule.default).mockResolvedValue(thumbnailPath);

    const dbError = new Error('Unique constraint failed');

    mockPrisma.image.create.mockRejectedValue(dbError);

    await expect(process_upload(mockInput)).rejects.toThrow(dbError);

    // Files are cleaned up
    expect(fs.unlink).toHaveBeenCalledTimes(2);
    expect(fs.unlink).toHaveBeenCalledWith(uploadedPath);
    expect(fs.unlink).toHaveBeenCalledWith(thumbnailPath);

    // No DB record was created → no delete should be attempted
    expect(mockPrisma.image.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.image.delete).not.toHaveBeenCalled();

    // Disconnect still called in catch
    expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1); // once in try, once in catch
  });

  it('uses originalPath as fallback for thumbnail if thumbnail generation returns null/undefined', async () => {
    vi.mocked(generateThumbnailModule.default).mockResolvedValue(null);

    await process_upload(mockInput);

    expect(mockPrisma.image.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          thumbnailPath: mockReturnedImage.fullPath, // fallback to original
        }),
      }),
    );
  });
});
