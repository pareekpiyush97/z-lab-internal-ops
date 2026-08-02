'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';
import { JOB_SERVICES } from '@/lib/job-catalog';

// The "Start Work" panel: confirm the car number, the work to do, and the
// price, then start the work (moves the car to "Working").
export default function JobProcessPanel({
  job,
  onStartWork,
}: {
  job: Job;
  onStartWork: (patch: { confirmedPlate: string; services: string[]; price: number; status: 'active' }) => Promise<string | void>;
}) {
  const [plate, setPlate] = useState(job.customerPlate || job.suggestedPlate || '');
  const [price, setPrice] = useState(job.price ? String(job.price) : '');
  const [services, setServices] = useState<Set<string>>(new Set(job.services));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleService = (s: string) => {
    setServices((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const start = async () => {
    const priceNum = Number(price);
    if (services.size === 0 || !priceNum || priceNum <= 0) {
      setError('Pick at least one work item and enter a price.');
      return;
    }
    setError('');
    setSaving(true);
    const err = await onStartWork({
      confirmedPlate: plate.trim() || job.suggestedPlate || '',
      services: Array.from(services),
      price: priceNum,
      status: 'active',
    });
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <tr className="animate-in">
      <td colSpan={7} className="px-4 py-4 bg-slate-50 border-t border-b border-slate-200">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Car number</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm uppercase"
              />
              <button
                type="button"
                onClick={() => setPlate(job.suggestedPlate || plate)}
                className="flex-shrink-0 text-xs bg-slate-200 hover:bg-slate-300 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Type the number, or tap Auto-fill for the camera suggestion.
            </p>
            <label className="block text-xs font-medium text-slate-500 mb-1 mt-3">Price (₹)</label>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="e.g. 4500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Work to do</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {JOB_SERVICES.map((s) => {
                const checked = services.has(s);
                return (
                  <label
                    key={s}
                    className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-2 cursor-pointer transition-all ${
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleService(s)} />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <button
          onClick={start}
          disabled={saving}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-sm hover:shadow transition-all disabled:opacity-60"
        >
          {saving ? 'Starting…' : 'Start Work'}
        </button>
      </td>
    </tr>
  );
}
