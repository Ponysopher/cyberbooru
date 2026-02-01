import fs from 'fs';
import sharp from 'sharp';

export interface ThumbnailResult {
  thumbnailPath?: string;
  width?: number;
  height?: number;
}

export default async function generateThumbnail(
  imagePath: string,
  thumbnailPath: string,
): Promise<ThumbnailResult> {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file does not exist: ${imagePath}`);
  }

  if (imagePath === thumbnailPath) {
    throw new Error('Image path and thumbnail path cannot be the same.');
  }

  try {
    await sharp(imagePath).resize(300, 300).toFile(thumbnailPath);
  } catch (err) {
    console.error(`Error generating thumbnail for ${imagePath}:`, err);
    return {};
  }

  const image = sharp(thumbnailPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  return {
    thumbnailPath,
    width,
    height,
  };
}
