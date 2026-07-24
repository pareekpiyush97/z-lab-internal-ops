import { NextResponse } from 'next/server';
import { listGallery } from '@/lib/repo';

export async function GET() {
  const gallery = await listGallery({ activeOnly: true });
  return NextResponse.json({ gallery });
}
