import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { getContentType } from '@/app/util/image-exts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const { slug } = await params;
    const imagePath = slug.join('/');

    // Security: Prevent directory traversal (e.g., ../../etc/passwd)
    if (imagePath.includes('..') || imagePath.includes('/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const absoluteImagePath = path.join(
      process.env.BASE_IMAGES_PATH || '',
      imagePath,
    );

    const stats = await fsPromises.stat(absoluteImagePath);
    if (!stats.isFile()) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const stream = fs.createReadStream(absoluteImagePath);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        'Content-Type': getContentType(absoluteImagePath),
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
