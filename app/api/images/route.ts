import { NextResponse } from 'next/server';
import { get_image_paths } from '@/app/data/images';

const HARD_LIMIT = 10

export async function GET(request: Request) {
  const limit = Math.min(
    parseInt((new URL(request.url)).searchParams.get("limit") || HARD_LIMIT.toString(), 10), 
    HARD_LIMIT)
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
      }
    );
  }
}