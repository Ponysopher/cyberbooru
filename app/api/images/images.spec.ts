import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi } from 'vitest';
import * as appHandler from './route';
import { prismaMock } from '@/vitest-configs/mocks/prisma';

interface ImagesApiTestParams {
  limit?: string;
  offset?: string;
}

vi.mock('@/prisma/client-handle', () => ({
  getPrismaClient: () => prismaMock,
}));

async function testApiHandlerGeneric(
  test: ({ fetch }: { fetch: any }) => Promise<void>,
  params: ImagesApiTestParams,
) {
  await testApiHandler({
    appHandler,
    url: '/api/images/',
    params: params as Record<string, string>,
    test,
  });
}

describe('/api/images', () => {
  it('respects query params and forwards them to server action', async () => {
    prismaMock.image.findMany.mockResolvedValue([]);

    await testApiHandlerGeneric(
      async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/json');

        await res.json();

        expect(prismaMock.image.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 5,
            skip: 10,
          }),
        );
      },
      { limit: '5', offset: '10' },
    );
  });

  it('returns 500 on unexpected server action failure', async () => {
    // Simulate prisma failure
    prismaMock.image.findMany.mockRejectedValue(new Error('DB crashed'));

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();
      expect(res.status).toBe(500);
      expect(res.headers.get('content-type')).toBe('application/json');

      const json = await res.json();
      expect(json).toMatchObject({
        error: expect.stringContaining('Failed'), // adjust based on your error shape
      });

      expect(prismaMock.image.findMany).toHaveBeenCalledTimes(1);
    }, {});
  });

  it('does not make additional DB calls', async () => {
    prismaMock.image.findMany.mockResolvedValue([]);

    await testApiHandlerGeneric(async ({ fetch }) => {
      await fetch();

      expect(prismaMock.image.findMany).toHaveBeenCalledTimes(1);
    }, {});
  });
});
