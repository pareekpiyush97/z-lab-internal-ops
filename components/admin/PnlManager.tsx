'use client';

import { adminFetch } from '@/lib/adminFetch';

import { useState } from 'react';
import type { PnlSummary } from '@/lib/types';

const PERIODS: { key: PnlSummary['period']; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function PnlManager({ initialSummary }: { initialSummary: PnlSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);

  const selectPeriod = async (period: PnlSummary['period']) => {
    if (period === summary.period) return;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/pnl?period=${period}`);
      const body = await res.json();
      if (res.ok) setSummary(body.summary);
    } finally {
      setLoading(false);
    }
  };

  const profitPositive = summary.profit >= 0;

  return (
    <div>
      <div className="flex gap-1.5 mb-6 border-b border-slate-200">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPeriod(p.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              summary.period === p.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-3 gap-3 mb-8 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-semibold text-slate-800">₹{summary.revenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-0.5">Revenue</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-semibold text-slate-800">₹{summary.cost.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-0.5">Cost (purchases)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className={`text-2xl font-semibold ${profitPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{summary.profit.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Profit</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Revenue — jobs ({summary.revenueJobs.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-3 py-2 font-medium">Job #</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.revenueJobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400 text-sm">
                      No revenue in this period.
                    </td>
                  </tr>
                )}
                {summary.revenueJobs.map((j) => (
                  <tr key={j.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">{j.jobNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{j.customerName}</td>
                    <td className="px-3 py-2 text-slate-700">{j.price != null ? `₹${j.price.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(j.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Cost — purchases ({summary.costPurchases.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.costPurchases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400 text-sm">
                      No purchases in this period.
                    </td>
                  </tr>
                )}
                {summary.costPurchases.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-700">{p.itemName}</td>
                    <td className="px-3 py-2 text-slate-600">{p.qty}</td>
                    <td className="px-3 py-2 text-slate-700">₹{p.totalCost.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(p.purchasedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
