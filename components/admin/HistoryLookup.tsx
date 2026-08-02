'use client';

import { useState } from 'react';
import type { Job } from '@/lib/types';

interface HistorySummary {
  plate: string;
  visits: number;
  totalBilled: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

const STATUS_STYLES: Record<Job['status'], string> = {
  draft: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS: Record<Job['status'], string> = {
  draft: 'New',
  active: 'Working',
  completed: 'Ready',
  delivered: 'Delivered',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoryLookup() {
  const [plate, setPlate] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = plate.trim();
    if (!q) {
      setError('Enter a plate number to search.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/history?plate=${encodeURIComponent(q)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Search failed.');
        setSearched(false);
        return;
      }
      setJobs(body.jobs);
      setSummary(body.summary);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={search} className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter a plate number, e.g. DL8C AB1234"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          className="w-full sm:w-80 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-2 text-sm uppercase"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {searched && summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold text-slate-800">{summary.visits}</p>
              <p className="text-xs text-slate-500 mt-0.5">Visits</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold text-slate-800">₹{summary.totalBilled.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total billed</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{formatDate(summary.firstSeen)}</p>
              <p className="text-xs text-slate-500 mt-0.5">First seen</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{formatDate(summary.lastSeen)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Last seen</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2.5 font-medium">Job #</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Services</th>
                  <th className="px-4 py-2.5 font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No jobs found for &ldquo;{summary.plate}&rdquo;.
                    </td>
                  </tr>
                )}
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{job.jobNumber}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{job.customerName}</p>
                      <p className="text-xs text-slate-500">{job.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[240px]">{job.services.join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{job.price != null ? `₹${job.price.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status]}`}>
                        {STATUS_LABELS[job.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
