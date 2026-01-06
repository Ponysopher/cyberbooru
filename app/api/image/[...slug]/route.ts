// app/api/images/[...slug]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
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

    // Check existence and get stats
    const stats = await fs.stat(absoluteImagePath).catch(() => null);
    if (!stats || !stats.isFile()) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Open file and get Web ReadableStream
    const fileHandle = await fs.open(absoluteImagePath);
    const stream = fileHandle.readableWebStream();

    const contentType = getContentType(absoluteImagePath);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        // Optional: cache control for images
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
