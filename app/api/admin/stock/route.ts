import { NextRequest, NextResponse } from 'next/server';
import { stockItemCreateSchema } from '@/lib/validation';
import { listStockItems, createStockItem } from '@/lib/repo';

export async function GET() {
  const items = await listStockItems();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = stockItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const item = await createStockItem(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
