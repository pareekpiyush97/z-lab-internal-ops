'use client';

import { useMemo, useState } from 'react';
import type { Lead, LeadStatus } from '@/lib/types';
import { JOB_SERVICES } from '@/lib/job-catalog';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'booked', 'completed', 'lost'];

type EditForm = { name: string; phone: string; serviceKey: string };

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', phone: '', serviceKey: '' });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', serviceKey: '' });
  const [addSaving, setAddSaving] = useState(false);

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
  const deleteLeadRow = async (lead: Lead) => {
    if (!confirm(`Delete lead \"${lead.name}\"? This cannot be undone.`)) return;
    setSavingId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    } catch {
      alert('Could not delete the lead.');
    } finally {
      setSavingId(null);
    }
  };
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

  const addLead = async () => {
    const payload = { name: addForm.name.trim(), phone: addForm.phone.trim(), serviceKey: addForm.serviceKey.trim() || null };
    if (!payload.name) {
      alert('Enter a name.');
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '');
      setLeads((prev) => [data.lead as Lead, ...prev]);
      setAddForm({ name: '', phone: '', serviceKey: '' });
      setAdding(false);
    } catch {
      alert('Could not add the lead.');
    } finally {
      setAddSaving(false);
    }
  };

  const inputBig =
    'bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper placeholder-paperdim focus:outline-none focus:border-accent';
  const inputCls =
    'w-full bg-panel2 border border-line rounded px-2 py-1 text-xs text-paper placeholder-paperdim focus:outline-none focus:border-accent';

  return (
    <div>
      <datalist id="lead-services">
        {JOB_SERVICES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Search + Add */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name, phone or service…"
          className="flex-1 min-w-[220px] sm:flex-none sm:w-80 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper placeholder-paperdim focus:outline-none focus:border-accent"
        />
        {search.trim() !== '' && (
          <span className="text-xs text-paperdim">
            {filtered.length} of {leads.length}
          </span>
        )}
        <button
          onClick={() => setAdding((v) => !v)}
          className="ml-auto text-sm font-semibold bg-accent hover:brightness-110 text-ink px-4 py-2 rounded-lg transition"
        >
          {adding ? 'Close' : '+ Add lead'}
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-lg border border-line bg-panel p-4 grid gap-3 sm:grid-cols-4">
          <input placeholder="Name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className={inputBig} />
          <input placeholder="Phone" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} className={inputBig} />
          <input list="lead-services" placeholder="Service — pick or type" value={addForm.serviceKey} onChange={(e) => setAddForm((f) => ({ ...f, serviceKey: e.target.value }))} className={inputBig} />
          <div className="flex items-center gap-2">
            <button
              onClick={addLead}
              disabled={addSaving}
              className="text-sm font-semibold bg-accent hover:brightness-110 text-ink px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {addSaving ? 'Saving…' : 'Save lead'}
            </button>
            <button onClick={() => setAdding(false)} className="text-sm text-paperdim hover:text-paper">
              Cancel
            </button>
          </div>
        </div>
      )}

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
                      <input list="lead-services" value={editForm.serviceKey} onChange={(e) => setEditForm((f) => ({ ...f, serviceKey: e.target.value }))} placeholder="Service" className={inputCls} />
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(lead)}
                          className="text-xs font-medium border border-line hover:border-paperdim text-paper rounded-md px-3 py-1 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLeadRow(lead)}
                          disabled={savingId === lead.id}
                          className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
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
