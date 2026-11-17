"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { ESTADOS, ESTADO_LABEL, type Pedido } from "@/lib/pedidos/types";
import { formatCOP, formatFecha } from "@/lib/format";
export default function Orders() {
  const [orders, setOrders] = useState<Pedido[]>([]),
    [page, setPage] = useState(1),
    [count, setCount] = useState(0),
    [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [period, setPeriod] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const query = new URLSearchParams({
    page: String(page),
    q: search,
    state,
    period,
  }).toString();
  const load = useCallback(async () => {
    try {
      const d = await api<{ pedidos: Pedido[]; count: number }>(
        `/api/pedidos?${query}`,
      );
      setOrders(d.pedidos);
      setCount(d.count);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);
  useEffect(() => {
    let live = true;
    api<{ pedidos: Pedido[]; count: number }>(`/api/pedidos?${query}`)
      .then((d) => {
        if (live) {
          setOrders(d.pedidos);
          setCount(d.count);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [query]);
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <h1 className="delta-title">Pedidos</h1>
        <button
          className="delta-secondary"
          onClick={() => void load()}
          disabled={loading}
        >
          Actualizar
        </button>
      </div>
      <label className="block">
        Buscar pedidos
        <input
          className="delta-input"
          value={search}
          maxLength={100}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cliente, código o estado"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Estado
          <select
            className="delta-input"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {ESTADOS.map((value) => (
              <option key={value} value={value}>
                {ESTADO_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de registro
          <select
            className="delta-input"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            <option value="today">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Este mes</option>
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {loading ? (
        <p>Cargando…</p>
      ) : (
        orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/pedidos/${o.codigo}`}
            className="delta-card block space-y-2"
          >
            <p className="font-mono break-all">{o.codigo}</p>
            <p>
              {o.cliente_nombre} · {formatFecha(o.created_at)}
            </p>
            <p className="text-amber-300">
              {formatCOP(o.total)} · {o.estado}
            </p>
            <p>
              WhatsApp:{" "}
              {o.whatsapp_confirmado ? "contacto confirmado" : "sin confirmar"}
            </p>
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
        <span>
          Página {page} · {count} pedidos
        </span>
        <button
          disabled={page * 50 >= count || loading}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
