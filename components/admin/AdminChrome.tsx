'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const STAFF_NAV = [
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/stock', label: 'Stock & Logistics' },
  { href: '/admin/history', label: 'Service History' },
];

const OWNER_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pnl', label: 'P&L' },
  { href: '/admin/reminders', label: 'Reminders' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminChrome({
  username,
  role,
  children,
}: {
  username: string;
  role: 'owner' | 'staff';
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === 'owner' ? [...STAFF_NAV, ...OWNER_NAV] : STAFF_NAV;

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-ink text-paper font-inter">
      <aside className="w-60 shrink-0 border-r border-line bg-panel p-6 flex flex-col gap-1">
        <div className="mb-8">
          <div className="text-xs tracking-[0.2em] text-paperdim uppercase font-mono">TechPlus OS</div>
          <div className="text-sm text-paper mt-1 font-semibold">Z Lab Design</div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  active ? 'bg-panel2 text-paper' : 'text-paperdim hover:text-paper hover:bg-panel2'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-line">
          <div className="text-xs text-paperdim mb-2 truncate">
            Signed in as {username}
            <span className="ml-1.5 inline-block text-[10px] font-medium uppercase tracking-wide bg-panel2 text-paperdim px-1.5 py-0.5 rounded">
              {role}
            </span>
          </div>
          <button onClick={logout} className="text-sm text-accent hover:underline">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl">{children}</main>
    </div>
  );
}
