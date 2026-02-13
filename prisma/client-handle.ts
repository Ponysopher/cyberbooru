import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function getPrismaClient(connectionString?: string) {
  const url = connectionString ?? process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}
