import { NextRequest, NextResponse } from 'next/server';
import { pnlPeriodSchema } from '@/lib/validation';
import { getPnlSummary } from '@/lib/repo';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('period') || 'today';
  const parsed = pnlPeriodSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid period.' }, { status: 400 });
  }
  const summary = await getPnlSummary(parsed.data);
  return NextResponse.json({ summary });
}
