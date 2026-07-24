export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { listLeads, listServices, listGallery } from '@/lib/repo';
import StatCard from '@/components/admin/StatCard';

export default async function AdminOverviewPage() {
  const [leads, services, gallery] = await Promise.all([listLeads(), listServices(), listGallery()]);

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const activeServices = services.filter((s) => s.isActive).length;
  const activeGallery = gallery.filter((g) => g.isActive).length;
  const recentLeads = leads.slice(0, 6);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Overview</h1>
      <p className="text-sm text-paperdim mb-6">TechPlus OS — Z Lab Design operations at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="New leads" value={newLeads} hint="awaiting first contact" />
        <StatCard label="Total leads" value={leads.length} />
        <StatCard label="Active services" value={`${activeServices}/${services.length}`} />
        <StatCard label="Active gallery items" value={`${activeGallery}/${gallery.length}`} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent leads</h2>
        <Link href="/admin/leads" className="text-sm text-accent hover:underline">
          View all →
        </Link>
      </div>
      <div className="rounded-lg border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-panel text-paperdim uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-paperdim">
                  No leads yet — quote requests from the site will show up here.
                </td>
              </tr>
            )}
            {recentLeads.map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{lead.phone}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-panel2 text-xs uppercase tracking-wide">
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-paperdim text-xs">{new Date(lead.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
