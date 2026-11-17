import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  await connection();
  try {
    const { user } = await requireUser(),
      { codigo } = await params;
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .select(
        "id,codigo,cliente_nombre,cliente_telefono,cliente_email,direccion,total,estado,items,created_at",
      )
      .eq("user_id", user.id)
      .eq("codigo", codigo)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return json({ error: "Pedido no encontrado en tu cuenta." }, 404);
    return json({ pedido: data });
  } catch (e) {
    return failure(e);
  }
}
