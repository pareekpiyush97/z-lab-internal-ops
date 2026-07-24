import { NextRequest, NextResponse } from 'next/server';
import { serviceSchema } from '@/lib/validation';
import { listServices, createService, getServiceByKey } from '@/lib/repo';

export async function GET() {
  const services = await listServices();
  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const existing = await getServiceByKey(parsed.data.key);
  if (existing) {
    return NextResponse.json({ error: `A service with key "${parsed.data.key}" already exists.` }, { status: 409 });
  }

  const service = await createService({
    ...parsed.data,
    sortOrder: parsed.data.sortOrder ?? 0,
    isActive: parsed.data.isActive ?? true,
  });
  return NextResponse.json({ service }, { status: 201 });
}
