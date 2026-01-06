import { PrismaClient } from '#prisma/index.js';

export interface ImageInfo {
  id: number;
  filePath: string;
  createdAt: Date;
  tags: string[];
}

export async function get_image_paths(
  limit: number = 10,
): Promise<ImageInfo[]> {
  const prisma = new PrismaClient();
  let images: ImageInfo[] = [];
  try {
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
      filePath: image.fullPath,
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
