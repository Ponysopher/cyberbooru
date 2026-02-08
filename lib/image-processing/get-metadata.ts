import sharp from 'sharp';
import cypto from 'crypto';
import { ImageMetadata, ProcessImageInput } from './types';

export default async function get_metadata(
  imageData: ProcessImageInput,
): Promise<ImageMetadata> {
  try {
    const image = sharp(imageData.buffer);
    const metadata = await image.metadata();
    return {
      width: metadata.width || null,
      height: metadata.height || null,
      mimeType: `image/${metadata.format}`,
      sha256Hash: cypto
        .createHash('sha256')
        .update(imageData.buffer)
        .digest('hex'),
      fileSizeKB: Math.round((metadata.size || 0) / 1024),
      nsfw: true,
    };
  } catch (error) {
    console.error(`Could not acquire metadata with sharp or crypto`, error);
    throw error;
  }
}
