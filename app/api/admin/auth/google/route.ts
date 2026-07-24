import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { buildGoogleAuthUrl } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  const redirectUri = new URL('/api/admin/auth/google/callback', request.url).toString();
  const state = randomBytes(16).toString('hex');

  let authUrl: string;
  try {
    authUrl = buildGoogleAuthUrl(redirectUri, state);
  } catch (err) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set(
      'error',
      err instanceof Error ? err.message : 'Google sign-in is not configured yet.'
    );
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes -- just long enough to complete the redirect round trip
  });
  return res;
}
