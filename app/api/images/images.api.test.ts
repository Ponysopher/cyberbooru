import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi } from 'vitest';
import * as appHandler from './route';
import { get_image_paths, QueriedImage } from '@/app/data/images';

interface ImagesApiTestParams {
  limit?: string;
  offset?: string;
}

type QueriedImageWithStringDates = Omit<QueriedImage, 'createdAt'> & {
  createdAt: string | Date;
};

const SAMPLE_IMAGES: QueriedImageWithStringDates[] = [
  {
    id: 343,
    fullPath: 'sample_images/Rubjoy_Polyphallography.png',
    thumbnailPath: 'thumbnails/Rubjoy_Polyphallography.png',
    largePath: null,
    mimeType: null,
    width: 1500,
    height: 1125,
    fileSizeKB: 1129,
    sha256Hash:
      '1156e9ec705033f58e9e5168759964140b0c8cb23f8c3cfaa1053e6ba68ecc84',
    perceptualHash: null,
    source: 'local-seed',
    nsfw: true,
    groupId: null,
    createdAt: '2026-02-05T00:38:19.658Z',
    ImageTags: [],
  },
  {
    id: 342,
    fullPath: 'sample_images/GxC1rOAX0AAunLs.jpeg',
    thumbnailPath: 'thumbnails/GxC1rOAX0AAunLs.jpeg',
    largePath: null,
    mimeType: null,
    width: 1463,
    height: 2048,
    fileSizeKB: 360,
    sha256Hash:
      '215d7296837a2fbe7c5e5b7f5db23debcf90fa95f19d547dabe9d82f47b3b4dc',
    perceptualHash: null,
    source: 'local-seed',
    nsfw: true,
    groupId: null,
    createdAt: '2026-02-05T00:38:19.656Z',
    ImageTags: [],
  },
];

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
  it('calls get_image_paths only once', async () => {
    vi.mock('@/app/data/images', { spy: true });

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');

      expect(get_image_paths).toHaveBeenCalledTimes(1);
    }, {});
  });

  it('returns JSON matching that server action output', async () => {
    vi.mock('@/app/data/images', { spy: true });

    await testApiHandlerGeneric(
      async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/json');

        const data = await res.json();
        // console.log('API response data:', data);
        expect(data).toHaveLength(2);
        expect(data).toEqual(SAMPLE_IMAGES);
      },
      { limit: '2' },
    );
  });
});
