import fs from 'fs/promises';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';
import { ProcessImageInput } from './types';
import { getPrismaClient } from '@/prisma/client-handle';
import generate_thumbnail from './generate-thumbnail';
import get_metadata from './get-metadata';
import upload_image from './upload-image';
import { getUniqueFileName } from './get-unique-file-name';

export async function process_upload(
  input: ProcessImageInput,
  imagesDir: string,
  thumbnailDir: string,
): Promise<ImageModel> {
  let fullPath: string | null = null;
  let thumbnailPath: string | null = null;
  let dbRecordId: number | null = null;

  let prisma = getPrismaClient();

  // Generate unique file name to avoid duplicates
  const uniqueFileName = getUniqueFileName(input.filename);
  console.debug('Got unqiue file name', uniqueFileName);
  const newImageInput: ProcessImageInput = {
    buffer: input.buffer,
    filename: uniqueFileName,
  };

  try {
    // 1. Write original file
    fullPath = await upload_image(newImageInput, imagesDir);

    // 2. Metadata
    const metadata = await get_metadata(newImageInput);

    // 3. Generate thumbnail
    thumbnailPath = await generate_thumbnail(newImageInput, thumbnailDir);

    // 4. Insert DB record
    const image = await prisma.image.create({
      data: {
        fullPath,
        thumbnailPath: thumbnailPath || fullPath,
        originalFileName: input.filename,
        ...metadata,
      },
    });

    dbRecordId = image.id;

    prisma.$disconnect();
    return image;
  } catch (error) {
    // ---- COMPENSATION / ROLLBACK ----
    console.error(error);

    // Delete DB row if created
    if (dbRecordId) {
      await prisma.image.delete({ where: { id: dbRecordId } }).catch(() => {});
    }
    prisma.$disconnect();

    // Delete files if created
    if (fullPath) {
      await fs.unlink(fullPath).catch(() => {});
    }

    if (thumbnailPath) {
      await fs.unlink(thumbnailPath).catch(() => {});
    }

    throw error;
  }
}
