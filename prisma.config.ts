// prisma.config.ts
import 'dotenv/config'; // This loads your .env file (optional but recommended)
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma', // Path to your schema (usually this)
  migrations: {
    path: 'prisma/migrations', // Where migrations are stored
  },
  datasource: {
    url: env('DATABASE_URL'), // Pulls from .env
  },
});
