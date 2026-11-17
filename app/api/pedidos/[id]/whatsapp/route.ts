import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import { record, uuid, ApiError } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const id = uuid((await params).id),
      b = record(await body(request));
    if (typeof b.confirmar !== "boolean")
      throw new ApiError(400, "Indica confirmar: true o false.");
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .update({
        whatsapp_confirmado: b.confirmar,
        whatsapp_confirmado_at: b.confirmar ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id,whatsapp_confirmado,whatsapp_confirmado_at")
      .single();
    if (error) throw error;
    return json({ ok: true, pedido: data });
  } catch (e) {
    return failure(e);
  }
}
