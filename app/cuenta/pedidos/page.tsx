"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatCOP, formatFecha } from "@/lib/format";
import type { Pedido } from "@/lib/pedidos/types";
export default function MyOrders() {
  const [orders, setOrders] = useState<Pedido[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(1),
    [count, setCount] = useState(0);
  useEffect(() => {
    let live = true;
    async function load() {
      setLoading(true);
      try {
        const d = await api<{ pedidos: Pedido[]; count: number }>(
          `/api/cuenta/pedidos?page=${page}`,
        );
        if (live) {
          setOrders(d.pedidos);
          setCount(d.count);
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [page]);
  return (
    <main className="delta-container space-y-5">
      <Link href="/tienda">← Catálogo</Link>
      <h1 className="delta-title">Mis <em>pedidos</em></h1>
      {error ? (
        <p role="alert">
          {error} <Link href="/login?next=/cuenta/pedidos">Iniciar sesión</Link>
        </p>
      ) : loading ? (
        <p>Cargando…</p>
      ) : !orders.length ? (
        <p>
          No tienes pedidos vinculados a esta cuenta. Para recuperar uno
          antiguo, contacta a la tienda.
        </p>
      ) : (
        orders.map((o) => (
          <Link
            href={`/tienda/pedido/${o.codigo}`}
            key={o.id}
            className="delta-card block space-y-2"
          >
            <p className="font-mono break-all">{o.codigo}</p>
            <p>
              {formatFecha(o.created_at)} · {o.estado}
            </p>
            <p className="text-amber-300">{formatCOP(o.total)}</p>
          </Link>
        ))
      )}
      <div className="flex justify-between">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          disabled={page * 20 >= count || loading}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </main>
  );
}
