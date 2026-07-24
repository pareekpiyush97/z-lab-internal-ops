export const dynamic = 'force-dynamic';

import { listLeads } from '@/lib/repo';
import LeadsTable from '@/components/admin/LeadsTable';

export default async function AdminLeadsPage() {
  const leads = await listLeads();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Leads</h1>
      <p className="text-sm text-paperdim mb-6">Every quote request submitted from the public site.</p>
      <LeadsTable initialLeads={leads} />
    </div>
  );
}
