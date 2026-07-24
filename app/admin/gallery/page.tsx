export const dynamic = 'force-dynamic';

import { listGallery } from '@/lib/repo';
import GalleryManager from '@/components/admin/GalleryManager';

export default async function AdminGalleryPage() {
  const gallery = await listGallery();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Gallery</h1>
      <p className="text-sm text-paperdim mb-6">Photos shown in the Selected Work section.</p>
      <GalleryManager initialItems={gallery} />
    </div>
  );
}
