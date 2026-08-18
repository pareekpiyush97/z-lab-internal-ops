import { redirect } from 'next/navigation';

// Internal company software: the domain has no public marketing page. Send
// every visitor to the admin area — middleware routes signed-out users to the
// login screen, and signed-in users to their dashboard (owner) or Work (staff).
export default function RootPage() {
  redirect('/admin');
}
