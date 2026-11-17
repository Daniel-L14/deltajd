import { requireUser } from "@/lib/auth";
import { body, json, failure } from "@/lib/http";
import { record, UUID, ApiError } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser(),
      b = record(await body(request));
    if (!Array.isArray(b.ids) || b.ids.length > 100)
      throw new ApiError(400, "Máximo 100 favoritos por importación.");
    const ids = [
      ...new Set(
        b.ids.filter((v): v is string => typeof v === "string" && UUID.test(v)),
      ),
    ];
    if (!ids.length) return json({ imported: 0 });
    const { data, error } = await db
      .from("productos")
      .select("id")
      .in("id", ids)
      .eq("is_active", true);
    if (error) throw error;
    if (data?.length) {
      const { error: insertError } = await db.from("delta_favorites").upsert(
        data.map((p) => ({ user_id: user.id, producto_id: p.id })),
        { onConflict: "user_id,producto_id", ignoreDuplicates: true },
      );
      if (insertError) throw insertError;
    }
    return json({ imported: data?.length ?? 0 });
  } catch (e) {
    return failure(e);
  }
}
