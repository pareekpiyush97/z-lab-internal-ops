export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="text-xs uppercase tracking-widest text-paperdim font-mono">{label}</div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
      {hint && <div className="text-xs text-paperdim mt-1">{hint}</div>}
    </div>
  );
}
