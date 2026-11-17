"use client";
import { Suspense } from "react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatCOP } from "@/lib/format";
import { ESTADO_LABEL, type Pedido } from "@/lib/pedidos/types";
import { orderWhatsAppMessage, whatsappPhone } from "@/lib/pedidos/whatsapp";
import Navbar from "@/app/components/layout/Navbar";

function Content({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params),
    [pedido, setPedido] = useState<Pedido | null>(null),
    [error, setError] = useState(""),
    [copied, setCopied] = useState("");
  useEffect(() => {
    let live = true;
    api<{ pedido: Pedido }>(`/api/cuenta/pedidos/${encodeURIComponent(codigo)}`)
      .then((d) => {
        if (live) setPedido(d.pedido);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [codigo]);
  const phone = whatsappPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
  const message = pedido
    ? `Hola, DELTA. Quiero coordinar el pago de este pedido.\n\n${orderWhatsAppMessage(pedido)}`
    : "";
  const text = encodeURIComponent(message);
  const useClipboard = text.length > 6000;

  return (
    <div className="delta-frame min-h-screen">
      <Navbar />
      <main className="delta-container max-w-2xl space-y-6 py-8 sm:py-14">
        <Link href="/cuenta/pedidos">← Mis pedidos</Link>
        {error ? (
          <p role="alert">
            {error}{" "}
            <Link
              href={`/login?next=${encodeURIComponent("/tienda/pedido/" + codigo)}`}
            >
              Iniciar sesión
            </Link>
          </p>
        ) : !pedido ? (
          <p>Cargando pedido…</p>
        ) : (
          <section className="delta-card space-y-5 px-5 py-6 sm:p-8">
            <div className="space-y-3">
              <h1 className="delta-title">
                Pedido <em>registrado</em>
              </h1>
              <p className="break-all font-mono text-sm text-slate-400">
                {pedido.codigo}
              </p>
            </div>
            <p className="text-sm">
              Estado: {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
            </p>
            <ul className="divide-y divide-gold-400/15 border-y border-gold-400/15">
              {(pedido.items ?? []).map((i, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span>
                    {i.nombre} × {i.cantidad}
                  </span>
                  <strong className="whitespace-nowrap tabular-nums">
                    {formatCOP(i.precio * i.cantidad)}
                  </strong>
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span>Total de productos</span>
              <strong className="text-2xl text-gold-300 tabular-nums">
                {formatCOP(pedido.total)}
              </strong>
            </p>
            <p className="text-sm text-slate-400">
              La tienda confirmará cuando reciba tu pago.
            </p>
            {phone ? (
              <div className="space-y-3 border-t border-gold-400/15 pt-5">
                <a
                  className="delta-button"
                  href={`https://wa.me/${phone}${useClipboard ? "" : `?text=${text}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Coordinar pago por WhatsApp
                </a>
                <p className="text-sm text-slate-300">
                  {useClipboard
                    ? "Copia el detalle, pégalo en el chat de DELTA y pulsa Enviar."
                    : "Revisa el detalle del pedido y pulsa Enviar en WhatsApp."}
                </p>
                {useClipboard && (
                  <div className="space-y-2">
                    <label className="block">
                      Mensaje del pedido
                      <textarea
                        className="delta-input block w-full"
                        value={message}
                        readOnly
                        rows={6}
                      />
                    </label>
                    <button
                      type="button"
                      className="delta-secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(message);
                          setCopied("Detalle copiado.");
                        } catch {
                          setCopied(
                            "Selecciona el texto del mensaje para copiarlo.",
                          );
                        }
                      }}
                    >
                      Copiar detalle
                    </button>
                    <p role="status" className="text-sm">
                      {copied}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p>Contacta a la tienda indicando tu código de pedido.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <Content params={params} />
    </Suspense>
  );
}
