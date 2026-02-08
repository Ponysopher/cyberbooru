import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import crypto from 'crypto';
import get_metadata from './get-metadata';
import { ProcessImageInput } from './types';

async function createTestImage(
  width: number,
  height: number,
  format: 'jpeg' | 'png' = 'jpeg',
): Promise<ProcessImageInput> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    [format]()
    .toBuffer();

  return {
    buffer,
    filename: `test.${format}`,
  };
}

describe('get_metadata', () => {
  it('extracts width and height', async () => {
    const input = await createTestImage(100, 50);

    const metadata = await get_metadata(input);

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(50);
  });

  it('detects mime type correctly', async () => {
    const input = await createTestImage(10, 10, 'png');

    const metadata = await get_metadata(input);

    expect(metadata.mimeType).toBe('image/png');
  });

  it('produces deterministic sha256 hash', async () => {
    const input = await createTestImage(20, 20);

    const metadata = await get_metadata(input);

    const expectedHash = crypto
      .createHash('sha256')
      .update(input.buffer)
      .digest('hex');

    expect(metadata.sha256Hash).toBe(expectedHash);
  });

  it('calculates file size in KB', async () => {
    const input = await createTestImage(30, 30);

    const metadata = await get_metadata(input);

    const expectedKB = Math.round(input.buffer.length / 1024);

    expect(metadata.fileSizeKB).toBe(expectedKB);
  });

  it('throws on invalid image buffer', async () => {
    const input: ProcessImageInput = {
      buffer: Buffer.from('not-an-image'),
      filename: 'bad.jpg',
    };

    await expect(get_metadata(input)).rejects.toThrow();
  });
});
