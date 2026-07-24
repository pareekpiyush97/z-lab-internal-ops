export const dynamic = 'force-dynamic';

import { listServices } from '@/lib/repo';
import ServicesManager from '@/components/admin/ServicesManager';

export default async function AdminServicesPage() {
  const services = await listServices();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Services</h1>
      <p className="text-sm text-paperdim mb-6">What shows on the Signature Services section and its detail modal.</p>
      <ServicesManager initialServices={services} />
    </div>
  );
}
