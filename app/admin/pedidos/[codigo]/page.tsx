"use client";
import { Suspense } from "react";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import type { ItemPedido, Pedido } from "@/lib/pedidos/types";
import { transitions } from "@/lib/validation";
import { formatCOP, formatFecha } from "@/lib/format";
import { orderWhatsAppLink, orderWhatsAppMessage, updatedOrderWhatsApp } from "@/lib/pedidos/whatsapp";
import OrderQuantityEditor from "@/app/components/admin/OrderQuantityEditor";
interface History {
  id: string;
  estado: string;
  nota: string | null;
  creado_at: string;
  actor_id: string | null;
}

const noticeLabels = {
  pending: "Pendiente de enviar",
  sending: "Envío en curso. Si el estado persiste, revisa el chat de la empresa.",
  accepted: "Aceptado por WhatsApp",
  failed: "Falló el envío. Puedes volver a intentarlo.",
  unknown: "Entrega por verificar en el chat de la empresa.",
  unavailable: "El estado del envío no está disponible en este momento.",
};

type OrderDetails = {
  pedido: Pedido;
  historial: History[];
  whatsappAviso: {
    configured: boolean;
    status: keyof typeof noticeLabels;
  };
};

function Content({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params),
    [pedido, setPedido] = useState<Pedido | null>(null),
    [history, setHistory] = useState<History[]>([]),
    [notice, setNotice] = useState<OrderDetails["whatsappAviso"] | null>(null),
    [nota, setNota] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await api<OrderDetails>(
        `/api/admin/pedidos/${encodeURIComponent(codigo)}`,
      );
      setPedido(d.pedido);
      setHistory(d.historial);
      setNotice(d.whatsappAviso);
      setNota(d.pedido.notas_admin ?? "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [codigo]);
  useEffect(() => {
    let live = true;
    api<OrderDetails>(
      `/api/admin/pedidos/${encodeURIComponent(codigo)}`,
    )
      .then((d) => {
        if (live) {
          setPedido(d.pedido);
          setHistory(d.historial);
          setNotice(d.whatsappAviso);
          setNota(d.pedido.notas_admin ?? "");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [codigo]);
  async function action(suffix: string, data: unknown) {
    if (!pedido || busy) return false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/pedidos/${pedido.id}/${suffix}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (suffix !== "whatsapp-aviso") setMessage("Cambio guardado.");
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const estado = pedido?.estado?.toLowerCase();
  const pendiente = estado === "nuevo" || estado === "pendiente";
  const items = pedido?.items ?? [];
  const productos = items.filter(
    (item): item is ItemPedido & { producto_id: string } => Boolean(item.producto_id),
  );
  const editable = pendiente && pedido?.stock_reserved && pedido.items_revision !== undefined &&
    productos.length > 0 && productos.length === items.length;
  const whatsapp = pedido && pendiente && (pedido.items_revision ?? 0) > 0
    ? updatedOrderWhatsApp(pedido)
    : null;
  const companyMessage = pedido && estado !== "cancelado" ? orderWhatsAppMessage(pedido) : "";
  const companyChat = companyMessage ? orderWhatsAppLink(companyMessage) : null;
  return (
    <div className="space-y-5">
      <Link href="/admin/pedidos">← Pedidos</Link>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-300">
          {message}
        </p>
      )}
      {!pedido ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="delta-card space-y-3">
            <h1 className="delta-title">Detalle del <em>pedido</em></h1>
            <p className="break-all font-mono text-sm">{pedido.codigo}</p>
            <p>
              {pedido.cliente_nombre} · {pedido.cliente_email}
            </p>
            <p>
              {pedido.cliente_telefono} · {pedido.direccion}
            </p>
            <p>Estado: {pedido.estado}</p>
            <p className="text-2xl">{formatCOP(pedido.total)}</p>
            {(pedido.items ?? []).map((i, n) => (
              <p key={n}>
                {i.nombre} × {i.cantidad} · {formatCOP(i.precio)}
              </p>
            ))}
            <div className="flex flex-wrap gap-3">
              {editable && !editing && (
                <button className="delta-button" disabled={busy} onClick={() => {
                  setMessage("");
                  setError("");
                  setEditing(true);
                }}>
                  Editar pedido
                </button>
              )}
              {(transitions[pedido.estado?.toLowerCase() === "pendiente" ? "nuevo" : pedido.estado] ?? []).map((estado) => (
                <button
                  className="delta-button"
                  disabled={busy || editing}
                  key={estado}
                  onClick={() => {
                    if (
                      confirm(
                        estado === "pagado"
                          ? `¿Confirmas que recibiste el pago de ${formatCOP(pedido.total)}?`
                          : `¿Confirmar estado ${estado}?`,
                      )
                    )
                      void action("estado", {
                        estado,
                        nota: nota || undefined,
                        ...(estado === "pagado" ? { revision: pedido.items_revision } : {}),
                      });
                  }}
                >
                  Marcar {estado}
                </button>
              ))}
              <button
                className="delta-secondary"
                disabled={busy || editing}
                onClick={() =>
                  void action("whatsapp", {
                    confirmar: !pedido.whatsapp_confirmado,
                  })
                }
              >
                {pedido.whatsapp_confirmado
                  ? "Desmarcar contacto WhatsApp"
                  : "Confirmar contacto WhatsApp"}
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Confirmar contacto no confirma un pago. Los pedidos pagados no se
              cancelan desde este flujo; cualquier devolución exige
              conciliación.
            </p>
          </div>
          {editing && editable && (
            <OrderQuantityEditor
              items={productos}
              busy={busy}
              onCancel={() => {
                setEditing(false);
                setError("");
              }}
              onSave={async (items) => {
                if (await action("cantidades", { items, revision: pedido.items_revision })) {
                  setEditing(false);
                }
              }}
            />
          )}
          {error && (
            <button className="delta-secondary" disabled={busy} onClick={async () => {
              setBusy(true);
              setEditing(false);
              setError("");
              setMessage("");
              await load();
              setBusy(false);
            }}>
              Recargar pedido
            </button>
          )}
          {whatsapp && !editing && (
            <section className="delta-card space-y-3" aria-labelledby="resumen-actualizado">
              <h2 id="resumen-actualizado" className="delta-section-title">
                Compartir el <em>pedido actualizado</em>
              </h2>
              {whatsapp.href && (
                <a className="delta-secondary inline-flex" href={whatsapp.href} target="_blank" rel="noopener noreferrer">
                  Abrir WhatsApp del cliente
                </a>
              )}
              {whatsapp.useClipboard ? (
                <label className="block text-sm text-slate-300">
                  Copia el resumen y pégalo en la conversación con el cliente.
                  <textarea className="delta-input mt-2 block w-full" readOnly rows={5} value={whatsapp.message} />
                </label>
              ) : (
                <p className="text-sm text-slate-300">Revisa el resumen y pulsa Enviar dentro de WhatsApp.</p>
              )}
            </section>
          )}
          {!editing && (companyChat || notice?.configured) && (
            <section className="delta-card space-y-3" aria-labelledby="aviso-whatsapp">
              <h2 id="aviso-whatsapp" className="delta-section-title">
                Aviso por <em>WhatsApp</em>
              </h2>
              {companyChat && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Abre el chat comercial de DELTA con el resumen del pedido preparado.
                    Revisa el mensaje y pulsa Enviar dentro de WhatsApp.
                  </p>
                  {companyChat.useClipboard && (
                    <label className="block text-sm text-slate-300">
                      Copia este resumen y pégalo en el chat.
                      <textarea className="delta-input mt-2 block w-full" readOnly rows={5} value={companyMessage} />
                    </label>
                  )}
                  <a className="delta-secondary inline-flex" href={companyChat.href} target="_blank" rel="noopener noreferrer">
                    Abrir WhatsApp de DELTA
                  </a>
                </div>
              )}
              {notice?.configured && (
                <p role="status" className="border-t border-gold-400/15 pt-3 text-sm text-slate-300">
                  <strong>Aviso automático</strong> · {noticeLabels[notice.status]}
                </p>
              )}
              {notice?.configured &&
                estado !== "cancelado" &&
                (notice.status === "pending" || notice.status === "failed") && (
                  <button
                    type="button"
                    className="delta-secondary"
                    disabled={busy}
                    onClick={() => void action("whatsapp-aviso", {})}
                  >
                    {notice.status === "failed" ? "Reintentar aviso automático" : "Enviar aviso automático"}
                  </button>
                )}
            </section>
          )}
          <form
            className="delta-card space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void action("nota", { nota });
            }}
          >
            <label className="block">
              Nota interna
              <textarea
                className="delta-input"
                value={nota}
                maxLength={1000}
                onChange={(e) => setNota(e.target.value)}
              />
            </label>
            <button className="delta-secondary" disabled={busy || editing}>
              Guardar nota
            </button>
          </form>
          <section className="delta-card space-y-3">
            <h2 className="delta-section-title">Historial de <em>estados</em></h2>
            {history.map((h) => (
              <p key={h.id}>
                {formatFecha(h.creado_at)} · {h.estado} · {h.nota}{" "}
                <span className="block text-xs text-slate-400">
                  Actor: {h.actor_id ?? "Registro histórico"}
                </span>
              </p>
            ))}
          </section>
        </>
      )}
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
