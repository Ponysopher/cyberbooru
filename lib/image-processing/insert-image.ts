import { getPrismaClient } from '@/prisma/client-handle';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';

export default async function insert_image(
  imageData: ImageModel,
): Promise<ImageModel | undefined> {
  const prisma = getPrismaClient();
  let image: ImageModel | undefined;
  try {
    image = await prisma.image.create({
      data: imageData,
    });
  } catch (error) {
    console.error(error);
  } finally {
    prisma.$disconnect();
  }
  return image;
}
