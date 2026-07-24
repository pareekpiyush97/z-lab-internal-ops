import { NextRequest, NextResponse } from 'next/server';
import { servicePatchSchema } from '@/lib/validation';
import { updateService, deleteService } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = servicePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const service = await updateService(id, parsed.data);
  if (!service) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });

  return NextResponse.json({ service });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteService(id);
  if (!ok) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
