import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { getContentType } from '@/app/util/image-exts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const { slug } = await params;
    const imagePath: string = decodeURIComponent(slug.slice(-1)[0]);

    // Security: Prevent directory traversal (e.g., ../../etc/passwd)
    if (imagePath.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (
      !fs.existsSync(imagePath) ||
      !(await fsPromises.stat(imagePath)).isFile()
    ) {
      console.error('Image not found:', imagePath);
      return new NextResponse('Image not found', { status: 404 });
    }

    const stats = await fsPromises.stat(imagePath);
    if (!stats.isFile()) {
      console.error('Path is not a file: ', imagePath);
      return new NextResponse('Image not found', { status: 404 });
    }

    const stream = fs.createReadStream(imagePath);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        'Content-Type': getContentType(imagePath),
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
