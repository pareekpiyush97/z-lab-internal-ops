import { NextRequest, NextResponse } from 'next/server';
import { stockPurchaseSchema } from '@/lib/validation';
import { listStockPurchases, createStockPurchase } from '@/lib/repo';

export async function GET() {
  const purchases = await listStockPurchases();
  return NextResponse.json({ purchases });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = stockPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const purchase = await createStockPurchase(parsed.data);
  return NextResponse.json({ purchase }, { status: 201 });
}
