import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as appHandler from './route';
import { get_image_paths } from '@/app/data/images';

vi.mock('@/app/data/images', () => ({
  get_image_paths: vi.fn(),
}));

async function testApiHandlerGeneric(
  test: ({ fetch }: { fetch: any }) => Promise<void>,
  url = '/api/images',
) {
  await testApiHandler({
    appHandler,
    url,
    test,
  });
}

describe('/api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('respects query params and forwards them to server action', async () => {
    vi.mocked(get_image_paths).mockResolvedValue([]);

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');

      await res.json();

      expect(get_image_paths).toHaveBeenCalledWith(5, 10);
    }, '/api/images?limit=5&offset=10');
  });

  it('returns 500 on unexpected server action failure', async () => {
    // Simulate prisma failure
    vi.mocked(get_image_paths).mockRejectedValue(new Error('DB crashed'));

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();
      expect(res.status).toBe(500);
      expect(res.headers.get('content-type')).toBe('application/json');

      const json = await res.json();
      expect(json).toMatchObject({
        error: expect.stringContaining('Failed'),
      });

      expect(get_image_paths).toHaveBeenCalledTimes(1);
    });
  });
});
