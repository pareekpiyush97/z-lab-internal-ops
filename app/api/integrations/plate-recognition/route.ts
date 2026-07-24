import { NextRequest, NextResponse } from 'next/server';
import { plateSightingSchema } from '@/lib/validation';
import { createVehicleSighting } from '@/lib/repo';

// Future integration (not wired to any hardware yet): a fixed, single
// camera running plate recognition on a live stream would POST detections
// here. Nothing today calls this route, and it stays disabled-by-default
// (returns 501) until PLATE_RECOGNITION_WEBHOOK_SECRET is deliberately set
// in .env -- that way the data-ingestion endpoint doesn't sit open on the
// internet during the months before this phase is actually built out.
//
// Rollout plan when this phase starts:
//  1. Point the camera's edge software (or an intermediary like Frigate /
//     OpenALPR / Plate Recognizer's own webhook output) at this URL.
//  2. Send:  POST /api/integrations/plate-recognition
//            header: X-Webhook-Secret: <PLATE_RECOGNITION_WEBHOOK_SECRET>
//            body:   { cameraId, plateNumber, confidence?, imageUrl?, capturedAt? }
//  3. Decide the business logic this should trigger (e.g. auto-match
//     against today's bookings by phone/name, or just surface sightings in
//     a new /admin/sightings page) -- the vehicle_sightings table already
//     has a matchedLeadId column reserved for that matching step.

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.PLATE_RECOGNITION_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      {
        error:
          'Plate recognition integration is not enabled yet. Set PLATE_RECOGNITION_WEBHOOK_SECRET in .env when this phase begins.',
      },
      { status: 501 }
    );
  }

  const providedSecret = request.headers.get('x-webhook-secret');
  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = plateSightingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const sighting = await createVehicleSighting({
    cameraId: parsed.data.cameraId,
    plateNumber: parsed.data.plateNumber,
    confidence: parsed.data.confidence ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    capturedAt: parsed.data.capturedAt ?? new Date().toISOString(),
    matchedLeadId: null,
  });

  return NextResponse.json({ sighting }, { status: 201 });
}
