'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';

// Row control for cars that are Working / Ready / Delivered.
// Lets staff fix the phone and the price (payment) if entered wrong, and
// do the next step (Work Complete / Deliver) when there is one.
export default function JobActionRow({
  job,
  actionLabel,
  tone,
  confirmMsg,
  onAction,
  onSaveEdits,
}: {
  job: Job;
  actionLabel?: string;
  tone?: 'blue' | 'green';
  confirmMsg?: string;
  onAction?: () => Promise<string | void>;
  onSaveEdits: (phone: string, price: number | null) => Promise<string | void>;
}) {
  const [phone, setPhone] = useState(job.phone);
  const [price, setPrice] = useState(job.price != null ? String(job.price) : '');
  const [busy, setBusy] = useState<'save' | 'action' | null>(null);
  const [error, setError] = useState('');

  const priceNum = price.trim() === '' ? null : Number(price);
  const dirty = phone !== job.phone || priceNum !== job.price;

  const save = async () => {
    if (price.trim() !== '' && (!Number.isFinite(priceNum as number) || (priceNum as number) < 0)) {
      setError('Enter a valid price.');
      return;
    }
    setBusy('save');
    setError('');
    const err = await onSaveEdits(phone.trim(), priceNum);
    setBusy(null);
    if (err) setError(err);
  };

  const act = async () => {
    if (!onAction) return;
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
          title="Phone"
          onChange={(e) => setPhone(e.target.value)}
          className="w-28 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-1.5 py-1 text-xs"
        />
        <div className="flex items-center rounded-md border border-slate-300 bg-white pl-1.5">
          <span className="text-xs text-slate-400">₹</span>
          <input
            type="number"
            min={0}
            step={50}
            value={price}
            title="Price"
            placeholder="price"
            onChange={(e) => setPrice(e.target.value)}
            className="w-20 bg-transparent text-slate-900 placeholder-slate-400 py-1 pr-1.5 text-xs outline-none"
          />
        </div>
        {dirty && (
          <button
            onClick={save}
            disabled={busy !== null}
            className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-md transition-colors disabled:opacity-60"
          >
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
        )}
        {actionLabel && (
          <button
            onClick={act}
            disabled={busy !== null}
            className={`text-xs text-white px-2.5 py-1 rounded-md transition-colors disabled:opacity-60 whitespace-nowrap ${btnColor}`}
          >
            {busy === 'action' ? 'Saving…' : actionLabel}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
