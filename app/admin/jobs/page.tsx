export const dynamic = 'force-dynamic';

import { listJobs } from '@/lib/repo';
import JobsManager from '@/components/admin/JobsManager';

export default async function AdminJobsPage() {
  const jobs = await listJobs();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Work</h1>
      <p className="text-sm text-paperdim mb-6">Add a car, start the work, mark it complete, then deliver.</p>
      <JobsManager initialJobs={jobs} />
    </div>
  );
}
