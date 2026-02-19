import fs from 'fs';
import path from 'path';

const TEST_IMAGE_FILENAMES = fs
  .readdirSync(process.env.BASE_IMAGES_PATH!)
  .filter((fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff'].includes(
      ext,
    );
  });
export default TEST_IMAGE_FILENAMES;
