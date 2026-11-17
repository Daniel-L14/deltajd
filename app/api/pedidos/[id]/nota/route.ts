import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import { record, uuid, textValue } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const id = uuid((await params).id),
      b = record(await body(request));
    const nota = textValue(b.nota, "Nota", 0, 1000);
    const { error } = await createAdminClient()
      .from("pedidos")
      .update({ notas_admin: nota })
      .eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
