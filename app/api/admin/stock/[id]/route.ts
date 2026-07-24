import { NextRequest, NextResponse } from 'next/server';
import { stockAdjustSchema } from '@/lib/validation';
import { adjustStockQty, deleteStockItem } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = stockAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const item = await adjustStockQty(id, parsed.data.delta);
  if (!item) return NextResponse.json({ error: 'Stock item not found.' }, { status: 404 });

  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteStockItem(id);
  if (!ok) return NextResponse.json({ error: 'Stock item not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
