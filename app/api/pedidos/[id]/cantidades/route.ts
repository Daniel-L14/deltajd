import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, failure, json } from "@/lib/http";
import { parseOrderEdit, uuid } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdmin();
    const id = uuid((await params).id);
    const { items, revision } = parseOrderEdit(await body(request));
    const { data, error } = await createAdminClient().rpc("delta_editar_pedido_v1", {
      p_id: id,
      p_actor: user.id,
      p_revision: revision,
      p_items: items,
    });
    if (error) {
      if (error.code === "P0001") return json({ error: error.message }, 409);
      if (error.code === "42501") return json({ error: "No autorizado." }, 403);
      throw error;
    }
    return json(data);
  } catch (error) {
    return failure(error);
  }
}
