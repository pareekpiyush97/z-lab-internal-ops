import { jwtVerify, createRemoteJWKSet } from 'jose';

// "Sign in with Google" for the admin dashboard -- a hand-rolled OAuth2
// Authorization Code flow (no extra dependency: `jose`, already used for
// session JWTs, also verifies Google's ID token signature via their public
// JWKS). Access is gated by ALLOWED_OWNER_EMAILS / ALLOWED_STAFF_EMAILS, not
// by anything Google tells us -- Google only proves *which* email the
// person owns, not whether (or how) they're allowed into this app.

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getGoogleJWKS() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  return jwks;
}

function getGoogleClientConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env -- see README "Google sign-in setup".'
    );
  }
  return { clientId, clientSecret };
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getGoogleClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name?: string;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = getGoogleClientConfig();

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => '');
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${detail.slice(0, 300)}`);
  }

  const tokenBody = (await tokenRes.json()) as { id_token?: string };
  if (!tokenBody.id_token) {
    throw new Error('Google did not return an id_token.');
  }

  // Verifies the token's signature against Google's live public keys and
  // checks issuer + audience -- not just decoding the payload unchecked.
  const { payload } = await jwtVerify(tokenBody.id_token, getGoogleJWKS(), {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  if (typeof payload.email !== 'string') {
    throw new Error('Google ID token did not include an email claim.');
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

function parseEmailList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Two allowlists, not one: ALLOWED_OWNER_EMAILS gets full access (P&L,
 * purchases, reminders, business settings); ALLOWED_STAFF_EMAILS gets
 * shop-floor-only access (Jobs, Stock, Service History). Anyone on neither
 * list is rejected even with a perfectly valid Google session -- Google only
 * proves *who* signed in, never *whether* they're allowed in here.
 */
export function resolveAdminRole(email: string): 'owner' | 'staff' | null {
  const normalized = email.trim().toLowerCase();
  if (parseEmailList(process.env.ALLOWED_OWNER_EMAILS).includes(normalized)) return 'owner';
  if (parseEmailList(process.env.ALLOWED_STAFF_EMAILS).includes(normalized)) return 'staff';
  return null;
}
