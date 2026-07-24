'use client';

import { useState } from 'react';

const FIELDS: { key: string; label: string; hint?: string; multiline?: boolean }[] = [
  { key: 'businessName', label: 'Business name' },
  { key: 'addressLine', label: 'Address', multiline: true },
  { key: 'phoneDisplay', label: 'Phone (display)', hint: 'e.g. 099105 03232' },
  { key: 'phoneE164', label: 'Phone (WhatsApp/tel, digits only)', hint: 'e.g. 919910503232' },
  { key: 'heroEyebrow', label: 'Hero eyebrow' },
  { key: 'heroHeading', label: 'Hero heading' },
  { key: 'heroSub', label: 'Hero subtext', multiline: true },
  { key: 'beforeImageUrl', label: 'Before/after — "before" image URL' },
  { key: 'afterImageUrl', label: 'Before/after — "after" image URL' },
];

export default function SettingsForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Save failed.');
      setValues(body.settings);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl grid gap-4">
      {FIELDS.map((field) => (
        <label key={field.key} className="text-xs text-paperdim block">
          {field.label}
          {field.multiline ? (
            <textarea
              className="mt-1 w-full bg-panel2 border border-line rounded px-3 py-2 text-sm text-paper"
              rows={2}
              value={values[field.key] || ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            />
          ) : (
            <input
              className="mt-1 w-full bg-panel2 border border-line rounded px-3 py-2 text-sm text-paper"
              value={values[field.key] || ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            />
          )}
          {field.hint && <span className="block text-[11px] text-paperdim mt-1">{field.hint}</span>}
        </label>
      ))}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedAt && !error && <p className="text-sm text-accent">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="justify-self-start bg-accent text-ink font-semibold px-5 py-2 rounded text-sm disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
