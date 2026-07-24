import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// Session layer for the admin dashboard. Uses signed, httpOnly JWT cookies
// (via `jose`, which is edge-runtime safe so middleware.ts can verify the
// same token) rather than a server-side session table -- one less thing to
// persist and expire by hand.
//
// Next.js 15 note: `cookies()` is async here (this project targets Next 15,
// which made the dynamic request APIs return Promises) -- every caller
// below awaits it.

export const SESSION_COOKIE_NAME = 'techplus_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Set a long random value in .env (see .env.example) -- generate one with `openssl rand -base64 48`.'
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // admin user id
  username: string;
  role: 'owner' | 'staff';
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecretKey());
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.username !== 'string' ||
      (payload.role !== 'owner' && payload.role !== 'staff')
    ) {
      return null;
    }
    return { sub: payload.sub, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}
