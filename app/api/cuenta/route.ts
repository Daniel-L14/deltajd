import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, failure } from "@/lib/http";
export async function GET() {
  await connection();
  try {
    const { db, user } = await requireUser();
    const [
      { data: profile, error: pe },
      { data: summary, error: se },
      { data: favs, error: fe },
    ] = await Promise.all([
      db.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      createAdminClient().rpc("delta_member_v2", { p_user_id: user.id }),
      db
        .from("delta_favorites")
        .select("producto_id,productos(id,name,price,family,image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (pe || se || fe) throw pe || se || fe;
    return json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.user_metadata?.full_name },
      },
      isAdmin: profile?.role === "ADMIN",
      ...summary,
      favs: (favs ?? []).map((f) => f.productos).filter(Boolean),
    });
  } catch (e) {
    return failure(e);
  }
}
