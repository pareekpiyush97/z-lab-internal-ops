import HistoryLookup from '@/components/admin/HistoryLookup';

export default function AdminHistoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Service History</h1>
      <p className="text-sm text-paperdim mb-6">Look up a vehicle by plate to see every past visit, service, and spend.</p>
      <HistoryLookup />
    </div>
  );
}
