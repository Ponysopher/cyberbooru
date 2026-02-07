import { getPrismaClient } from '@/prisma/client-handle';
import { Prisma } from '@/prisma/generated/prisma/client';

export type QueriedImage = Prisma.ImageGetPayload<{
  include: { ImageTags: { include: { tag: true } } };
}>;

export async function get_image_paths(
  limit: number = 10,
  offset?: number,
): Promise<QueriedImage[]> {
  if (!process.env.BASE_IMAGES_PATH) {
    throw new Error('BASE_IMAGES_PATH is not defined');
  }

  const prisma = getPrismaClient();
  let images: QueriedImage[] | null = null;
  try {
    images = await prisma.image.findMany({
      take: limit,
      skip: offset || 0,
      orderBy: { id: 'desc' },
      include: {
        ImageTags: {
          include: {
            tag: { select: { id: true, name: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  if (images === null) {
    throw new Error('Failed to fetch images');
  }
  return images;
}
