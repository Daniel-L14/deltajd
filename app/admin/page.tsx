'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const loadStats = async () => {
      const { data: pedidos } = await supabase.from('pedidos').select('total');
      const { data: productos } = await supabase.from('productos').select('id');

      if (pedidos) {
        setTotalPedidos(pedidos.length);
        setTotalVentas(pedidos.reduce((acc, p) => acc + (p.total || 0), 0));
      }

      if (productos) {
        setTotalProductos(productos.length);
      }
    };

    loadStats();
  }, [supabase]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard General</h1>
        <p className="text-xs text-slate-400">Resumen operativo y comercial de la perfumería DELTA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex justify-between items-center">
            <span>Ingresos Totales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">${totalVentas.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex justify-between items-center">
            <span>Pedidos Registrados</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalPedidos}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex justify-between items-center">
            <span>Productos en Inventario</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalProductos}</div>
        </div>
      </div>
    </div>
  );
}