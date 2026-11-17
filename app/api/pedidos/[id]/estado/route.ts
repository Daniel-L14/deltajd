import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import { record, uuid, textValue, orderRevision, ApiError } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdmin();
    const id = uuid((await params).id),
      b = record(await body(request));
    if (!["pagado", "entregado", "cancelado"].includes(String(b.estado)))
      throw new ApiError(400, "Estado inválido.");
    const nota = b.nota ? textValue(b.nota, "Nota", 1, 500) : null;
    const db = createAdminClient();
    const args = { p_id: id, p_actor: user.id, p_nota: nota };
    const { data, error } = b.estado === "pagado"
      ? await db.rpc("delta_pagar_pedido_verificado_v1", {
          ...args, p_revision: orderRevision(b.revision),
        })
      : await db.rpc("delta_estado_pedido_v2", { ...args, p_estado: b.estado });
    if (error) {
      if (error.code === "P0001") return json({ error: error.message }, 409);
      if (error.code === "42501") return json({ error: "No autorizado." }, 403);
      throw error;
    }
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
