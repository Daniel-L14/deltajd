import "server-only";
import sharp from "sharp";
import { PHOTO_BUCKET, PHOTO_LIMIT, PHOTO_TYPES } from "./photo-settings";
import { assertSameOrigin, readBytes } from "./http";
import { ApiError } from "./validation";
import type { createAdminClient } from "./supabase/admin";

export async function photoForm(request: Request) {
  assertSameOrigin(request);
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data;"))
    throw new ApiError(415, "Envía la fotografía como archivo.");
  const bytes = await readBytes(request, PHOTO_LIMIT + 32768);
  try {
    return await new Response(bytes, { headers: { "Content-Type": type } }).formData();
  } catch {
    throw new ApiError(400, "El formulario de fotografía no es válido.");
  }
}

export async function uploadProductPhoto(db: ReturnType<typeof createAdminClient>, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !PHOTO_TYPES.includes(value.type) || !value.size)
    throw new ApiError(415, "Selecciona una imagen JPG, PNG o WebP.");
  if (value.size > PHOTO_LIMIT)
    throw new ApiError(413, "La fotografía debe pesar máximo 4 MB.");

  let image: Buffer;
  try {
    const input = sharp(Buffer.from(await value.arrayBuffer()), { limitInputPixels: 50_000_000 });
    const { format } = await input.metadata();
    if (format !== "jpeg" && format !== "png" && format !== "webp")
      throw new Error("Formato inválido");
    image = await input.autoOrient()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    throw new ApiError(422, "No se pudo leer la imagen. Prueba con otro JPG, PNG o WebP.");
  }

  const bucket = db.storage.from(PHOTO_BUCKET);
  const path = `productos/${crypto.randomUUID()}.webp`;
  const { error } = await bucket.upload(path, image, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    url: bucket.getPublicUrl(path).data.publicUrl,
    discard: async () => {
      const { error } = await bucket.remove([path]);
      if (error) console.error("DELTA: no se pudo retirar una carga fallida", error.message);
    },
  };
}
