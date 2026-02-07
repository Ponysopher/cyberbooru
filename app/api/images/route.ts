import { NextResponse } from 'next/server';
import { get_image_paths } from '@/app/data/images';

const HARD_LIMIT = 10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ limit?: string; offset?: string }> },
) {
  const limit = Math.min(
    parseInt((await params)?.limit || HARD_LIMIT.toString(), 10),
    HARD_LIMIT,
  );

  try {
    const images = await get_image_paths(limit);
    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch images' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
