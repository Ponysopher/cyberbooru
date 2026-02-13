import { getPrismaClient } from '@/prisma/client-handle';

export default async function reset_database() {
  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.imageTags.deleteMany(),
    prisma.image.deleteMany(),
    prisma.tag.deleteMany(),
  ]);
  prisma.$disconnect();
}
