'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCOP, formatFecha } from '@/lib/format';
import {
  ESTADOS,
  ESTADO_COLOR,
  ESTADO_LABEL,
  type EstadoPedido,
  type Pedido,
} from '@/lib/pedidos/types';
import { Search, Eye, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AdminPedidosPage() {
  const supabase = createClient();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorTxt, setErrorTxt] = useState<string | null>(null);
  
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | 'todos'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('todo');

  const cargar = async () => {
    setLoading(true);
    setErrorTxt(null);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      setPedidos((data ?? []) as any);
    } catch (err: any) {
      console.error("Error cargando pedidos:", err);
      setErrorTxt(err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // Realtime para que se actualice solo
    const canal = supabase
      .channel('pedidos-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => cargar()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarEstado = async (id: string, estado: EstadoPedido) => {
    const res = await fetch(`/api/pedidos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) cargar();
  };

  const confirmarWhatsApp = async (id: string) => {
    const res = await fetch(`/api/pedidos/${id}/whatsapp`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmar: true }),
    });
    if (res.ok) cargar();
  };

  const pedidosFiltrados = useMemo(() => {
    let lista = [...pedidos];

    if (filtroEstado !== 'todos') {
      lista = lista.filter((p) => p.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.codigo?.toLowerCase().includes(q) ||
          p.cliente_nombre?.toLowerCase().includes(q) ||
          p.cliente_telefono?.includes(q)
      );
    }

    if (rango !== 'todo') {
      const ahora = new Date();
      let desde: Date;
      if (rango === 'hoy') {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      } else if (rango === 'semana') {
        desde = new Date(ahora);
        desde.setDate(ahora.getDate() - 7);
      } else {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }
      lista = lista.filter((p) => new Date(p.created_at) >= desde);
    }

    return lista;
  }, [pedidos, filtroEstado, busqueda, rango]);

  const nuevos = pedidos.filter((p) => p.estado === 'nuevo').length;
  const sinConfirmar = pedidos.filter((p) => p.whatsapp_confirmado === false).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pedidos</h1>
            <p className="text-xs text-slate-400 mt-1">
              {pedidos.length} pedidos ·{' '}
              <span className="text-amber-400 font-semibold">{nuevos} por atender</span>
              {sinConfirmar > 0 && (
                <span className="ml-2 text-red-400 font-semibold">
                  · {sinConfirmar} sin confirmar WhatsApp
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Mensaje de error visible si falla Supabase */}
        {errorTxt && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 p-4 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span><strong>Error de conexión:</strong> {errorTxt}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, cliente o teléfono"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Última semana</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Chip activo={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')}>
            Todos ({pedidos.length})
          </Chip>
          {ESTADOS.map((e) => (
            <Chip
              key={e}
              activo={filtroEstado === e}
              onClick={() => setFiltroEstado(e)}
            >
              {ESTADO_LABEL[e]} ({pedidos.filter((p) => p.estado === e).length})
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm animate-pulse">Cargando pedidos desde Supabase...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No hay pedidos que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-950/50 text-slate-400 text-xs">
                <tr>
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Estado</th>
                  <th className="text-center p-3">WhatsApp</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-center p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p: any) => (
                  <tr
                    key={p.id}
                    className={`border-t border-slate-800 hover:bg-slate-900/50 ${
                      p.whatsapp_confirmado === false ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="p-3 font-mono text-amber-400">{p.codigo ?? '—'}</td>
                    <td className="p-3 text-white">
                      {p.cliente_nombre}
                      <div className="text-xs text-slate-500">{p.cliente_telefono}</div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold">
                      {formatCOP(Number(p.total))}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded border text-[10px] font-bold ${ESTADO_COLOR[p.estado as EstadoPedido] ?? ''}`}
                      >
                        {ESTADO_LABEL[p.estado as EstadoPedido] ?? p.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.whatsapp_confirmado ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Confirmado
                        </span>
                      ) : (
                        <button
                          onClick={() => confirmarWhatsApp(p.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-[10px] font-bold text-white transition-colors"
                          title="Marcar que el WhatsApp llegó"
                        >
                          <XCircle className="w-3 h-3" /> Confirmar
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-xs">
                      {formatFecha(p.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <Link
                          href={`/admin/pedidos/${p.codigo}`}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
                          title="Ver detalle"
                        >
                          <Eye className="w-3 h-3 inline" />
                        </Link>
                        {p.estado === 'nuevo' && (
                          <button
                            onClick={() => cambiarEstado(p.id, 'pagado')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-bold"
                          >
                            ✓ Pagado
                          </button>
                        )}
                        {p.estado === 'pagado' && (
                          <button
                            onClick={() => cambiarEstado(p.id, 'entregado')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold"
                          >
                            🚚 Entregado
                          </button>
                        )}
                        {p.estado !== 'cancelado' && p.estado !== 'entregado' && (
                          <button
                            onClick={() => cambiarEstado(p.id, 'cancelado')}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px]"
                          >
                            ✗
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        activo
          ? 'bg-amber-500 text-slate-950 border-amber-500'
          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
      }`}
    >
      {children}
    </button>
  );
}