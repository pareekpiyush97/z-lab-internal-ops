export const dynamic = 'force-dynamic';

import { getAllSettings } from '@/lib/repo';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-paperdim mb-6">Business info shown across the public site.</p>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
