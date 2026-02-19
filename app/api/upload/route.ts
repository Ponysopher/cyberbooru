import { NextResponse } from 'next/server';
import { SUPPORTED_IMAGE_FORMATS_REGEX } from '@/constants';
import { process_upload } from '@/lib/image-processing/process-upload';
import { inputFromFile } from '@/lib/image-processing/input-adapters';

interface FileReadResult {
  name: string;
  size: number;
  type: string;
  success: boolean;
}

const imagesDir = process.env.BASE_IMAGES_PATH;
if (!imagesDir) throw new Error('process.env.BASE_IMAGES_PATH is not defined');
const thumbnailsDir = process.env.BASE_THUMBNAILS_PATH;
if (!thumbnailsDir)
  throw new Error('process.env.BASE_THUMBNAILS_PATH is not defined');

export async function POST(request: Request) {
  if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Invalid Content Type' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.getAll('file') as File[];
  const files = formData.getAll('files') as File[];
  if (file) files.push(...file);

  const fileReadResults: FileReadResult[] = [];
  for (const file of files) {
    try {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      if (!file.type.toLowerCase().startsWith('image/')) {
        console.error('file type does not start with image/', file.type);
        return NextResponse.json(
          { error: 'Unsupported Media Type', value: file.type },
          { status: 415 },
        );
      }

      const [_fileType, imageType] = file.type.toLowerCase().split('/');
      if (!imageType.match(SUPPORTED_IMAGE_FORMATS_REGEX)) {
        console.error('file type does not match regex', file.type);
        return NextResponse.json(
          { error: 'Unsupported Image Type', value: imageType },
          { status: 415 },
        );
      }

      fileReadResults.push({ success: true, ...fileData });
    } catch (error) {
      console.error('Processing error', error);
      return NextResponse.json(
        { error: 'Unsupported Media Type', value: file.type },
        { status: 415 },
      );
    }
  }

  const dbImages = [];
  for (const file of files) {
    try {
      dbImages.push(
        await process_upload(
          await inputFromFile(file),
          imagesDir!,
          thumbnailsDir!,
        ),
      );
    } catch {
      return NextResponse.json(
        { error: 'Failed up to upload image' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(dbImages, { status: 201 });
}
