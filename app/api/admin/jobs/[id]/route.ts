import { NextRequest, NextResponse } from 'next/server';
import { jobPatchSchema } from '@/lib/validation';
import { updateJob } from '@/lib/repo';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = jobPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  // Starting work (New -> Working) requires at least one work item and a price.
  if (parsed.data.status === 'active') {
    if (!parsed.data.services?.length || !parsed.data.price || parsed.data.price <= 0) {
      return NextResponse.json(
        { error: 'Add at least one work item and a price to start the work.' },
        { status: 400 }
      );
    }
  }

  const job = await updateJob(id, parsed.data);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  return NextResponse.json({ job });
}
