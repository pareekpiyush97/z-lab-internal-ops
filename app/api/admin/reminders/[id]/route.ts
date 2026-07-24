import { NextRequest, NextResponse } from 'next/server';
import { reminderPatchSchema } from '@/lib/validation';
import { toggleReminder, deleteReminder } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = reminderPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const reminder = await toggleReminder(id, parsed.data.done);
  if (!reminder) return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });

  return NextResponse.json({ reminder });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteReminder(id);
  if (!ok) return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
