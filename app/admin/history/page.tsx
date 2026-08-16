export const dynamic = 'force-dynamic';

import { listJobs } from '@/lib/repo';
import HistoryLookup from '@/components/admin/HistoryLookup';
import WorkCalendar from '@/components/admin/WorkCalendar';

export default async function AdminHistoryPage() {
  const jobs = await listJobs();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Service History</h1>
      <p className="text-sm text-paperdim mb-6">Look up a vehicle by plate to see every past visit, service, and spend.</p>

      {/* Search stays on top */}
      <HistoryLookup />

      {/* Work calendar sits below the search, compact so details still show */}
      <div className="mt-10 pt-8 border-t border-line">
        <h2 className="text-lg font-semibold mb-1">Work calendar</h2>
        <p className="text-sm text-paperdim mb-4">Tap a date to see that day&apos;s cars, or browse the whole month.</p>
        <WorkCalendar initialJobs={jobs} />
      </div>
    </div>
  );
}
