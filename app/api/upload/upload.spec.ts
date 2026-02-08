import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '@/vitest-configs/mocks/prisma';
import * as appHandler from './route';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';

async function testApiHandlerGeneric(
  test: ({ fetch }: { fetch: any }) => Promise<void>,
  url = '/api/upload/',
) {
  await testApiHandler({
    appHandler,
    url,
    test,
  });
}

vi.mock('@/prisma/client-handle', () => ({
  getPrismaClient: () => prismaMock,
}));

vi.mock('fs', async () => {
  const { fs: memfs } = await import('memfs');

  return {
    default: memfs,
    ...memfs,
    promises: memfs.promises,
  };
});

const mockImage: ImageModel = {
  id: 1,
  createdAt: new Date(),
  fullPath: 'samples/image.jpeg',
  thumbnailPath: 'thumbnails/image.jpeg',
  largePath: null,
  mimeType: null,
  width: null,
  height: null,
  fileSizeKB: null,
  sha256Hash: null,
  perceptualHash: null,
  source: null,
  nsfw: true,
  groupId: null,
};

describe('/api/upload', () => {
  it('accepts multipart/form-data', async () => {
    prismaMock.image.create.mockResolvedValue(mockImage);

    await testApiHandlerGeneric(async ({ fetch }) => {
      // Minimal valid JPEG bytes
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

      const file = new File([bytes], 'test.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch({
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(201);
    });
  });

  it('accepts more than one image file', async () => {
    await testApiHandlerGeneric(async ({ fetch }) => {
      prismaMock.image.create.mockResolvedValue(mockImage);

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9 + i]);
        const file = new File([bytes], `test${i}.jpg`, {
          type: 'image/jpeg',
        });
        formData.append('files', file);
      }

      const res = await fetch({
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(201);
    });
  });

  it('returns created image metadata', async () => {
    await testApiHandlerGeneric(async ({ fetch }) => {
      prismaMock.image.create.mockResolvedValue(mockImage);

      const formData = new FormData();
      for (let i = 0; i < 2; i++) {
        const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9 + i]);
        const file = new File([bytes], `test${i}.jpg`, {
          type: 'image/jpeg',
        });
        formData.append('files', file);
      }

      const res = await fetch({
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json).toEqual([
        { success: true, name: 'test0.jpg', size: 4, type: 'image/jpeg' },
        { success: true, name: 'test1.jpg', size: 4, type: 'image/jpeg' },
      ]);
    });
  });

  it('rejects requests with invalid Content-Type with a 400 error', async () => {
    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      });

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Invalid Content Type');
    });
  });

  it('rejects non-image files with a 415 error', async () => {
    await testApiHandlerGeneric(async ({ fetch }) => {
      // Minimal valid JPEG bytes
      const formData = new FormData();
      const mockText = 'This is a test text file.';
      const file = new File([mockText], `test.txt`, {
        type: 'text/plain',
      });
      formData.append('files', file);

      const res = await fetch({
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(415);

      const json = await res.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Unsupported Media Type');
    });
  });

  it('returns a 415 error for an unsupported filetype', async () => {
    await testApiHandlerGeneric(async ({ fetch }) => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

      const file = new File([bytes], 'test.jpg', {
        type: 'image/bmp',
      });

      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch({
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Unsupported Image Type');
    });
  });
});
