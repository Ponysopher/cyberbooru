import { getPrismaClient } from '@/prisma/client-handle';
import { Image as ImageModel } from '@/prisma/generated/prisma/client';

export default async function insert_image(image: ImageModel) {
  const prisma = getPrismaClient();
  try {
    await prisma.image.create({
      data: image,
    });
  } catch (error) {
    console.error(error);
  } finally {
    prisma.$disconnect();
  }
}
