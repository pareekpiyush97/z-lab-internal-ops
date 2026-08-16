export const dynamic = 'force-dynamic';

import { listJobs } from '@/lib/repo';
import WorkCalendar from '@/components/admin/WorkCalendar';

export default async function AdminCalendarPage() {
  const jobs = await listJobs();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Calendar</h1>
      <p className="text-sm text-paperdim mb-6">Day-by-day work — tap a date to see the cars taken in that day.</p>
      <WorkCalendar initialJobs={jobs} />
    </div>
  );
}
