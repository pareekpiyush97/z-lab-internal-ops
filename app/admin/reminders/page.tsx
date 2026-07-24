export const dynamic = 'force-dynamic';

import { listReminders, listStockItems } from '@/lib/repo';
import RemindersManager from '@/components/admin/RemindersManager';

export default async function AdminRemindersPage() {
  const [reminders, stockItems] = await Promise.all([listReminders(), listStockItems()]);
  const lowStockItems = stockItems.filter((i) => i.qty <= i.lowAt);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Reminders</h1>
      <p className="text-sm text-paperdim mb-6">Low-stock alerts surface automatically; everything else is up to you.</p>
      <RemindersManager initialReminders={reminders} lowStockItems={lowStockItems} />
    </div>
  );
}
