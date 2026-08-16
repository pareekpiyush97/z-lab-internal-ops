'use client';

import { useMemo, useState } from 'react';
import type { Lead, LeadStatus } from '@/lib/types';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'booked', 'completed', 'lost'];

type EditForm = { name: string; phone: string; serviceKey: string };

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', phone: '', serviceKey: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.phone, l.serviceKey || '', l.status].some((f) => f.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    setSavingId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLeads(initialLeads);
    } finally {
      setSavingId(null);
    }
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditForm({ name: lead.name, phone: lead.phone, serviceKey: lead.serviceKey || '' });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: string) => {
    const patch = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      serviceKey: editForm.serviceKey.trim() || null,
    };
    if (!patch.name) {
      alert('Name cannot be empty.');
      return;
    }
    setSavingId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
    } catch {
      setLeads(initialLeads);
      alert('Could not save the lead.');
    } finally {
      setSavingId(null);
    }
  };

  const inputCls =
    'w-full bg-panel2 border border-line rounded px-2 py-1 text-xs text-paper placeholder-paperdim focus:outline-none focus:border-accent';

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name, phone or service…"
          className="w-full sm:w-80 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper placeholder-paperdim focus:outline-none focus:border-accent"
        />
        {search.trim() !== '' && (
          <span className="ml-3 text-xs text-paperdim">
            {filtered.length} of {leads.length}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-panel text-paperdim uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Service</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Received</th>
              <th className="text-left px-4 py-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-paperdim">
                  {leads.length === 0 ? 'No leads yet.' : 'No leads match your search.'}
                </td>
              </tr>
            )}
            {filtered.map((lead) => {
              const editing = editingId === lead.id;
              return (
                <tr key={lead.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    {editing ? (
                      <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                    ) : (
                      lead.name
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {editing ? (
                      <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
                    ) : (
                      <a className="hover:text-accent" href={`tel:${lead.phone}`}>
                        {lead.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-paperdim">
                    {editing ? (
                      <input value={editForm.serviceKey} onChange={(e) => setEditForm((f) => ({ ...f, serviceKey: e.target.value }))} placeholder="Service" className={inputCls} />
                    ) : (
                      lead.serviceKey || '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      disabled={savingId === lead.id}
                      onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                      className="bg-panel2 border border-line rounded px-2 py-1 text-xs uppercase tracking-wide text-paper"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-paperdim text-xs whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(lead.id)}
                          disabled={savingId === lead.id}
                          className="text-xs font-semibold bg-accent hover:brightness-110 text-ink px-3 py-1 rounded-md disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit} className="text-xs text-paperdim hover:text-paper">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEdit(lead)}
                        className="text-xs font-medium border border-line hover:border-paperdim text-paper rounded-md px-3 py-1 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
