'use client';

import { adminFetch } from '@/lib/adminFetch';

import { useRef, useState } from 'react';
import type { GalleryItem } from '@/lib/types';

type FormState = {
  id?: string;
  imageUrl: string;
  caption: string;
  wide: boolean;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = { imageUrl: '', caption: '', wide: false, sortOrder: 0, isActive: true };

export default function GalleryManager({ initialItems }: { initialItems: GalleryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const res = await adminFetch('/api/admin/gallery');
    const body = await res.json();
    setItems(body.gallery);
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Upload failed.');
      setForm((f) => (f ? { ...f, imageUrl: body.url } : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/admin/gallery/${form.id}` : '/api/admin/gallery', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          caption: form.caption,
          wide: form.wide,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        }),
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
    if (!confirm('Delete this photo from the gallery?')) return;
    await adminFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const toggleActive = async (item: GalleryItem) => {
    await adminFetch(`/api/admin/gallery/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-paperdim">{items.length} photo(s). Inactive photos are hidden from the site.</p>
        <button
          className="text-sm bg-accent text-ink font-semibold px-4 py-2 rounded"
          onClick={() => setForm({ ...EMPTY, sortOrder: items.length })}
        >
          + Add photo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-line bg-panel overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.caption} className="w-full h-28 object-cover" />
            <div className="p-3">
              <p className="text-xs truncate">{item.caption}</p>
              {!item.isActive && <p className="text-xs text-paperdim mt-1">hidden</p>}
              <div className="flex gap-3 mt-2">
                <button className="text-xs text-accent hover:underline" onClick={() => setForm({ ...item })}>
                  Edit
                </button>
                <button className="text-xs text-paperdim hover:underline" onClick={() => toggleActive(item)}>
                  {item.isActive ? 'Hide' : 'Show'}
                </button>
                <button className="text-xs text-red-400 hover:underline" onClick={() => remove(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={submit} className="bg-panel border border-line rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">{form.id ? 'Edit photo' : 'New photo'}</h3>

            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" className="w-full h-32 object-cover rounded mb-3" />
            )}

            <label className="text-xs text-paperdim block mb-3">
              Upload a photo (JPEG/PNG/WebP, max 5MB)
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 w-full text-xs"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              {uploading && <span className="text-accent">Uploading…</span>}
            </label>

            <label className="text-xs text-paperdim block mb-3">
              or Image URL
              <input
                className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                required
              />
            </label>

            <label className="text-xs text-paperdim block mb-3">
              Caption
              <input
                className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="text-xs text-paperdim">
                Sort order
                <input
                  type="number"
                  className="mt-1 w-full bg-panel2 border border-line rounded px-2 py-1.5 text-sm"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs text-paperdim flex items-center gap-2 mt-5">
                <input type="checkbox" checked={form.wide} onChange={(e) => setForm({ ...form, wide: e.target.checked })} />
                Wide tile
              </label>
            </div>

            <label className="text-xs text-paperdim flex items-center gap-2 mb-3">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Visible on site
            </label>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <div className="flex gap-3">
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
