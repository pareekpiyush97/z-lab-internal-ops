'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';

// One row-level control used for cars that are "Working" or "Ready":
// lets staff fix the phone number and do the next step
// (Work Complete, or Deliver).
export default function JobActionRow({
  job,
  actionLabel,
  tone,
  confirmMsg,
  onAction,
  onSavePhone,
}: {
  job: Job;
  actionLabel: string;
  tone: 'blue' | 'green';
  confirmMsg?: string;
  onAction: () => Promise<string | void>;
  onSavePhone: (phone: string) => Promise<string | void>;
}) {
  const [phone, setPhone] = useState(job.phone);
  const [busy, setBusy] = useState<'save' | 'action' | null>(null);
  const [error, setError] = useState('');
  const dirty = phone !== job.phone;

  const save = async () => {
    setBusy('save');
    setError('');
    const err = await onSavePhone(phone.trim());
    setBusy(null);
    if (err) setError(err);
  };

  const act = async () => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy('action');
    setError('');
    const err = await onAction();
    setBusy(null);
    if (err) setError(err);
  };

  const btnColor = tone === 'green' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-28 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-1.5 py-1 text-xs"
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
          onClick={act}
          disabled={busy !== null}
          className={`text-xs text-white px-2.5 py-1 rounded-md transition-colors disabled:opacity-60 whitespace-nowrap ${btnColor}`}
        >
          {busy === 'action' ? 'Saving…' : actionLabel}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
