import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import AdminChrome from '@/components/admin/AdminChrome';

export const metadata: Metadata = {
  title: 'TechPlus OS — Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="admin-shell">
      {session ? (
        <AdminChrome username={session.username} role={session.role}>
          {children}
        </AdminChrome>
      ) : (
        children
      )}
    </div>
  );
}
