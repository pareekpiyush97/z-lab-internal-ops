'use client';

import { useState } from 'react';
import type { Reminder, StockItem } from '@/lib/types';

export default function RemindersManager({
  initialReminders,
  lowStockItems,
}: {
  initialReminders: Reminder[];
  lowStockItems: StockItem[];
}) {
  const [reminders, setReminders] = useState(initialReminders);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch('/api/admin/reminders');
    const body = await res.json();
    setReminders(body.reminders);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Enter what needs doing.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), dueDate: dueDate || undefined }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not add reminder.');
        return;
      }
      setText('');
      setDueDate('');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r: Reminder) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/reminders/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !r.done }),
      });
      if (res.ok) await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r: Reminder) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/reminders/${r.id}`, { method: 'DELETE' });
      if (res.ok) await refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {lowStockItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-700 mb-2">Low-stock alerts (automatic)</h2>
          <div className="rounded-xl border border-red-200 bg-red-50 divide-y divide-red-200">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-red-800">
                  <span className="font-medium">{item.name}</span> — {item.qty} {item.unit} left (reorder at {item.lowAt})
                </span>
                <span className="text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{item.category}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Clears automatically once the item is restocked above its low-stock threshold — see Stock &amp; Logistics.
          </p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-700 mb-2">Reminders</h2>
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-sm flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">What needs doing</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60"
        >
          {saving ? 'Adding…' : 'Add reminder'}
        </button>
        {error && <p className="text-xs text-red-600 basis-full">{error}</p>}
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {reminders.length === 0 && <p className="px-4 py-8 text-center text-slate-400 text-sm">No reminders yet.</p>}
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={r.done}
              onChange={() => toggle(r)}
              disabled={busyId === r.id}
              className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
            />
            <div className="flex-1">
              <p className={`text-sm ${r.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{r.text}</p>
              {r.dueDate && <p className="text-xs text-slate-400 mt-0.5">Due {new Date(r.dueDate).toLocaleDateString('en-IN')}</p>}
            </div>
            <button
              onClick={() => remove(r)}
              disabled={busyId === r.id}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
