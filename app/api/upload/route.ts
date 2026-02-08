import { NextResponse } from 'next/server';
import { SUPPORTED_IMAGE_FORMATS_REGEX } from '@/constants';

interface FileUploadResult {
  name: string;
  size: number;
  type: string;
  success: boolean;
}

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

  const fileUploadResults: FileUploadResult[] = [];
  for (const file of files) {
    // console.log(file.name, file.size, file.type);
    // file.arrayBuffer() is available here
    try {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
      };
      console.log(fileData);

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

      fileUploadResults.push({ success: true, ...fileData });
    } catch (error) {
      console.error('Processing error', error);
      return NextResponse.json(
        { error: 'Unsupported Media Type', value: file.type },
        { status: 415 },
      );
    }
  }

  return NextResponse.json(fileUploadResults, { status: 201 });
}
