import { NextRequest, NextResponse } from 'next/server';
import { leadPatchSchema } from '@/lib/validation';
import { updateLead, deleteLead } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = leadPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const lead = await updateLead(id, parsed.data);
  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  return NextResponse.json({ lead });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
