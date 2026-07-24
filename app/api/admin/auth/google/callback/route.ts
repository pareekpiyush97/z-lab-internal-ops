import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, resolveAdminRole } from '@/lib/google-auth';
import { getAdminByUsername, createGoogleAdmin, touchAdminLogin, updateAdminRole } from '@/lib/repo';
import { createSession } from '@/lib/auth';

function loginError(request: NextRequest, message: string) {
  const url = new URL('/admin/login', request.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('google_oauth_state')?.value;

  // Covers both a forged/replayed callback and a plain expired/cancelled flow.
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError(request, 'Google sign-in failed (invalid or expired request). Please try again.');
  }

  const redirectUri = new URL('/api/admin/auth/google/callback', request.url).toString();

  let profile;
  try {
    profile = await exchangeGoogleCode(code, redirectUri);
  } catch (err) {
    console.error('[google-auth] token exchange/verification failed:', err);
    return loginError(request, 'Google sign-in failed. Please try again.');
  }

  if (!profile.emailVerified) {
    return loginError(request, "That Google account's email address is not verified.");
  }

  const role = resolveAdminRole(profile.email);
  if (!role) {
    return loginError(request, `${profile.email} is not authorized for TechPlus OS access.`);
  }

  let admin = await getAdminByUsername(profile.email);
  if (!admin) {
    admin = await createGoogleAdmin(profile.email, role);
  } else if (admin.role !== role) {
    // Env allowlists are the source of truth; if someone's role changed
    // there (e.g. promoted staff -> owner), pick that up on next login
    // rather than trusting whatever role was stored at first sign-in.
    await updateAdminRole(admin.id, role);
    admin = { ...admin, role };
  }

  await createSession({ sub: admin.id, username: admin.username, role: admin.role });
  await touchAdminLogin(admin.id);

  const res = NextResponse.redirect(new URL('/admin', request.url));
  res.cookies.set('google_oauth_state', '', { path: '/', maxAge: 0 });
  return res;
}
