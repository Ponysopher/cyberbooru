import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  for (const file of files) {
    console.log(file.name, file.size, file.type);
    // file.arrayBuffer() is available here
  }

  return NextResponse.json({ success: true });
}
