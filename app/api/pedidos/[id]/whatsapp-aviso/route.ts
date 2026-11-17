import { requireAdmin } from "@/lib/auth";
import { body, failure, json } from "@/lib/http";
import { notifyOrderOnWhatsApp } from "@/lib/pedidos/whatsapp-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuid } from "@/lib/validation";

export const maxDuration = 40;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await body(request);
    const id = uuid((await params).id);
    const { data: pedido, error } = await createAdminClient()
      .from("pedidos")
      .select(
        "id,codigo,cliente_nombre,cliente_telefono,cliente_email,direccion,items,total,estado,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!pedido) return json({ error: "Pedido no encontrado." }, 404);
    if (pedido.estado?.toLowerCase() === "cancelado") {
      return json({ error: "El pedido está cancelado." }, 409);
    }

    const status = await notifyOrderOnWhatsApp(pedido);
    if (status === "not_configured") {
      return json(
        { error: "Configura WhatsApp Business para enviar el aviso." },
        503,
      );
    }
    return json({ status });
  } catch (e) {
    return failure(e);
  }
}
