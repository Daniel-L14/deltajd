"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";
import type { ItemPedido } from "@/lib/pedidos/types";

type Quantity = { producto_id: string; cantidad: number };

export default function OrderQuantityEditor({
  items,
  busy,
  onCancel,
  onSave,
}: {
  items: (ItemPedido & { producto_id: string })[];
  busy: boolean;
  onCancel: () => void;
  onSave: (items: Quantity[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() =>
    items.map((item) => String(item.cantidad)),
  );
  const quantities = draft.map(Number);
  const valid = draft.every((value) => /^(0|[1-9][0-9]?)$/.test(value));
  const hasItems = quantities.some((quantity) => quantity > 0);
  const changed = items.some((item, index) => item.cantidad !== quantities[index]);
  const total = items.reduce(
    (sum, item, index) => sum + item.precio * quantities[index],
    0,
  );

  return (
    <form
      className="delta-card space-y-4"
      aria-labelledby="editar-pedido-titulo"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || !valid || !hasItems || !changed) return;
        void onSave(items.map((item, index) => ({
          producto_id: item.producto_id,
          cantidad: quantities[index],
        })));
      }}
    >
      <h2 id="editar-pedido-titulo" className="delta-section-title">
        Editar <em>pedido</em>
      </h2>
      <p className="text-sm text-slate-300">
        Usa 0 para retirar un perfume. Al guardar, DELTA ajustará la reserva
        y conservará el precio unitario de cada perfume.
      </p>
      <fieldset disabled={busy} className="divide-y divide-gold-400/15">
        <legend className="sr-only">Cantidades de perfumes</legend>
        {items.map((item, index) => (
          <div key={item.producto_id} className="flex flex-wrap items-end gap-4 py-3">
            <div className="min-w-36 flex-1">
              <p className="font-medium">{item.nombre}</p>
              <p className="text-sm text-slate-400">{formatCOP(item.precio)} por unidad</p>
            </div>
            <label className="flex w-24 flex-col gap-1 text-sm">
              Cantidad <span className="sr-only">de {item.nombre}</span>
              <input
                className="delta-input"
                type="number"
                min={0}
                max={99}
                step={1}
                required
                inputMode="numeric"
                value={draft[index]}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((values) => values.map((old, i) => i === index ? value : old));
                }}
              />
            </label>
            <div className="w-28 text-right text-sm tabular-nums">
              {valid ? formatCOP(item.precio * quantities[index]) : "—"}
            </div>
          </div>
        ))}
      </fieldset>
      <p className="flex flex-wrap items-center justify-between gap-2 border-t border-gold-400/15 pt-4" aria-live="polite">
        Nuevo total
        <strong className="text-xl text-gold-300 tabular-nums">{valid ? formatCOP(total) : "—"}</strong>
      </p>
      {valid && !hasItems && (
        <p className="text-sm text-amber-300">Conserva al menos un perfume o cancela el pedido.</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button className="delta-button" disabled={busy || !valid || !hasItems || !changed}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" className="delta-secondary" disabled={busy} onClick={onCancel}>
          Descartar cambios
        </button>
      </div>
    </form>
  );
}
