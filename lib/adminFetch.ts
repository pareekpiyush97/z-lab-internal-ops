// Client-side wrapper for admin API calls. If the session has expired the
// API responds 401; instead of failing silently or surfacing a raw
// "Unauthorized" error, send the user to the login page (preserving where
// they were) so they can sign back in and continue.
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== 'undefined') {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
  }
  return res;
}
