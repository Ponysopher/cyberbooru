import fs from 'fs';
import path from 'path';
import { ProcessImageInput } from './types';

export default async function upload_image(
  image: ProcessImageInput,
): Promise<string> {
  const fullDir = process.env.BASE_IMAGES_PATH;
  if (!fullDir) {
    const errorMesage = 'BASE_IMAGES_PATH environment variable is not set.';
    console.error(errorMesage);
    throw new Error(errorMesage);
  }

  const fullPath = path.join(fullDir, image.filename);
  try {
    fs.writeFileSync(fullPath, image.buffer);
    return fullPath;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
