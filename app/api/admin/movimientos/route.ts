import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
export async function GET(r: Request) {
  await connection();
  try {
    await requireAdmin();
    const n = Number(new URL(r.url).searchParams.get("page") ?? 1),
      page = Number.isInteger(n) && n > 0 ? n : 1;
    const { data, error, count } = await createAdminClient()
      .from("delta_stock_movements")
      .select("*,productos(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * 50, page * 50 - 1);
    if (error) throw error;
    return json({ movimientos: data, count, page });
  } catch (e) {
    return failure(e);
  }
}
