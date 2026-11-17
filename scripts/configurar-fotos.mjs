import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Configura las variables de Supabase antes de continuar.");

const { storage } = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const name = "delta-product-photos";
const { data: buckets, error: listError } = await storage.listBuckets();
if (listError) throw new Error(listError.message);
const existing = buckets.find((bucket) => bucket.id === name);
const options = { public: true, fileSizeLimit: 4 * 1024 * 1024, allowedMimeTypes: ["image/webp"] };
if (existing) {
  if (!existing.public || existing.file_size_limit !== options.fileSizeLimit ||
    existing.allowed_mime_types?.join(",") !== options.allowedMimeTypes.join(",")) {
    throw new Error("El bucket existe con una configuración distinta. Revísalo en Supabase Storage.");
  }
} else {
  const { error } = await storage.createBucket(name, options);
  if (error) throw new Error(error.message);
}
console.log("Bucket de fotografías de DELTA listo.");
