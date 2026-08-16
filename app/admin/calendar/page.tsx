import { redirect } from 'next/navigation';

// Calendar now lives inside Service History. Keep this route working for old
// bookmarks by sending it there.
export default function AdminCalendarPage() {
  redirect('/admin/history');
}
