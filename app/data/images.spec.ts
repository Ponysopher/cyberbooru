import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/vitest-configs/mocks/prisma';
import { get_image_paths, QueriedImage } from './images';
import { fs as memfs } from 'memfs';

type MockQueriedImage = Partial<QueriedImage> & {
  id: number;
  fullPath: string;
  thumbnailPath: string;
  createdAt: Date;
  ImageTags: Array<{
    imageId?: number;
    tagId?: number;
    tag: { id: number; name: string };
  }>;
};

vi.mock('@/prisma/client-handle', () => {
  return {
    getPrismaClient: () => prismaMock,
  };
});

vi.mock('fs', async () => {
  const { fs: memfs } = await import('memfs');
  return {
    default: memfs,
    ...memfs,
    promises: memfs.promises,
  };
});

describe('get_image_paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('can be invoked directly (no server/action context needed)', async () => {
    await get_image_paths(5);
    expect(true).toBe(true); // passes → invocation works
  });

  it('makes exactly one database call (findMany)', async () => {
    prismaMock.image.findMany.mockResolvedValue([]);

    await get_image_paths(10, 20);

    expect(prismaMock.image.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.image.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
        include: expect.any(Object),
        orderBy: { id: 'desc' },
      }),
    );
  });

  it('returns list of image records with IDs and relative path stubs', async () => {
    const mockData: MockQueriedImage[] = [
      {
        id: 42,
        fullPath: 'uploads/2025/abc123.jpg',
        thumbnailPath: 'thumbs/abc123-200.jpg',
        createdAt: new Date('2025-02-01'),
        ImageTags: [
          { tag: { id: 1, name: 'nature' } },
          { tag: { id: 2, name: 'sunset' } },
        ],
      } as MockQueriedImage,
      {
        id: 41,
        fullPath: 'uploads/old-pic.png',
        thumbnailPath: 'thumbs/old-150.png',
        createdAt: new Date(),
        ImageTags: [],
      } as MockQueriedImage,
    ];

    prismaMock.image.findMany.mockResolvedValue(mockData as QueriedImage[]);

    const result = await get_image_paths(2);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject(mockData[0]);
  });

  it('does NOT touch the filesystem', async () => {
    const readFileSpy = vi.spyOn(memfs.promises, 'readFile');

    prismaMock.image.findMany.mockResolvedValue([]);

    await get_image_paths(5);

    expect(readFileSpy).not.toHaveBeenCalled();
  });

  it('is deterministic given mocked DB input', async () => {
    const mockImages = [{ id: 100, fullPath: 'a.jpg' }] as QueriedImage[];

    prismaMock.image.findMany
      .mockResolvedValueOnce(mockImages) // call 1
      .mockResolvedValueOnce(mockImages); // call 2

    const result1 = await get_image_paths(10);
    const result2 = await get_image_paths(10);

    expect(result1).toEqual(result2); // same input → same output
  });

  it('throws when BASE_IMAGES_PATH is missing', async () => {
    const original = process.env.BASE_IMAGES_PATH;
    delete process.env.BASE_IMAGES_PATH;

    await expect(get_image_paths()).rejects.toThrow(
      'BASE_IMAGES_PATH is not defined',
    );

    process.env.BASE_IMAGES_PATH = original;
  });

  it('throws generic error when query fails', async () => {
    prismaMock.image.findMany.mockRejectedValue(new Error('Database gone'));
    await expect(get_image_paths()).rejects.toThrow('Failed to fetch images');
  });

  it('handles errors gracefully', async () => {
    prismaMock.image.findMany.mockRejectedValue(new Error('DB timeout'));

    await expect(get_image_paths()).rejects.toThrow(/Failed to fetch images/);
  });
});
