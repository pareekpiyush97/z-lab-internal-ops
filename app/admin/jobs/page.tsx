export const dynamic = 'force-dynamic';

import { listJobs } from '@/lib/repo';
import JobsManager from '@/components/admin/JobsManager';

export default async function AdminJobsPage() {
  const jobs = await listJobs();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Jobs</h1>
      <p className="text-sm text-paperdim mb-6">Intake a car, confirm its plate and scope, then track it through to delivery.</p>
      <JobsManager initialJobs={jobs} />
    </div>
  );
}
