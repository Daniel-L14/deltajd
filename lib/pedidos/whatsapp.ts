import { formatCOP } from "../format";
import type { Pedido } from "./types";

function oneLine(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function whatsappPhone(value: string | undefined) {
  const raw = value?.trim() ?? "";
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function orderWhatsAppMessage(pedido: Pedido) {
  return [
    `Pedido DELTA · ${oneLine(pedido.codigo)}`,
    "",
    `Cliente: ${oneLine(pedido.cliente_nombre) || "Sin registrar"}`,
    `Celular: ${oneLine(pedido.cliente_telefono) || "Sin registrar"}`,
    ...(pedido.cliente_email
      ? [`Correo: ${oneLine(pedido.cliente_email)}`]
      : []),
    `Dirección de entrega: ${oneLine(pedido.direccion) || "Sin registrar"}`,
    "",
    "Perfumes",
    ...(pedido.items ?? []).map(
      (item) =>
        `• ${item.cantidad} × ${oneLine(item.nombre)} · ${formatCOP(item.precio)} c/u · ${formatCOP(item.precio * item.cantidad)}`,
    ),
    "",
    `Total de productos: ${formatCOP(pedido.total)} COP`,
  ].join("\n");
}
