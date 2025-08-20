// app/api/images/[...slug]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getContentType } from '@/app/util/image-exts';

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  try {
    // Join the path segments from the slug to form the image path
    const imagePath = (await params).slug.join('/');
    // absolute path to the image directory
    const absoluteImagePath = path.join(
      process.env.BASE_IMAGES_PATH || '',
      imagePath
    );

    // Check if the file exists
    if (!fs.existsSync(absoluteImagePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the file stream
    const fileStream = fs.createReadStream(absoluteImagePath);

    // Determine the content type based on the file extension
    const contentType = getContentType(absoluteImagePath);

    // Return the stream with the correct headers
    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

