import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi } from 'vitest';
import * as appHandler from './route';
import { get_image_paths, QueriedImage } from '@/app/data/images';

interface ImagesApiTestParams {
  limit?: string;
  offset?: string;
}

type StableQueriedImage = Omit<QueriedImage, 'createdAt' | 'id'>;

const SAMPLE_IMAGES: StableQueriedImage[] = [
  {
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
    ImageTags: [],
  },
  {
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
    ImageTags: [],
  },
];

function getStableObject(queriedImage: QueriedImage): StableQueriedImage {
  const { createdAt, id, ...stableImage } = queriedImage;
  return stableImage;
}

async function testApiHandlerGeneric(
  test: ({ fetch }: { fetch: any }) => Promise<void>,
  params: ImagesApiTestParams,
  url = '/api/images/',
) {
  await testApiHandler({
    appHandler,
    url,
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

        const data = (await res.json()).map((elem: QueriedImage) =>
          getStableObject(elem),
        );
        expect(data).toHaveLength(2);
        expect(data).toEqual(SAMPLE_IMAGES);
      },
      { limit: '2' },
    );
  });

  it('properly accepts limit and offset query params', async () => {
    await testApiHandlerGeneric(
      async ({ fetch }) => {
        const res = await fetch();

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/json');

        const data = (await res.json()).map((elem: QueriedImage) =>
          getStableObject(elem),
        );
        expect(data).toHaveLength(1);
        expect(data).toEqual(SAMPLE_IMAGES.slice(1));
      },
      {},
      '/api/images/?limit=1&offset=1',
    );
  });
});
