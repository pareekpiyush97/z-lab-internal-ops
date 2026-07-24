'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';

export default function ActiveJobRow({
  job,
  onSave,
  onDeliver,
}: {
  job: Job;
  onSave: (phone: string) => Promise<string | void>;
  onDeliver: () => Promise<string | void>;
}) {
  const [phone, setPhone] = useState(job.phone);
  const [busy, setBusy] = useState<'save' | 'deliver' | null>(null);
  const [error, setError] = useState('');
  const dirty = phone !== job.phone;

  const save = async () => {
    setBusy('save');
    setError('');
    const err = await onSave(phone.trim());
    setBusy(null);
    if (err) setError(err);
  };

  const deliver = async () => {
    if (!confirm(`Mark ${job.jobNumber} as delivered? This closes the job out.`)) return;
    setBusy('deliver');
    setError('');
    const err = await onDeliver();
    setBusy(null);
    if (err) setError(err);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-32 rounded-md border border-slate-300 px-1.5 py-1 text-xs"
        />
        {dirty && (
          <button
            onClick={save}
            disabled={busy !== null}
            className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-md transition-colors disabled:opacity-60"
          >
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
        )}
        <button
          onClick={deliver}
          disabled={busy !== null}
          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {busy === 'deliver' ? 'Saving…' : 'Deliver'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
