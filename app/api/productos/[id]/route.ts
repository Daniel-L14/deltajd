import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_COLUMNS } from "@/lib/products";
import { uuid } from "@/lib/validation";
import { json, failure } from "@/lib/http";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    const id = uuid((await params).id),
      db = await createClient();
    const { data, error } = await db
      .from("productos")
      .select(PRODUCT_COLUMNS)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Producto no disponible." }, 404);
    return json({ product: data });
  } catch (e) {
    return failure(e);
  }
}
