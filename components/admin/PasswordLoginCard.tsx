'use client';

import { useState } from 'react';

export default function PasswordLoginCard() {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (pw.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pw }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || 'Could not update password.');
        return;
      }
      setMsg('Password updated. Log in with username "admin" and this new password from any device.');
      setPw('');
      setConfirm('');
    } catch {
      setError('Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl grid gap-4 border-t border-line pt-8 mt-10">
      <div>
        <h2 className="text-lg font-semibold text-paper">Password login</h2>
        <p className="text-xs text-paperdim mt-1">
          Set or change the shared password used to sign in without Google. Log in with username{' '}
          <span className="font-mono text-paper">admin</span> and this password from any device.
        </p>
      </div>

      <label className="text-xs text-paperdim block">
        New password
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full bg-panel2 border border-line rounded px-3 py-2 text-sm text-paper"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </label>

      <label className="text-xs text-paperdim block">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full bg-panel2 border border-line rounded px-3 py-2 text-sm text-paper"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && !error && <p className="text-sm text-accent">{msg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="justify-self-start bg-accent text-ink font-medium text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
