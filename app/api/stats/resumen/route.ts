import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
export async function GET() {
  await connection();
  try {
    await requireAdmin();
    const { data, error } = await createAdminClient().rpc("delta_resumen_v2");
    if (error) throw error;
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
