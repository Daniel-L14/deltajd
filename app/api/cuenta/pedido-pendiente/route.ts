import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
import { uuid } from "@/lib/validation";
export async function GET(r: Request) {
  await connection();
  try {
    const { user } = await requireUser(),
      key = uuid(new URL(r.url).searchParams.get("key"));
    const { data, error } = await createAdminClient()
      .from("pedidos")
      .select("codigo")
      .eq("user_id", user.id)
      .eq("idempotency_key", key)
      .maybeSingle();
    if (error) throw error;
    return json({ codigo: data?.codigo ?? null });
  } catch (e) {
    return failure(e);
  }
}
