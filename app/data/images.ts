import { getPrismaClient } from '@/prisma/client-handle';

export interface ImageInfo {
  id: number;
  filePath: string;
  thumbnailPath: string;
  createdAt: Date;
  tags: string[];
}

const BASE_IMAGES_PATH = process.env.BASE_IMAGES_PATH;

export async function get_image_paths(
  limit: number = 10,
  offset?: number,
): Promise<ImageInfo[]> {
  const prisma = getPrismaClient();
  let images: ImageInfo[] = [];
  try {
    if (!BASE_IMAGES_PATH) {
      throw new Error('BASE_IMAGES_PATH is not defined');
    }

    const queriedImages = await prisma.image.findMany({
      take: limit,
      skip: offset || 0,
      orderBy: { id: 'desc' }, // last inserted images (highest IDs)
      include: {
        ImageTags: {
          // join on ImageTags table
          include: {
            tag: { select: { id: true, name: true } }, // Fetch tag id and name
          },
        },
      },
    });

    // Format the result for clean output
    const formattedImages = queriedImages.map((image) => ({
      id: image.id,
      filePath: image.fullPath,
      thumbnailPath: image.thumbnailPath,
      createdAt: image.createdAt,
      tags: image.ImageTags.map(({ tag }) => tag.name), // Extract tag names
    }));

    images = formattedImages;
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  return images;
}
