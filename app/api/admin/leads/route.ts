import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/repo';

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
