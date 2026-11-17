import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
export async function GET(r: Request) {
  await connection();
  try {
    const { user } = await requireUser();
    const n = Number(new URL(r.url).searchParams.get("page") ?? 1),
      page = Number.isInteger(n) && n > 0 ? n : 1;
    const { data, error, count } = await createAdminClient()
      .from("pedidos")
      .select("id,codigo,cliente_nombre,direccion,total,estado,created_at", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);
    if (error) throw error;
    return json({ pedidos: data, count, page });
  } catch (e) {
    return failure(e);
  }
}
