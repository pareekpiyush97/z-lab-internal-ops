import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Local-disk image upload for the admin Gallery/Services editors.
//
// IMPORTANT deployment caveat: this writes to public/uploads on the
// server's local filesystem. That's fine for a traditional always-on Node
// server (or local/dev use), but on serverless platforms (Vercel, etc.) the
// filesystem is ephemeral/read-only in production -- uploaded files would
// vanish on the next deploy or cold start. If deploying serverless, either
// keep using the "Image URL" field with externally-hosted images, or swap
// this route for Supabase Storage (a natural fit since the database is
// already on Supabase) -- upload to a bucket and store the returned public
// URL exactly the same way this route returns `url` today.

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data with a "file" field.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  // Filename is entirely server-generated -- the client's original filename
  // is never used for the path, which rules out path-traversal payloads
  // like "../../../etc/passwd" hidden in a crafted upload filename.
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
