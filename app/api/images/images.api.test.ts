import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as appHandler from './route';
import { get_image_paths, QueriedImage } from '@/app/data/images';
import { ImageModel } from '@/prisma/generated/prisma/models';

type SampleImage = Omit<ImageModel, 'ImageTags'>;

const SAMPLE_IMAGES = [
  {
    id: 1,
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
    createdAt: new Date(),
    ImageTags: [],
  },
  {
    id: 2,
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
    createdAt: new Date(),
    ImageTags: [],
  },
];

function getStableObject(obj: SampleImage) {
  const newObj = { ...obj };
  newObj.createdAt = new Date(newObj.createdAt);
  return newObj;
}

async function testApiHandlerGeneric(
  test: ({ fetch }: { fetch: any }) => Promise<void>,
  url: string,
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

  it('calls get_image_paths only once', async () => {
    vi.mock('@/app/data/images', { spy: true });

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');

      expect(get_image_paths).toHaveBeenCalledTimes(1);
    }, '/api/images');
  });

  it('returns JSON matching that server action output', async () => {
    vi.mock('@/app/data/images', { spy: true });
    vi.mocked(get_image_paths).mockResolvedValue(SAMPLE_IMAGES);

    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');

      const data = (await res.json()).map((elem: SampleImage) =>
        getStableObject(elem),
      );
      expect(data).toEqual(SAMPLE_IMAGES);
    }, '/api/images');
  });

  it('properly accepts limit and offset query params', async () => {
    vi.mocked(get_image_paths).mockResolvedValue([SAMPLE_IMAGES[1]]);
    await testApiHandlerGeneric(async ({ fetch }) => {
      const res = await fetch();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');

      const data = (await res.json()).map((elem: SampleImage) =>
        getStableObject(elem),
      );
      expect(data).toEqual(SAMPLE_IMAGES.slice(1));
    }, '/api/images?limit=1&offset=1');
  });
});
