import { NextRequest, NextResponse } from 'next/server';
import { searchJobsByPlate } from '@/lib/repo';

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get('plate')?.trim() || '';
  if (!plate) {
    return NextResponse.json({ error: 'Provide a plate to search for.' }, { status: 400 });
  }

  const jobs = await searchJobsByPlate(plate);

  // "Billed" mirrors the P&L revenue rule (draft jobs are only ballpark
  // quotes, not confirmed work) so this number stays consistent with the
  // shop's actual financial reporting elsewhere in the app.
  const billedJobs = jobs.filter((j) => j.status !== 'draft');
  const totalBilled = billedJobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const createdTimestamps = jobs.map((j) => new Date(j.createdAt).getTime());

  const summary = {
    plate: plate.toUpperCase(),
    visits: jobs.length,
    totalBilled,
    firstSeen: jobs.length ? new Date(Math.min(...createdTimestamps)).toISOString() : null,
    lastSeen: jobs.length ? new Date(Math.max(...createdTimestamps)).toISOString() : null,
  };

  return NextResponse.json({ jobs, summary });
}
