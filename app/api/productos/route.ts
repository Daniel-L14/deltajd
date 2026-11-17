import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { body, json, failure } from "@/lib/http";
import {
  record,
  searchPattern,
  textValue,
  numberValue,
  uuid,
  ApiError,
} from "@/lib/validation";
import { photoForm, uploadProductPhoto } from "@/lib/product-photo";
import { matchingFamilies, PRODUCT_COLUMNS } from "@/lib/products";
export async function GET(request: Request) {
  await connection();
  try {
    const u = new URL(request.url);
    const admin = u.searchParams.get("admin") === "1";
    const db = admin ? (await requireAdmin()).db : await createClient();
    const n = Number(u.searchParams.get("page") ?? 1);
    const page = Number.isInteger(n) && n > 0 ? n : 1;
    let q = db
      .from("productos")
      .select(PRODUCT_COLUMNS, { count: "exact" })
      .order("name")
      .order("id");
    if (!admin) q = q.eq("is_active", true);
    const family = u.searchParams.get("family");
    if (family) q = q.in("family", matchingFamilies(family.slice(0, 80)));
    const text = searchPattern(u.searchParams.get("q"));
    if (text)
      q = q.or(
        ["name", "brand", "family", "description", "notes"]
          .map((column) => `${column}.ilike.${text}`)
          .join(","),
      );
    const { data, error, count } = await q.range(
      (page - 1) * 24,
      page * 24 - 1,
    );
    if (error) throw error;
    return json({ products: data, count, page });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin();
    const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data;");
    const form = multipart ? await photoForm(request) : null;
    let input: unknown;
    if (form) {
      try {
        input = JSON.parse(String(form.get("product")));
      } catch {
        throw new ApiError(400, "Los datos del producto no son válidos.");
      }
    } else {
      input = await body(request);
    }
    const b = record(input);
    const payload = {
      name: textValue(b.name, "Nombre", 2, 120),
      brand: textValue(b.brand, "Marca", 1, 100),
      family: textValue(b.family, "Familia", 1, 80),
      description: textValue(b.description, "Descripción", 0, 2000),
      price: numberValue(b.price, "Precio", 1, 100000000, true),
      stock: numberValue(b.stock, "Stock", 0, 100000, true),
      budget_category: textValue(b.budget_category, "Presupuesto"),
      occasion: textValue(b.occasion, "Ocasión"),
      climate_preference: textValue(b.climate_preference, "Clima"),
      notes: textValue(b.notes ?? "", "Notas", 0, 500),
      concentration: textValue(b.concentration ?? "", "Concentración", 0, 80),
      presentation_ml:
        b.presentation_ml === null
          ? null
          : numberValue(b.presentation_ml, "Mililitros", 1, 5000, true),
      ...(Object.hasOwn(b, "image_url") ? {
        image_url: textValue(b.image_url ?? "", "Imagen", 0, 1000) || null,
      } : {}),
    };
    if (
      !["ECONOMICO", "MEDIO", "PREMIUM"].includes(payload.budget_category) ||
      !["Diario", "Trabajo", "Noche / Evento", "Todas"].includes(
        payload.occasion,
      ) ||
      !["CALIDO", "FRIO", "TODOS"].includes(payload.climate_preference)
    )
      throw new ApiError(400, "Atributos de recomendación inválidos.");
    if (payload.image_url && !/^https:\/\//i.test(payload.image_url))
      throw new ApiError(400, "La imagen debe usar HTTPS.");
    const id = b.id ? uuid(b.id) : null;
    const reason = textValue(b.reason, "Motivo del ajuste", 3, 300);
    const expected =
      b.expected_stock === undefined
        ? null
        : numberValue(b.expected_stock, "Stock anterior", 0, 100000, true);
    const db = createAdminClient();
    const photo = form ? await uploadProductPhoto(db, form.get("photo")) : null;
    if (photo) payload.image_url = photo.url;
    const { data, error } = await db.rpc(
      "delta_guardar_producto_v2",
      {
        p_id: id,
        p_payload: payload,
        p_actor: user.id,
        p_reason: reason,
        p_expected_stock: expected,
      },
    );
    if (error) {
      // An unclear transport error may have committed. Keep its asset available.
      if (error.code === "P0001") {
        await photo?.discard();
        return json({ error: error.message }, 409);
      }
      throw error;
    }
    return json({ product: data });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const b = record(await body(request));
    const id = uuid(b.id);
    if (typeof b.is_active !== "boolean")
      throw new ApiError(400, "Estado inválido.");
    const { error } = await createAdminClient()
      .from("productos")
      .update({ is_active: b.is_active })
      .eq("id", id);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
