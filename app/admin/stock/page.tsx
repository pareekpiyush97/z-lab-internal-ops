export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { listStockItems, listStockPurchases } from '@/lib/repo';
import StockManager from '@/components/admin/StockManager';

export default async function AdminStockPage() {
  const session = await getSession();
  const isOwner = session?.role === 'owner';
  const [items, purchases] = await Promise.all([listStockItems(), isOwner ? listStockPurchases() : Promise.resolve(null)]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Stock & Logistics</h1>
      <p className="text-sm text-paperdim mb-6">
        Chemicals, films, and consumables on hand{isOwner ? ' — plus what they cost to restock' : ''}.
      </p>
      <StockManager initialItems={items} initialPurchases={purchases} isOwner={isOwner} />
    </div>
  );
}
