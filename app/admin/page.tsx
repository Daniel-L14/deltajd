'use client';

import { useEffect, useState } from 'react';
import { formatCOP } from '@/lib/format';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Flame,
  Package,
} from 'lucide-react';

type Resumen = {
  ventasHoy: number;
  ventasMes: number;
  pedidosNuevos: number;
  ticketPromedio: number;
  topProductos: { nombre: string; cantidad: number }[];
  stockBajo: { id: string; name: string; stock: number }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats/resumen')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? 'Error al cargar stats');
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-slate-400 text-sm">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard General</h1>
        <p className="text-xs text-slate-400">
          Resumen operativo y comercial de la perfumería DELTA.
        </p>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI
          titulo="Ventas hoy"
          valor={formatCOP(data.ventasHoy)}
          icono={<DollarSign className="w-4 h-4" />}
          color="emerald"
          destacado
        />
        <KPI
          titulo="Ventas del mes"
          valor={formatCOP(data.ventasMes)}
          icono={<TrendingUp className="w-4 h-4" />}
          color="amber"
          destacado
        />
        <KPI
          titulo="Por atender"
          valor={String(data.pedidosNuevos)}
          icono={<ShoppingBag className="w-4 h-4" />}
          color="blue"
        />
        <KPI
          titulo="Ticket promedio"
          valor={formatCOP(data.ticketPromedio)}
          icono={<Flame className="w-4 h-4" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 productos */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-amber-400 mb-4">
            Top 5 productos del mes
          </h2>
          {data.topProductos.length === 0 ? (
            <p className="text-xs text-slate-500">Aún no hay ventas este mes.</p>
          ) : (
            <div className="space-y-3">
              {data.topProductos.map((p, i) => {
                const max = data.topProductos[0].cantidad || 1;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white">
                        {i + 1}. {p.nombre}
                      </span>
                      <span className="text-amber-400 font-bold">{p.cantidad}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${(p.cantidad / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stock bajo */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Stock bajo
          </h2>
          {data.stockBajo.length === 0 ? (
            <p className="text-xs text-slate-500">
              Todos los productos tienen stock suficiente.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.stockBajo.map((p) => (
                <li key={p.id} className="flex justify-between text-xs">
                  <span className="text-white flex items-center gap-2">
                    <Package className="w-3 h-3 text-slate-500" />
                    {p.name}
                  </span>
                  <span className="text-red-400 font-bold">{p.stock} un.</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KPI({
  titulo,
  valor,
  icono,
  color,
  destacado,
}: {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
  destacado?: boolean;
}) {
  const colores = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
      <div className="text-slate-400 text-xs font-semibold flex justify-between items-center">
        <span>{titulo}</span>
        <span className={`p-1.5 rounded-lg border ${colores[color]}`}>{icono}</span>
      </div>
      <div
        className={`font-extrabold ${
          destacado ? 'text-2xl text-amber-400' : 'text-2xl text-white'
        }`}
      >
        {valor}
      </div>
    </div>
  );
}