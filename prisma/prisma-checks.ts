import { PrismaClient } from '#prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    // Query the first 10 images with their tags
  const firstImages = await prisma.image.findMany({
    take: 10,
    orderBy: { id: 'asc' }, // First inserted images (lowest IDs)
    include: {
      ImageTags: {
        include: {
          tag: { select: { id: true, name: true } } // Fetch tag id and name
        }
      }
    }
  });

  // Format the result for clean output
  const formattedImages = firstImages.map(image => ({
    id: image.id,
    filePath: image.filePath,
    createdAt: image.createdAt,
    tags: image.ImageTags.map(({tag}) => tag.name) // Extract tag names
  }));

  console.log('First 10 Images with Tags:\n', formattedImages);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


// await prisma.image.delete({where: {id: 4}});
// const images = await prisma.image.findMany({take: 10});
// console.log(images);