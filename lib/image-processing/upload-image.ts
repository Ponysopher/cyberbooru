import fs from 'fs';
import path from 'path';
import { ProcessImageInput } from './types';

export default async function upload_image(
  image: ProcessImageInput,
  imagesDir: string,
): Promise<string> {
  const fullPath = path.join(imagesDir, image.filename);
  try {
    fs.writeFileSync(fullPath, image.buffer);
    return fullPath;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
