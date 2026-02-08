import sharp from 'sharp';
import cypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPrismaClient } from '@/prisma/client-handle';
import generateThumbnail from '@/prisma/seed/generateThumbnail';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';

interface ImageMetadata {
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSizeKB: number;
  sha256Hash: string | null;
  nsfw: boolean;
}

export async function get_image_buffer_metadata(
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

export async function upload_image(imageFile: File): Promise<string> {
  const fullDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir) {
    const errorMesage = 'BASE_IMAGES_PATH environment variable is not set.';
    console.error(errorMesage);
    throw new Error(errorMesage);
  }

  const fullPath = path.join(fullDir, imageFile.name);
  try {
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    fs.writeFileSync(fullPath, imageBuffer);
    return fullPath;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function generate_thumbnail(
  fullPath: string,
): Promise<string | null> {
  const thumbnailDir = process.env.BASE_THUMBNAILS_PATH;
  if (!thumbnailDir) {
    console.warn(
      'BASE_THUMBNAILS_PATH environment variable is not set. Thumbnails will not be generated.',
    );
    return null;
  }
  const thumbnailPath = (
    await generateThumbnail(
      fullPath,
      path.join(thumbnailDir, path.basename(fullPath)),
    )
  ).thumbnailPath;
  if (!thumbnailPath) {
    console.error(`Could not generate thumbnail for ${fullPath}`);
    return null;
  } else return thumbnailPath;
}

export interface RegisteredImage {
  fullPath: string | null;
  thumbnailPath: string | null;
  imageData: ImageModel | null;
}

export async function register_image_buffer(
  imageFile: File,
): Promise<RegisteredImage> {
  const registeredImage: RegisteredImage = {
    fullPath: null,
    thumbnailPath: null,
    imageData: null,
  };

  const { width, height, fileSizeKB, sha256Hash, nsfw } =
    await get_image_buffer_metadata(imageFile);

  try {
    registeredImage.fullPath = await upload_image(imageFile);
  } catch {
    return registeredImage;
  }
  const { fullPath } = registeredImage;
  registeredImage.thumbnailPath = await generate_thumbnail(fullPath);

  const prisma = getPrismaClient();
  try {
    await prisma.image.create({
      data: {
        fullPath,
        thumbnailPath: registeredImage.thumbnailPath || fullPath,
        width,
        height,
        fileSizeKB,
        sha256Hash,
        nsfw,
        source: null,
      },
    });
  } catch (error) {
    console.error(error);
  } finally {
    prisma.$disconnect();
  }

  return registeredImage;
}
