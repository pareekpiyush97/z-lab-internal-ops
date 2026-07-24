import { NextRequest, NextResponse } from 'next/server';
import { galleryItemSchema } from '@/lib/validation';
import { listGallery, createGalleryItem } from '@/lib/repo';

export async function GET() {
  const gallery = await listGallery();
  return NextResponse.json({ gallery });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = galleryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const item = await createGalleryItem({
    ...parsed.data,
    wide: parsed.data.wide ?? false,
    sortOrder: parsed.data.sortOrder ?? 0,
    isActive: parsed.data.isActive ?? true,
  });
  return NextResponse.json({ item }, { status: 201 });
}
