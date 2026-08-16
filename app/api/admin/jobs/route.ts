import { NextRequest, NextResponse } from 'next/server';
import { jobIntakeSchema } from '@/lib/validation';
import { listJobs, createJob } from '@/lib/repo';

// A random plate is a placeholder for the future fixed-camera ANPR
// integration -- same simulated behavior as the prototype's fakePlate().
// Swap this for a real plate-recognition result once that phase lands.
const STATE_CODES = ['DL', 'UP16', 'HR26', 'UP14', 'DL8C'];
function fakeSuggestedPlate(): string {
  const s = STATE_CODES[Math.floor(Math.random() * STATE_CODES.length)];
  const l1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const l2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${s} ${l1}${l2} ${digits}`;
}

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = jobIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const job = await createJob({
    customerName: parsed.data.customerName,
    phone: parsed.data.phone?.trim() || '',
    carModel: parsed.data.carModel ?? null,
    customerPlate: parsed.data.customerPlate ? parsed.data.customerPlate.toUpperCase() : null,
    suggestedPlate: fakeSuggestedPlate(),
    services: parsed.data.services,
    price: parsed.data.price ?? null,
  });

  return NextResponse.json({ job }, { status: 201 });
}
