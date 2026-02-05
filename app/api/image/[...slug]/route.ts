import { NextResponse } from 'next/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { getContentType } from '@/app/util/image-exts';

// Helper function to convert Node.js ReadableStream to Web ReadableStream
// This is necessary because NextResponse expects a Web ReadableStream,
// but fs.createReadStream returns a Node.js ReadableStream.
// Failure to convert properly can lead to issues where the response is empty or doesn't stream correctly.
// (e.g., TypeError: Invalid state: ReadableStream is already closed).
// fsPromises.readFile(imagePath) would allow us to read the entire file into memory, but for large images,
// this could lead to high memory usage.
function nodeStreamToWeb(stream: fs.ReadStream): ReadableStream<Uint8Array> {
  const reader = stream[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.next();
      if (done) controller.close();
      else controller.enqueue(new Uint8Array(value));
    },
    cancel() {
      stream.destroy();
    },
  });
}

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

    const stream = nodeStreamToWeb(fs.createReadStream(imagePath));
    return new NextResponse(stream, {
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
