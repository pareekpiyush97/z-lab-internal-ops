'use client';

import { adminFetch } from '@/lib/adminFetch';

import { useState } from 'react';
import type { Service } from '@/lib/types';

type FormState = {
  id?: string;
  key: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  duration: string;
  warranty: string;
  process: string; // comma-separated in the UI, array on the wire
  benefits: string; // comma-separated in the UI, array on the wire
  sortOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  key: '',
  title: '',
  tagline: '',
  description: '',
  imageUrl: '',
  duration: '',
  warranty: '',
  process: '',
  benefits: '',
  sortOrder: 0,
  isActive: true,
};

function toForm(s: Service): FormState {
  return {
    id: s.id,
    key: s.key,
    title: s.title,
    tagline: s.tagline,
    description: s.description,
    imageUrl: s.imageUrl,
    duration: s.duration,
    warranty: s.warranty,
    process: s.process.join(', '),
    benefits: s.benefits.join(', '),
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  };
}

export default function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await adminFetch('/api/admin/services');
    const body = await res.json();
    setServices(body.services);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    setSaving(true);
    const payload = {
      key: form.key,
      title: form.title,
      tagline: form.tagline,
      description: form.description,
      imageUrl: form.imageUrl,
      duration: form.duration,
      warranty: form.warranty,
      process: form.process.split(',').map((p) => p.trim()).filter(Boolean),
      benefits: form.benefits.split(',').map((b) => b.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      const res = await fetch(form.id ? `/api/admin/services/${form.id}` : '/api/admin/services', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Save failed.');
      await refresh();
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    await adminFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const toggleActive = async (s: Service) => {
    await adminFetch(`/api/admin/services/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    await refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-paperdim">{services.length} service(s). Inactive services are hidden from the site.</p>
        <button
          className="text-sm bg-accent text-ink font-semibold px-4 py-2 rounded"
          onClick={() => setForm({ ...EMPTY, sortOrder: services.length })}
        >
          + Add service
        </button>
      </div>

      <div className="grid gap-3">
        {services.map((s) => (
          <div key={s.id} className="rounded-lg border border-line bg-panel p-4 flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.imageUrl} alt="" className="w-20 h-20 object-cover rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.title}</h3>
                <span className="text-xs text-paperdim font-mono">#{s.key}</span>
                {!s.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-panel2 text-paperdim">hidden</span>
                )}
              </div>
              <p className="text-sm text-paperdim mt-1 truncate">{s.tagline}</p>
              <p className="text-xs text-paperdim mt-1">
                {s.duration} · {s.warranty}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button className="text-xs text-accent hover:underline" onClick={() => setForm(toForm(s))}>
                Edit
              </button>
              <button className="text-xs text-paperdim hover:underline" onClick={() => toggleActive(s)}>
                {s.isActive ? 'Hide' : 'Show'}
              </button>
              <button className="text-xs text-red-400 hover:underline" onClick={() => remove(s.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={submit} className="bg-panel border border-line rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h3 className="font-semibold mb-4">{form.id ? 'Edit service' : 'New service'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-paperdim col-span-1">
                Key (slug)
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-1">
                Sort order
                <input type="number" className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Title
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Tagline (card subtitle)
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Description (modal body)
                <textarea className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Image URL
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-1">
                Duration
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-1">
                Warranty
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.warranty}
                  onChange={(e) => setForm({ ...form, warranty: e.target.value })} required />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Process steps (comma-separated)
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.process}
                  onChange={(e) => setForm({ ...form, process: e.target.value })} />
              </label>
              <label className="text-xs text-paperdim col-span-2">
                Benefit pills (comma-separated)
                <input className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm" value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
              </label>
              <label className="text-xs text-paperdim col-span-2 flex items-center gap-2 mt-1">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Visible on site
              </label>
            </div>

            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={saving} className="bg-accent text-ink font-semibold px-4 py-2 rounded text-sm disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setForm(null)} className="px-4 py-2 rounded text-sm border border-line">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
