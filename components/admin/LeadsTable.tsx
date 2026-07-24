'use client';

import { useState } from 'react';
import type { Lead, LeadStatus } from '@/lib/types';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'booked', 'completed', 'lost'];

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [savingId, setSavingId] = useState<string | null>(null);

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
      // Revert on failure so the UI never silently lies about saved state.
      setLeads(initialLeads);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-line overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-panel text-paperdim uppercase text-xs tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Phone</th>
            <th className="text-left px-4 py-3">Service</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-paperdim">
                No leads yet.
              </td>
            </tr>
          )}
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t border-line align-top">
              <td className="px-4 py-3">{lead.name}</td>
              <td className="px-4 py-3 font-mono text-xs">
                <a className="hover:text-accent" href={`tel:${lead.phone}`}>
                  {lead.phone}
                </a>
              </td>
              <td className="px-4 py-3 text-paperdim">{lead.serviceKey || '—'}</td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  disabled={savingId === lead.id}
                  onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                  className="bg-panel2 border border-line rounded px-2 py-1 text-xs uppercase tracking-wide"
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
