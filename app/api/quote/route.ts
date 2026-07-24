import { NextRequest, NextResponse } from 'next/server';
import { quoteSchema } from '@/lib/validation';
import { createLead, getServiceByKey } from '@/lib/repo';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`quote:${ip}`, 8, 60_000); // 8 submissions/min/IP
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid input.' },
      { status: 400 }
    );
  }

  const { name, phone, serviceKey, message } = parsed.data;

  let resolvedServiceKey: string | null = null;
  let serviceTitle: string | null = null;
  if (serviceKey) {
    const service = await getServiceByKey(serviceKey);
    if (service) {
      resolvedServiceKey = service.key;
      serviceTitle = service.title;
    }
  }

  const lead = await createLead({
    name,
    phone,
    serviceKey: resolvedServiceKey,
    message: message ?? null,
    source: 'website',
  });

  // No-op today (deep-link mode); becomes a real WhatsApp Business API send
  // once that add-on phase is wired up -- see lib/whatsapp.ts.
  await getWhatsAppProvider().notifyNewLead({ name, phone, serviceTitle });

  return NextResponse.json({ id: lead.id, status: lead.status }, { status: 201 });
}
