'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const oauthError = searchParams.get('error');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Login failed.');
      }
      const next = searchParams.get('next') || '/admin';
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink text-paper font-inter px-4">
      <div className="w-full max-w-sm bg-panel border border-line rounded-xl p-8">
        <div className="text-xs tracking-[0.2em] text-accent uppercase font-mono mb-2">TechPlus OS</div>
        <h1 className="text-xl font-semibold mb-6">Z Lab Design admin</h1>

        {oauthError && <p className="text-sm text-red-400 mb-4">{oauthError}</p>}

        <a
          href="/api/admin/auth/google"
          className="flex items-center justify-center gap-3 w-full rounded border border-line bg-panel2 hover:bg-line transition-colors py-2.5 text-sm font-medium mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5c-7.9 0-14.7 4.5-17.7 11.2z"/>
            <path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.5 35.5 26.9 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.2 39.9 16 44.5 24 44.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 36 44.5 30.6 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
          </svg>
          Sign in with Google
        </a>

        <button
          type="button"
          onClick={() => setShowPasswordForm((v) => !v)}
          className="text-xs text-paperdim hover:text-paper block mx-auto mb-4"
        >
          {showPasswordForm ? 'Hide password sign-in' : 'Use a password instead'}
        </button>

        {showPasswordForm && (
          <form onSubmit={onSubmit}>
            <label className="block text-sm text-paperdim mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="w-full mb-4 rounded border border-line bg-panel2 px-3 py-2 text-sm outline-none focus:border-accent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label className="block text-sm text-paperdim mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full mb-4 rounded border border-line bg-panel2 px-3 py-2 text-sm outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-accent text-ink font-semibold py-2 text-sm disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
