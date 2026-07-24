import { NextRequest, NextResponse } from 'next/server';
import { reminderCreateSchema } from '@/lib/validation';
import { listReminders, createReminder } from '@/lib/repo';

export async function GET() {
  const reminders = await listReminders();
  return NextResponse.json({ reminders });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = reminderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const reminder = await createReminder(parsed.data.text, parsed.data.dueDate ?? null);
  return NextResponse.json({ reminder }, { status: 201 });
}
