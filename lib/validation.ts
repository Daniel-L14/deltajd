export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(v: unknown): string {
  if (typeof v !== "string" || !UUID.test(v))
    throw new ApiError(400, "Identificador inválido.");
  return v;
}
export function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new ApiError(400, "Datos inválidos.");
  return v as Record<string, unknown>;
}
export function textValue(
  v: unknown,
  name: string,
  min = 1,
  max = 200,
): string {
  if (typeof v !== "string" || v.trim().length < min || v.trim().length > max)
    throw new ApiError(400, `${name}: usa entre ${min} y ${max} caracteres.`);
  return v.trim();
}
export function numberValue(
  v: unknown,
  name: string,
  min: number,
  max: number,
  integer = false,
): number {
  if (
    typeof v !== "number" ||
    !Number.isFinite(v) ||
    v < min ||
    v > max ||
    (integer && !Number.isInteger(v))
  )
    throw new ApiError(400, `${name} inválido.`);
  return v;
}
export function parseOrder(v: unknown) {
  const b = record(v);
  const nombre = textValue(b.cliente_nombre, "Nombre", 2, 120),
    direccion = textValue(b.direccion, "Dirección", 8, 300),
    telefono = textValue(b.cliente_telefono, "Teléfono", 7, 20);
  if (!/^[+\d ()-]{7,20}$/.test(telefono))
    throw new ApiError(400, "Teléfono inválido.");
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 50)
    throw new ApiError(400, "El carrito debe contener entre 1 y 50 productos.");
  const seen = new Set<string>();
  const items = b.items.map((raw) => {
    const i = record(raw);
    const producto_id = uuid(i.producto_id);
    if (seen.has(producto_id)) throw new ApiError(400, "Producto repetido.");
    seen.add(producto_id);
    return {
      producto_id,
      cantidad: numberValue(i.cantidad, "Cantidad", 1, 99, true),
    };
  });
  return {
    cliente_nombre: nombre,
    cliente_telefono: telefono,
    direccion,
    items,
    ...(b.subtotal_visto_centavos === undefined
      ? {}
      : {
          subtotal_visto_centavos: numberValue(
            b.subtotal_visto_centavos,
            "Subtotal mostrado",
            1,
            50_000_000_000_000,
            true,
          ),
        }),
  };
}
/** Builds an ILIKE value from plain text, without PostgREST separators or wildcards. */
export function searchPattern(value: string | null): string | null {
  const term = (value ?? "")
    .trim()
    .slice(0, 100)
    .replace(/[^\p{L}\p{M}\p{N} &+/-]/gu, " ")
    .trim();
  return term ? `%${term}%` : null;
}
export const transitions: Record<string, string[]> = {
  nuevo: ["pagado", "cancelado"],
  pagado: ["entregado"],
  entregado: [],
  cancelado: [],
};
export function safeNext(value: string | null, fallback = "/tienda"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x1f]/.test(value)
  )
    return fallback;
  try {
    const u = new URL(value, "https://delta.invalid");
    return u.origin === "https://delta.invalid"
      ? u.pathname + u.search + u.hash
      : fallback;
  } catch {
    return fallback;
  }
}
