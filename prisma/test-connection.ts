import { getPrismaClient } from './client-handle';

export async function testPrismaConnection() {
  const prisma = getPrismaClient();
  await prisma.$connect();
  const image1 = await prisma.image.findFirst();
  console.log(image1);
  await prisma.$disconnect();
}

await testPrismaConnection();
