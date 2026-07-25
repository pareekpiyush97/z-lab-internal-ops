import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { changePasswordSchema } from '@/lib/validation';
import { getSession } from '@/lib/auth';
import { getAdminByUsername, createAdmin, updateAdminPassword } from '@/lib/repo';

// The single shared password-login account. Anyone with this username +
// password can sign in from any device (no Google account needed) -- used
// as a fallback / shared-access route alongside per-person Google sign-in.
const PASSWORD_LOGIN_USERNAME = 'admin';

export async function POST(request: NextRequest) {
  // Middleware already guarantees a valid session on /api/admin/*, but we
  // re-check here and enforce owner-only for this sensitive action.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  const existing = await getAdminByUsername(PASSWORD_LOGIN_USERNAME);
  if (existing) {
    await updateAdminPassword(existing.id, hash);
  } else {
    await createAdmin(PASSWORD_LOGIN_USERNAME, hash, 'owner');
  }

  return NextResponse.json({ ok: true, username: PASSWORD_LOGIN_USERNAME });
}
