import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllSettings, setSetting } from '@/lib/repo';

const ALLOWED_KEYS = new Set([
  'businessName',
  'addressLine',
  'phoneDisplay',
  'phoneE164',
  'heroEyebrow',
  'heroHeading',
  'heroSub',
  'beforeImageUrl',
  'afterImageUrl',
]);

const patchSchema = z.record(z.string().trim().max(2000));

export async function GET() {
  const settings = await getAllSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
  }

  const entries = Object.entries(parsed.data).filter(([key]) => ALLOWED_KEYS.has(key));
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No recognized setting keys in payload.' }, { status: 400 });
  }

  for (const [key, value] of entries) {
    await setSetting(key, value);
  }

  const settings = await getAllSettings();
  return NextResponse.json({ settings });
}
