'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, RefreshCw, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';

interface Pedido {
  id: string;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
  total: number;
  estado: 'pendiente' | 'completado' | 'enviado' | 'cancelado';
  items: Array<{ name: string; cantidad: number; price: number }>;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPedidos(data as Pedido[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();

    // 🔴 Suscripción en Tiempo Real con Supabase
    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos((prev) => [payload.new as Pedido, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Pedido) : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateEstado = async (id: string, nuevoEstado: string) => {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" /> Pedidos en Tiempo Real
          </h1>
          <p className="text-xs text-slate-400">Los nuevos pedidos realizados por tus clientes se reflejan automáticamente.</p>
        </div>
        <button
          onClick={fetchPedidos}
          className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {pedidos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm font-medium">No hay pedidos registrados aún.</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-amber-400 font-bold">#{pedido.id.slice(0, 8)}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(pedido.created_at).toLocaleString('es-CO')}
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">{pedido.cliente_nombre || 'Cliente General'}</h3>
                <p className="text-xs text-slate-400">{pedido.cliente_email}</p>
                
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300">Items: </span>
                  <span className="text-xs text-slate-400">
                    {pedido.items?.map(i => `${i.cantidad}x ${i.name}`).join(', ') || 'Sin detalle de items'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total del Pedido</span>
                  <span className="text-xl font-extrabold text-amber-400">${Number(pedido.total || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={pedido.estado || 'pendiente'}
                    onChange={(e) => updateEstado(pedido.id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="enviado">Enviado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}