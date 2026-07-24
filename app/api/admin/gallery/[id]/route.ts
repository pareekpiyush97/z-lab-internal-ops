import { NextRequest, NextResponse } from 'next/server';
import { galleryItemPatchSchema } from '@/lib/validation';
import { updateGalleryItem, deleteGalleryItem } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = galleryItemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const item = await updateGalleryItem(id, parsed.data);
  if (!item) return NextResponse.json({ error: 'Gallery item not found.' }, { status: 404 });

  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteGalleryItem(id);
  if (!ok) return NextResponse.json({ error: 'Gallery item not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
