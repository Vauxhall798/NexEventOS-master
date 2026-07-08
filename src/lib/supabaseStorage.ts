import { createClient } from "@supabase/supabase-js";

// "uploads" bucket must exist and be set to public read in the Supabase
// dashboard (Storage -> New bucket) before this works — see
// DEPLOYMENT_GUIDE.md §7.
const BUCKET = "uploads";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service role key, not the anon key — bypasses RLS so the server can
  // write on behalf of any authenticated app user. Never expose this to
  // the browser.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "File storage isn't configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
  }
  return createClient(url, serviceKey);
}

/** Uploads a buffer to the public "uploads" bucket and returns its public URL. */
export async function uploadToStorage(filename: string, buffer: Buffer, contentType: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/** True if `url` is a public URL for our own "uploads" bucket (not an arbitrary external URL). */
export function isOwnStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/${BUCKET}/`;
  return url.startsWith(prefix) && /^[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp)$/.test(url.slice(prefix.length));
}
