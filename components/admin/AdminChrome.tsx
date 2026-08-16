'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const STAFF_NAV = [
  { href: '/admin/jobs', label: 'Work' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/stock', label: 'Stock & Logistics' },
  { href: '/admin/history', label: 'Service History' },
  { href: '/admin/reminders', label: 'Reminders' },
];

const OWNER_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pnl', label: 'P&L' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = role === 'owner' ? [...STAFF_NAV, ...OWNER_NAV] : STAFF_NAV;

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const navBody = (
    <>
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
              onClick={() => setMenuOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen md:flex bg-ink text-paper font-inter">
      {/* Mobile top bar (hidden on desktop) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel px-4 py-3">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-paperdim uppercase font-mono">TechPlus OS</div>
          <div className="text-sm text-paper font-semibold leading-tight">Z Lab Design</div>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 text-paper"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-line bg-panel p-6 flex-col gap-1">
        {navBody}
      </aside>

      {/* Mobile slide-in drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[82%] border-r border-line bg-panel p-6 flex flex-col gap-1 overflow-y-auto animate-in">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="self-end -mt-2 -mr-2 mb-2 p-2 text-paperdim hover:text-paper"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {navBody}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-6xl">{children}</main>
    </div>
  );
}
