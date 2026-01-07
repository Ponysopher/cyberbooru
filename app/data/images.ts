import { getPrismaClient } from '@/prisma/client-handle';

export interface ImageInfo {
  id: number;
  filePath: string;
  createdAt: Date;
  tags: string[];
}

const BASE_IMAGES_PATH = process.env.BASE_IMAGES_PATH;

function strip_base_path(fullPath: string) {
  const baseIndex = fullPath.indexOf(`${BASE_IMAGES_PATH}/`);
  if (baseIndex === -1) return fullPath; // base path not found
  return fullPath.slice(baseIndex + BASE_IMAGES_PATH!.length + 1);
}

export async function get_image_paths(
  limit: number = 10,
): Promise<ImageInfo[]> {
  const prisma = getPrismaClient();
  let images: ImageInfo[] = [];
  try {
    if (!BASE_IMAGES_PATH) {
      throw new Error('BASE_IMAGES_PATH is not defined');
    }

    // Query the first 10 images with their tags
    const firstImages = await prisma.image.findMany({
      take: limit,
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
    const formattedImages = firstImages.map((image) => ({
      id: image.id,
      filePath: strip_base_path(image.fullPath),
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
