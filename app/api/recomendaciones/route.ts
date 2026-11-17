import { createClient } from "@/lib/supabase/server";
import { PRODUCT_COLUMNS, rankProducts } from "@/lib/products";
import { json, failure, body } from "@/lib/http";
import { record, textValue, ApiError } from "@/lib/validation";
export async function POST(r: Request) {
  try {
    const b = record(await body(r));
    const prefs = {
      budget: textValue(b.budget, "Presupuesto"),
      family: textValue(b.family, "Familia"),
      occasion: textValue(b.occasion, "Ocasión"),
      climate: textValue(b.climate, "Clima"),
    };
    if (!["ECONOMICO", "MEDIO", "PREMIUM"].includes(prefs.budget))
      throw new ApiError(400, "Presupuesto inválido.");
    const db = await createClient();
    const all = [];
    // Recorrer páginas evita que el límite de filas de Supabase recorte candidatos.
    for (let start = 0; ; start += 500) {
      const { data, error } = await db
        .from("productos")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .gt("stock", 0)
        .eq("budget_category", prefs.budget)
        .order("id")
        .range(start, start + 499);
      if (error) throw error;
      all.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    return json({ results: rankProducts(all, prefs) });
  } catch (e) {
    return failure(e);
  }
}
