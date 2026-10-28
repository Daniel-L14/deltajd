'use client';

import { useState, useTransition } from 'react';
import { updateStock } from './actions';

export default function StockUpdater({ id, initialStock }: { id: string; initialStock: number }) {
  const [stock, setStock] = useState(initialStock);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    startTransition(async () => {
      await updateStock(id, stock);
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-amber-500"
        min={0}
      />
      <button
        onClick={handleUpdate}
        disabled={isPending || stock === initialStock}
        className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-slate-950 font-medium text-xs px-3 py-1.5 rounded transition-colors"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}