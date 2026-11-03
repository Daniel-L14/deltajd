'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Boxes, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
  last_updated: string;
  perfumes: {
    id: string;
    name: string;
    brand: string;
    type: string;
    is_active: boolean;
  };
}

export default function InventarioView() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        stock_quantity,
        cost_price,
        selling_price,
        last_updated,
        perfumes ( id, name, brand, type, is_active )
      `);

    if (!error && data) {
      setInventory(data as unknown as InventoryItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = async (inventoryId: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(inventoryId);

    const { error } = await supabase
      .from('inventory')
      .update({ 
        stock_quantity: newStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', inventoryId);

    if (!error) {
      fetchInventory();
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" /> Control de Inventario
          </h1>
          <p className="text-xs text-slate-400">
            Gestiona las existencias en tiempo real. La visibilidad en tienda se sincroniza automáticamente.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Costo / Venta</th>
              <th className="p-4">Estado Tienda</th>
              <th className="p-4 text-center">Unidades (Stock)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{item.perfumes?.name}</div>
                  <div className="text-[10px] text-slate-400">{item.perfumes?.brand}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.perfumes?.type === 'ORIGINAL' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {item.perfumes?.type}
                  </span>
                </td>
                <td className="p-4">
                  <div>${Number(item.selling_price).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">Costo: ${Number(item.cost_price).toLocaleString()}</div>
                </td>
                <td className="p-4">
                  {item.stock_quantity > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> En Catálogo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-400 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Oculto (Agotado)
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStockChange(item.id, item.stock_quantity - 1)}
                      disabled={updatingId === item.id || item.stock_quantity <= 0}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold text-sm disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-white text-sm">
                      {item.stock_quantity}
                    </span>
                    <button
                      onClick={() => handleStockChange(item.id, item.stock_quantity + 1)}
                      disabled={updatingId === item.id}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold text-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}