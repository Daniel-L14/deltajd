import { requireUser } from "@/lib/auth";
import { json, failure, body } from "@/lib/http";
import { uuid, record, ApiError } from "@/lib/validation";
export async function POST(r: Request) {
  try {
    const { db, user } = await requireUser(),
      b = record(await body(r)),
      id = uuid(b.id);
    if (typeof b.active !== "boolean")
      throw new ApiError(400, "Estado inválido.");
    const result = b.active
      ? await db
          .from("delta_favorites")
          .upsert(
            { user_id: user.id, producto_id: id },
            { onConflict: "user_id,producto_id", ignoreDuplicates: true },
          )
      : await db
          .from("delta_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("producto_id", id);
    if (result.error) throw result.error;
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
