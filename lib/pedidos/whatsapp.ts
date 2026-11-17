import { formatCOP } from "../format";
import type { Pedido } from "./types";

export const companyWhatsAppPhone = "573142352488";

function oneLine(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
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

export function orderWhatsAppLink(message: string) {
  const text = encodeURIComponent(message);
  const useClipboard = text.length > 6000;
  const chat = `https://wa.me/${companyWhatsAppPhone}`;
  return { href: useClipboard ? chat : `${chat}?text=${text}`, useClipboard };
}
