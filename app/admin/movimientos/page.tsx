"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatFecha } from "@/lib/format";
import Link from "next/link";
interface Movement {
  id: string;
  productos: { name: string };
  delta: number;
  before_stock: number;
  after_stock: number;
  reason: string;
  created_at: string;
  actor_id: string;
}
export default function Movements() {
  const [rows, setRows] = useState<Movement[]>([]),
    [page, setPage] = useState(1),
    [count, setCount] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api<{ movimientos: Movement[]; count: number }>(
      `/api/admin/movimientos?page=${page}`,
    )
      .then((d) => {
        if (live) {
          setRows(d.movimientos);
          setCount(d.count);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [page]);
  return (
    <div className="space-y-5">
      <Link href="/admin/inventario">← Inventario</Link>
      <h1 className="delta-title">Movimientos de <em>inventario</em></h1>
      {error && <p role="alert">{error}</p>}
      {rows.map((r) => (
        <article key={r.id} className="delta-card">
          <h2>{r.productos?.name}</h2>
          <p>
            {r.before_stock} → {r.after_stock} ({r.delta > 0 ? "+" : ""}
            {r.delta}) · {r.reason}
          </p>
          <p>{formatFecha(r.created_at)}</p>
          <p className="text-xs text-slate-400">Actor: {r.actor_id}</p>
        </article>
      ))}
      <div className="flex justify-between">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button disabled={page * 50 >= count} onClick={() => setPage(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
