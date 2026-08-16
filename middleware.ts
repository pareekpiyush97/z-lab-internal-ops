import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Edge-runtime route guard for the admin dashboard. Deliberately does NOT
// import lib/auth.ts (which pulls in next/headers' cookies() API meant for
// Server Components/Route Handlers) -- middleware uses NextRequest/Response
// cookies directly instead. Kept in sync with lib/auth.ts's cookie name +
// secret + JWT shape so both verify the exact same token.

const SESSION_COOKIE_NAME = 'techplus_session';

// Owner-only surfaces: business/marketing admin (leads, services, gallery,
// settings, uploads) and the shop's financials (P&L, purchases, reminders).
// Staff get Jobs, Stock (item management, not purchase costs), and Service
// History -- matching the original prototype's staff-console vs
// PIN-gated-owner-console split, just with real auth instead of a PIN.
const OWNER_ONLY_EXACT_PAGES = new Set(['/admin']);
const OWNER_ONLY_PAGE_PREFIXES = ['/admin/pnl', '/admin/services', '/admin/gallery', '/admin/settings'];
const OWNER_ONLY_API_PREFIXES = [
  '/api/admin/pnl',
  '/api/admin/services',
  '/api/admin/gallery',
  '/api/admin/settings',
  '/api/admin/upload',
  '/api/admin/stock-purchases',
];

function isOwnerOnlyPage(pathname: string): boolean {
  return OWNER_ONLY_EXACT_PAGES.has(pathname) || OWNER_ONLY_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

function isOwnerOnlyApi(pathname: string): boolean {
  return OWNER_ONLY_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function getSecretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

async function readSession(request: NextRequest): Promise<{ role: string } | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== 'owner' && payload.role !== 'staff') return null;
    return { role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin/login';
  // The Google OAuth initiate + callback routes ARE the login flow -- they
  // must be reachable without an existing session, same as /api/admin/login.
  const isLoginApi = pathname === '/api/admin/login' || pathname.startsWith('/api/admin/auth/google');

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== 'owner') {
    if (isApi && isOwnerOnlyApi(pathname)) {
      return NextResponse.json({ error: 'Forbidden -- owner access required.' }, { status: 403 });
    }
    if (!isApi && isOwnerOnlyPage(pathname)) {
      return NextResponse.redirect(new URL('/admin/jobs', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
