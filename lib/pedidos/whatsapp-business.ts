import "server-only";
import { PageSizes, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCOP } from "../format";
import { createAdminClient } from "../supabase/admin";
import type { Pedido } from "./types";
import { orderWhatsAppMessage, whatsappPhone } from "./whatsapp";

export function whatsappBusinessConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const sender = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  const template = process.env.WHATSAPP_TEMPLATE_NAME?.trim() ?? "";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() ?? "";
  const version = process.env.WHATSAPP_GRAPH_VERSION?.trim() ?? "";
  const recipient = whatsappPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
  if (
    !token ||
    !recipient ||
    !/^\d+$/.test(sender) ||
    !/^[a-z0-9_]+$/.test(template) ||
    !/^[a-z]{2}(_[A-Z]{2})?$/.test(language) ||
    !/^v\d+\.\d+$/.test(version)
  ) {
    return null;
  }
  return {
    token,
    recipient,
    template,
    language,
    endpoint: `https://graph.facebook.com/${version}/${sender}`,
  };
}

async function orderDocument(order: Pedido) {
  const document = await PDFDocument.create();
  document.setTitle(`Pedido ${order.codigo}`);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const margin = 46;
  const pageSize = PageSizes.A4;
  const maxWidth = pageSize[0] - margin * 2;
  let page = document.addPage(pageSize);
  let y = pageSize[1] - margin;

  // La fuente estándar admite acentos del español y el alfabeto de Europa occidental.
  const lines = orderWhatsAppMessage(order)
    .normalize("NFC")
    .replace(/[^\n\x20-\x7e\xa0-\xff·•×–—‘’“”]/gu, " ")
    .split("\n");
  function draw(line: string) {
    if (y < margin) {
      page = document.addPage(pageSize);
      y = pageSize[1] - margin;
    }
    if (line)
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.12, 0.09, 0.08),
      });
    y -= 19;
  }
  for (const line of lines) {
    let current = "";
    for (const char of line) {
      if (font.widthOfTextAtSize(current + char, fontSize) > maxWidth) {
        const split = current.lastIndexOf(" ");
        if (split > 0) {
          draw(current.slice(0, split));
          current = current.slice(split + 1);
        } else {
          draw(current);
          current = "";
        }
      }
      current += char;
    }
    draw(current);
  }
  return document.save();
}

type SendState = "accepted" | "failed" | "unknown";
type SendResult = { status: SendState; messageId?: string };

async function submitTemplate(
  config: NonNullable<ReturnType<typeof whatsappBusinessConfig>>,
  order: Pedido,
): Promise<SendResult> {
  const filename = `pedido-${order.codigo.replace(/[^\w-]/g, "_")}.pdf`;
  let mediaId: string;
  const auth = { Authorization: `Bearer ${config.token}` };
  try {
    const form = new FormData();
    form.set("messaging_product", "whatsapp");
    form.set("type", "application/pdf");
    form.set(
      "file",
      new Blob([new Uint8Array(await orderDocument(order))], {
        type: "application/pdf",
      }),
      filename,
    );
    const response = await fetch(`${config.endpoint}/media`, {
      method: "POST",
      headers: auth,
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || typeof result?.id !== "string")
      return { status: "failed" };
    mediaId = result.id;
  } catch {
    return { status: "failed" };
  }

  try {
    const response = await fetch(`${config.endpoint}/messages`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: config.recipient,
        type: "template",
        template: {
          name: config.template,
          language: { code: config.language },
          components: [
            {
              type: "header",
              parameters: [
                { type: "document", document: { id: mediaId, filename } },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: order.codigo },
                { type: "text", text: `${formatCOP(order.total)} COP` },
              ],
            },
          ],
        },
      }),
    });
    if (!response.ok)
      return { status: response.status < 500 ? "failed" : "unknown" };
    const result = await response.json();
    const id = result?.messages?.[0]?.id;
    return typeof id === "string" && id.startsWith("wamid.")
      ? { status: "accepted", messageId: id }
      : { status: "unknown" };
  } catch {
    // A transport failure can occur after Meta accepts the message.
    return { status: "unknown" };
  }
}

export async function notifyOrderOnWhatsApp(order: Pedido) {
  const config = whatsappBusinessConfig();
  if (!config) return "not_configured";
  const db = createAdminClient();
  const notices = () => db.from("delta_order_whatsapp");
  const { error: insertError } = await notices().upsert(
    { pedido_id: order.id },
    { onConflict: "pedido_id", ignoreDuplicates: true },
  );
  if (insertError)
    throw new Error("No se pudo registrar el aviso de WhatsApp.");
  const { data: attempt, error: claimError } = await notices()
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("pedido_id", order.id)
    .in("status", ["pending", "failed"])
    .select("pedido_id")
    .maybeSingle();
  if (claimError) throw new Error("No se pudo iniciar el aviso de WhatsApp.");
  if (!attempt) return "already_attempted";

  const result = await submitTemplate(config, order);
  const { error: saveError } = await notices()
    .update({
      status: result.status,
      message_id: result.messageId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("pedido_id", order.id);
  if (saveError) throw new Error("No se pudo guardar el resultado del aviso.");
  return result.status;
}
