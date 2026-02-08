import { NextResponse } from 'next/server';
import { get_image_paths } from '@/app/data/images';

const HARD_LIMIT = 10;

export async function GET(_request: Request) {
  const queryParams = new URL(_request.url).searchParams;
  const limit = Math.min(
    parseInt(queryParams.get('limit') || HARD_LIMIT.toString(), 10),
    HARD_LIMIT,
  );

  const offset = parseInt(queryParams.get('limit') || '0', 10);

  try {
    const images = await get_image_paths(limit, offset);
    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
