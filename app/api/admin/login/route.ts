import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation';
import { getAdminByUsername, touchAdminLogin } from '@/lib/repo';
import { createSession } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  // Deliberately tight: 10 attempts / 5 min / IP to blunt password guessing.
  const limit = rateLimit(`login:${ip}`, 10, 5 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const admin = await getAdminByUsername(username);

  // Same generic error whether the user doesn't exist or the password is
  // wrong -- avoids leaking which usernames are valid.
  const genericError = () => NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });

  // Google-only admins have no local password to compare against.
  if (!admin || !admin.passwordHash) return genericError();

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return genericError();

  await createSession({ sub: admin.id, username: admin.username, role: admin.role });
  await touchAdminLogin(admin.id);

  return NextResponse.json({ ok: true });
}
