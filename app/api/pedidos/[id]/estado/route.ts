import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import { record, uuid, textValue, ApiError } from "@/lib/validation";
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
    const { data, error } = await createAdminClient().rpc(
      "delta_estado_pedido_v2",
      { p_id: id, p_estado: b.estado, p_actor: user.id, p_nota: nota },
    );
    if (error) {
      if (error.code === "P0001") return json({ error: error.message }, 409);
      throw error;
    }
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
