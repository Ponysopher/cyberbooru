import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
import { beforeAll } from 'vitest';

beforeAll(() => {
  if (!process.env.BASE_IMAGES_PATH) {
    throw new Error('BASE_IMAGES_PATH environment variable is not set.');
  }
});
