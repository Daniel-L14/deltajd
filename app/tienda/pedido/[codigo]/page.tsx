'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCOP } from '@/lib/format';
import { CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react';

function ConfirmacionContent() {
  const params = useParams();
  const codigo = (params?.codigo as string) ?? '';
  const [pedido, setPedido] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('delta_ultimo_pedido');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.codigo === codigo || data.pedido?.codigo === codigo) {
          setPedido(data.pedido);
          setItems(data.items ?? []);
        }
      } catch {}
    }
  }, [codigo]);

  if (!pedido) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-amber-400 font-bold text-lg">Pedido no encontrado</p>
        <p className="text-slate-400 text-sm">Si recargaste la página, contacta a la tienda.</p>
        <Link href="/tienda" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm">Volver a la tienda</Link>
      </main>
    );
  }

  const abrirWhatsApp = () => {
    let mensaje = `✨ *CONFIRMACIÓN - DELTA* ✨\n\n🆔 *Pedido:* ${pedido.codigo}\n👤 *Cliente:* ${pedido.cliente_nombre}\n📍 *Dirección:* ${pedido.direccion}\n\n🛍️ *DETALLE:*\n`;
    items.forEach((it, i) => { mensaje += `${i + 1}. *${it.nombre}* x${it.cantidad} - ${formatCOP(it.subtotal)}\n`; });
    mensaje += `\n💰 *TOTAL:* ${formatCOP(pedido.total)}\n\nQuiero pagar este pedido.`;
    window.open(`https://api.whatsapp.com/send?phone=573142352488&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        <h1 className="text-2xl font-extrabold text-white">¡Pedido registrado!</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <p className="text-xs text-slate-500 uppercase">Tu código</p>
          <p className="text-3xl font-extrabold text-amber-400 font-mono">{pedido.codigo}</p>
        </div>
        <button onClick={abrirWhatsApp} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" /> Pagar por WhatsApp
        </button>
        <Link href="/tienda" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400">
          <ArrowLeft className="w-3 h-3" /> Seguir comprando
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmacionPage() {
  return <Suspense fallback={<div className="p-8 text-white">Cargando...</div>}><ConfirmacionContent /></Suspense>;
}