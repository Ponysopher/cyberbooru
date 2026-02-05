import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect } from 'vitest';
import * as appHandler from './route';

describe('/api/image/[...slug]', () => {
  it('serves thumbnail with correct content-type and data', async () => {
    await testApiHandler({
      appHandler,
      url: '/api/images/',
      params: {
        slug: [encodeURIComponent('thumbnails/129193482_p0_master1200.jpg')],
      },
      test: async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toMatch(
          /image\/(jpeg|png|webp)/,
        );
        expect(res.headers.get('content-length')).toBeTruthy();

        const arrayBuffer = await res.arrayBuffer();
        expect(arrayBuffer.byteLength).toBeGreaterThan(0);

        const view = new Uint8Array(arrayBuffer);
        if (res.headers.get('content-type')?.includes('jpeg')) {
          expect(view[0]).toBe(0xff);
          expect(view[1]).toBe(0xd8);
        }
      },
    });
  });
});
