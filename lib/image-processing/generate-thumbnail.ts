import path from 'path';
import sharp from 'sharp';
import { ProcessImageInput } from './types';

export default async function generate_thumbnail(
  image: ProcessImageInput,
  thumbnailDir: string,
): Promise<string | null> {
  if (!thumbnailDir) {
    console.warn(
      'BASE_THUMBNAILS_PATH environment variable is not set. Thumbnails will not be generated.',
    );
    return null;
  }

  const thumbnailPath = path.join(thumbnailDir, image.filename);
  await sharp(image.buffer).resize(300, 300).toFile(thumbnailPath);

  if (!thumbnailPath) {
    console.error(`Could not generate thumbnail for ${image.filename}`);
    return null;
  } else return thumbnailPath;
}
