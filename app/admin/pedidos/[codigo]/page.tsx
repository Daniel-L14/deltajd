'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCOP, formatFecha } from '@/lib/format';
import { ESTADO_COLOR, ESTADO_LABEL, type EstadoPedido, type ItemPedido } from '@/lib/pedidos/types';
import { ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';

function DetalleContent() {
  const params = useParams();
  const codigo = (params?.codigo as string) ?? '';
  const router = useRouter();
  const supabase = createClient();

  const [pedido, setPedido] = useState<any>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    if (!codigo) return;
    const { data: p } = await supabase.from('pedidos').select('*').eq('codigo', codigo).single();

    if (!p) { setLoading(false); return; }

    setPedido(p);
    setNota(p.notas_admin ?? '');

    const { data: its } = await supabase.from('pedido_items').select('*').eq('pedido_id', p.id);
    setItems((its ?? []) as ItemPedido[]);

    const { data: h } = await supabase.from('pedido_historial').select('*').eq('pedido_id', p.id).order('creado_at', { ascending: true });
    setHistorial(h ?? []);

    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  const cambiarEstado = async (estado: EstadoPedido) => {
    if (!pedido) return;
    const res = await fetch(`/api/pedidos/${pedido.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) cargar();
  };

  const guardarNota = async () => {
    if (!pedido) return;
    await supabase.from('pedidos').update({ notas_admin: nota }).eq('id', pedido.id);
    cargar();
  };

  const abrirWhatsApp = () => {
    if (!pedido) return;
    const msg = encodeURIComponent(`Hola ${pedido.cliente_nombre}, tu pedido ${pedido.codigo} está en estado ${ESTADO_LABEL[pedido.estado as EstadoPedido]}. Total: ${formatCOP(Number(pedido.total))}.`);
    window.open(`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>;
  
  if (!pedido) return (
    <div className="p-8 flex flex-col gap-4 max-w-md mx-auto text-center mt-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
      <p className="text-red-400 font-bold text-lg">Pedido no encontrado</p>
      <p className="text-slate-400 text-sm">El código {codigo} no existe en la base de datos.</p>
      <button onClick={() => router.push('/admin/pedidos')} className="px-4 py-2 bg-slate-800 text-white rounded-lg">Volver a Pedidos</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <p className="text-xs text-amber-400 font-semibold tracking-widest">PEDIDO</p>
            <h1 className="text-3xl font-bold text-white font-mono">{pedido.codigo}</h1>
            <p className="text-xs text-slate-400 mt-1">Creado el {formatFecha(pedido.created_at)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded border text-xs font-bold ${ESTADO_COLOR[pedido.estado as EstadoPedido]}`}>
              {ESTADO_LABEL[pedido.estado as EstadoPedido] ?? pedido.estado}
            </span>
            <button onClick={abrirWhatsApp} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </button>
          </div>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <h2 className="text-sm font-semibold text-amber-400 mb-2">Cliente</h2>
          <p className="text-white font-semibold">{pedido.cliente_nombre}</p>
          <p className="text-sm text-slate-300">📞 {pedido.cliente_telefono}</p>
          <p className="text-sm text-slate-300">📍 {pedido.direccion}</p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Productos</h2>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm border-b border-slate-800 pb-2">
                <span>{it.cantidad}x {it.nombre} <span className="text-slate-500 text-xs">({formatCOP(it.precio)})</span></span>
                <span className="font-semibold">{formatCOP(it.subtotal ?? it.precio * it.cantidad)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-bold">
              <span>Total</span>
              <span className="text-amber-400">{formatCOP(Number(pedido.total))}</span>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Cambiar estado</h2>
          <div className="flex gap-2 flex-wrap">
            {(['nuevo', 'pagado', 'entregado', 'cancelado'] as EstadoPedido[]).map((e) => (
              <button
                key={e}
                onClick={() => cambiarEstado(e)}
                disabled={pedido.estado === e}
                className={`px-3 py-1.5 rounded text-xs font-bold border ${pedido.estado === e ? 'opacity-40 cursor-not-allowed ' + ESTADO_COLOR[e] : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
              >
                {ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Notas internas</h2>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: paga con Nequi, entregar en portería..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 min-h-[80px]" />
          <button onClick={guardarNota} className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold">Guardar nota</button>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Historial</h2>
          <ul className="space-y-2 text-xs">
            {historial.map((h: any) => (
              <li key={h.id} className="flex justify-between text-slate-400">
                <span><span className="font-semibold text-white capitalize">{ESTADO_LABEL[h.estado as EstadoPedido] ?? h.estado}</span> · <span className="text-slate-500">{h.actor}</span></span>
                <span>{formatFecha(h.creado_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function DetallePedidoPage() {
  return <Suspense fallback={<div className="p-8 text-white">Cargando...</div>}><DetalleContent /></Suspense>;
}