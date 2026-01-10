import fs from 'fs';

export const IMAGE_FILENAME_REGEX = /\.(jpg|jpeg|jfif|png|gif|webp)$/i;

export function scanLocalImages(fullDir: string): string[] {
  if (!fs.existsSync(fullDir)) {
    throw Error(`Directory ${fullDir} does not exist.`);
  }

  return fs
    .readdirSync(fullDir, { recursive: true, encoding: 'utf-8' })
    .filter((file) => IMAGE_FILENAME_REGEX.test(file));
}
