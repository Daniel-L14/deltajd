import { requireAdmin } from "@/lib/auth";
import { failure, json } from "@/lib/http";
import { photoForm, uploadProductPhoto } from "@/lib/product-photo";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, uuid } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = uuid((await params).id);
    const db = createAdminClient();
    const { data: product, error: lookupError } = await db.from("productos")
      .select("image_url").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!product) throw new ApiError(404, "No se encontró el producto.");

    const form = await photoForm(request);
    if (form.get("previous_url") !== (product.image_url ?? ""))
      throw new ApiError(409, "Otra persona cambió esta foto. Vuelve a abrir el producto.");
    const photo = await uploadProductPhoto(db, form.get("photo"));
    const change = db.from("productos").update({ image_url: photo.url }).eq("id", id);
    const { data, error } = await (product.image_url === null
      ? change.is("image_url", null)
      : change.eq("image_url", product.image_url)
    ).select("image_url").maybeSingle();
    if (error) throw error;
    if (!data) {
      await photo.discard();
      throw new ApiError(409, "El producto cambió durante la carga. Vuelve a abrirlo.");
    }
    return json(data);
  } catch (error) {
    return failure(error);
  }
}
