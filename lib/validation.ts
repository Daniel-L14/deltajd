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
  return {
    cliente_nombre: nombre,
    cliente_telefono: telefono,
    direccion,
    items: parseOrderItems(b.items, 1),
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
function parseOrderItems(value: unknown, minimum: 0 | 1) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50)
    throw new ApiError(400, minimum === 0
      ? "El pedido debe contener entre 1 y 50 productos."
      : "El carrito debe contener entre 1 y 50 productos.");
  const seen = new Set<string>();
  return value.map((raw) => {
    const line = record(raw);
    const producto_id = uuid(line.producto_id);
    const key = producto_id.toLowerCase();
    if (seen.has(key)) throw new ApiError(400, "Producto repetido.");
    seen.add(key);
    return {
      producto_id,
      cantidad: numberValue(line.cantidad, "Cantidad", minimum, 99, true),
    };
  });
}
export function orderRevision(value: unknown) {
  return numberValue(value, "Revisión del pedido", 0, 2_147_483_647, true);
}
export function parseOrderEdit(value: unknown) {
  const data = record(value);
  const items = parseOrderItems(data.items, 0);
  if (items.every((line) => line.cantidad === 0))
    throw new ApiError(400, "Conserva al menos un perfume o cancela el pedido.");
  return { revision: orderRevision(data.revision), items };
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
    return u.origin === "https://delta.invalid" && !u.pathname.startsWith("//")
      ? u.pathname + u.search + u.hash
      : fallback;
  } catch {
    return fallback;
  }
}
