import { NextRequest, NextResponse } from 'next/server';
import { leadCreateSchema } from '@/lib/validation';
import { listLeads, createLead } from '@/lib/repo';

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const lead = await createLead({
    name: parsed.data.name,
    phone: parsed.data.phone || '',
    serviceKey: parsed.data.serviceKey ?? null,
    message: null,
    source: 'manual',
  });

  return NextResponse.json({ lead }, { status: 201 });
}
