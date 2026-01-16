import { describe, it, expect, afterAll } from 'vitest';
import { getPrismaClient } from './client-handle';

const prisma = getPrismaClient();

describe('Prisma Database Connectivity', () => {
  const TEST_IMAGE_FULL_PATH = '/test/full/sample-image.jpg';
  const TEST_IMAGE_THUMBNAIL_PATH = '/test/thumb/sample-image.jpg';

  it('should connect to the database successfully', async () => {
    // Simple health check: query the schema version or just check client is alive
    const result = await prisma.$queryRaw`SELECT 1 AS connected`;
    expect(result).toEqual([{ connected: 1 }]);
  });

  it('should successfully create (write) a minimal Image record', async () => {
    const createdImage = await prisma.image.create({
      data: {
        fullPath: TEST_IMAGE_FULL_PATH,
        thumbnailPath: TEST_IMAGE_THUMBNAIL_PATH,
        nsfw: true,
      },
    });

    expect(createdImage).toBeDefined();
    expect(createdImage.id).toBeGreaterThan(0);
    expect(createdImage.fullPath).toBe(TEST_IMAGE_FULL_PATH);
  });

  it('should successfully read back the created Image record', async () => {
    // Find the record we just created by its unique field
    const foundImage = await prisma.image.findUnique({
      where: {
        fullPath: TEST_IMAGE_FULL_PATH,
      },
    });

    expect(foundImage).not.toBeNull();
    expect(foundImage?.fullPath).toBe(TEST_IMAGE_FULL_PATH);
    expect(foundImage?.nsfw).toBe(true);
  });

  afterAll(async () => {
    await prisma.image.deleteMany({
      where: { fullPath: TEST_IMAGE_FULL_PATH },
    });
    await prisma.$disconnect();
  });
});
