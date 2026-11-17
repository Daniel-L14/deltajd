"use client";
import { Suspense } from "react";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import type { Pedido } from "@/lib/pedidos/types";
import { transitions } from "@/lib/validation";
import { formatCOP, formatFecha } from "@/lib/format";
interface History {
  id: string;
  estado: string;
  nota: string | null;
  creado_at: string;
  actor_id: string | null;
}
function Content({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params),
    [pedido, setPedido] = useState<Pedido | null>(null),
    [history, setHistory] = useState<History[]>([]),
    [nota, setNota] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await api<{ pedido: Pedido; historial: History[] }>(
        `/api/admin/pedidos/${encodeURIComponent(codigo)}`,
      );
      setPedido(d.pedido);
      setHistory(d.historial);
      setNota(d.pedido.notas_admin ?? "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [codigo]);
  useEffect(() => {
    let live = true;
    api<{ pedido: Pedido; historial: History[] }>(
      `/api/admin/pedidos/${encodeURIComponent(codigo)}`,
    )
      .then((d) => {
        if (live) {
          setPedido(d.pedido);
          setHistory(d.historial);
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
    if (!pedido) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/api/pedidos/${pedido.id}/${suffix}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setMessage("Cambio guardado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
            <h1 className="text-2xl break-all">{pedido.codigo}</h1>
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
              {(transitions[pedido.estado?.toLowerCase() === "pendiente" ? "nuevo" : pedido.estado] ?? []).map((estado) => (
                <button
                  className="delta-button"
                  disabled={busy}
                  key={estado}
                  onClick={() => {
                    if (
                      confirm(
                        `¿Confirmar estado ${estado}? ${estado === "pagado" ? "Verifica primero que recibiste el pago." : ""}`,
                      )
                    )
                      void action("estado", {
                        estado,
                        nota: nota || undefined,
                      });
                  }}
                >
                  Marcar {estado}
                </button>
              ))}
              <button
                className="delta-secondary"
                disabled={busy}
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
            <button className="delta-secondary" disabled={busy}>
              Guardar nota
            </button>
          </form>
          <section className="delta-card space-y-3">
            <h2>Historial de estados</h2>
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
