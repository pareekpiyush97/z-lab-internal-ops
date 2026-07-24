export const dynamic = 'force-dynamic';

import { getPnlSummary } from '@/lib/repo';
import PnlManager from '@/components/admin/PnlManager';

export default async function AdminPnlPage() {
  const summary = await getPnlSummary('today');
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">P&amp;L</h1>
      <p className="text-sm text-paperdim mb-6">Revenue from confirmed jobs, cost from logged stock purchases.</p>
      <PnlManager initialSummary={summary} />
    </div>
  );
}
