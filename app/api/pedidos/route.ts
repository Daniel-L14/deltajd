import { after, connection } from "next/server";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import { parseOrder, uuid, searchPattern, transitions } from "@/lib/validation";
import { notifyOrderOnWhatsApp } from "@/lib/pedidos/whatsapp-business";

export const maxDuration = 40;

export async function GET(request: Request) {
  await connection();
  try {
    await requireAdmin();
    const db = createAdminClient();
    const params = new URL(request.url).searchParams;
    const raw = Number(params.get("page") ?? 1);
    const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
    let query = db
      .from("pedidos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id");
    const state = params.get("state");
    if (state === "nuevo")
      query = query.in("estado", ["nuevo", "pendiente", "Pendiente"]);
    else if (state && Object.hasOwn(transitions, state))
      query = query.eq("estado", state);
    const text = searchPattern(params.get("q"));
    if (text)
      query = query.or(
        ["codigo", "cliente_nombre", "cliente_telefono", "estado"]
          .map((column) => `${column}.ilike.${text}`)
          .join(","),
      );
    const period = params.get("period");
    const now = new Date();
    if (period === "week")
      query = query.gte(
        "created_at",
        new Date(now.getTime() - 7 * 86400000).toISOString(),
      );
    if (period === "today" || period === "month") {
      const dateInBogota = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const getPart = (type: string) =>
        dateInBogota.find((part) => part.type === type)?.value;
      const day = period === "month" ? "01" : getPart("day");
      query = query.gte(
        "created_at",
        `${getPart("year")}-${getPart("month")}-${day}T00:00:00-05:00`,
      );
    }
    const { data, error, count } = await query.range(
      (page - 1) * 50,
      page * 50 - 1,
    );
    if (error) throw error;
    return json({ pedidos: data, count, page });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const input = parseOrder(await body(request));
    const key = uuid(request.headers.get("Idempotency-Key"));
    const { data, error } = await createAdminClient().rpc(
      "delta_crear_pedido_v2",
      {
        p_user_id: user.id,
        p_email: user.email ?? "",
        p_key: key,
        p_payload: input,
      },
    );
    if (error) {
      if (error.code === "P0001") return json({ error: error.message }, 409);
      throw error;
    }
    if (data.estado === "nuevo") {
      after(async () => {
        try {
          await notifyOrderOnWhatsApp(data);
        } catch {
          console.error("DELTA: no se pudo procesar el aviso de WhatsApp.");
        }
      });
    }
    return json(
      {
        ok: true,
        pedido: data,
        id: data.id,
        codigo: data.codigo,
        total: data.total,
        estado: data.estado,
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
// Las mutaciones de estado solo existen en /api/pedidos/[id]/estado.
