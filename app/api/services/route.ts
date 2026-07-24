import { NextResponse } from 'next/server';
import { listServices } from '@/lib/repo';

export async function GET() {
  const services = await listServices({ activeOnly: true });
  return NextResponse.json({ services });
}
