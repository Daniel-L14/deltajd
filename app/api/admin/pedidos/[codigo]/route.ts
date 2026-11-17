import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
import { whatsappBusinessConfig } from "@/lib/pedidos/whatsapp-business";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  await connection();
  try {
    await requireAdmin();
    const db = createAdminClient(),
      { codigo } = await params;
    const { data: pedido, error } = await db
      .from("pedidos")
      .select("*")
      .eq("codigo", codigo)
      .maybeSingle();
    if (error) throw error;
    if (!pedido) return json({ error: "Pedido no encontrado." }, 404);
    const { data: historial, error: he } = await db
      .from("pedido_historial")
      .select("*")
      .eq("pedido_id", pedido.id)
      .order("creado_at");
    if (he) throw he;
    const configured = Boolean(whatsappBusinessConfig());
    const notice = configured
      ? await db
          .from("delta_order_whatsapp")
          .select("status")
          .eq("pedido_id", pedido.id)
          .maybeSingle()
      : null;
    return json({
      pedido,
      historial,
      whatsappAviso: {
        configured,
        status: notice?.error
          ? "unavailable"
          : (notice?.data?.status ?? "pending"),
      },
    });
  } catch (e) {
    return failure(e);
  }
}
