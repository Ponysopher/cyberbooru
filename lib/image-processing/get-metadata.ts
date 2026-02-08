import sharp from 'sharp';
import cypto from 'crypto';
import { ImageMetadata } from './types';

export default async function get_image_buffer_metadata(
  imageFile: File,
): Promise<ImageMetadata> {
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const buffer = await image.toBuffer();
    return {
      width: metadata.width || null,
      height: metadata.height || null,
      mimeType: `image/${metadata.format}`,
      sha256Hash: cypto.createHash('sha256').update(buffer).digest('hex'),
      fileSizeKB: Math.round((imageFile.size || 0) / 1024),
      nsfw: true,
    };
  } catch (error) {
    console.error(`Could not acquire metadata with sharp or crypto`, error);
    throw error;
  }
}
