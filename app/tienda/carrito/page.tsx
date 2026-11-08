'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [paso, setPaso] = useState<'carrito' | 'datos'>('carrito');
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(''); // NUEVO CAMPO
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.length === 0) return;
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      alert('Por favor completa Nombre, Teléfono y Dirección.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: nombre.trim(),
          cliente_email: email.trim() || null, // ENVIAMOS EL EMAIL
          cliente_telefono: telefono.trim(),
          direccion: direccion.trim(),
          items: cart.map((c: any) => ({
            producto_id: c.id ?? null,
            nombre: c.name,
            precio: Number(c.price),
            cantidad: Number(c.quantity),
          })),
          estado: 'nuevo',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear el pedido');

      // Guardar para la página de confirmación
      const pedidoParaConfirmar = {
        codigo: data.codigo,
        pedido: data.pedido,
        items: (data.pedido.items ?? []).map((it: any, i: number) => ({
          id: String(i),
          nombre: it.nombre,
          precio: it.precio,
          cantidad: it.cantidad,
          subtotal: it.precio * it.cantidad,
        })),
      };
      localStorage.setItem('delta_ultimo_pedido', JSON.stringify(pedidoParaConfirmar));

      try {
        const historial = JSON.parse(localStorage.getItem('delta_pedidos') ?? '[]');
        historial.push({ codigo: data.codigo, total: data.total, fecha: new Date().toISOString() });
        localStorage.setItem('delta_pedidos', JSON.stringify(historial));
      } catch {}

      clearCart();
      window.location.href = `/tienda/pedido/${data.codigo}`;
    } catch (err: any) {
      console.error('Error creando pedido:', err);
      alert(err.message ?? 'No se pudo crear el pedido. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/tienda" className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Volver a la tienda
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" /> Mi Carrito
          </h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 space-y-4">
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-600" />
            <p className="text-slate-400 text-sm">No tienes productos en el carrito aún.</p>
            <Link href="/tienda" className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto">
            
            {/* PASO 1: RESUMEN */}
            {paso === 'carrito' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">1. Revisa tu pedido</h2>
                
                <div className="space-y-3">
                  {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <p className="text-xs text-amber-400 font-semibold">${Number(item.price).toLocaleString('es-CO')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-lg">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-800 rounded text-slate-300">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-800 rounded text-slate-300">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Total:</span>
                  <span className="text-2xl font-extrabold text-amber-400">${Number(total).toLocaleString('es-CO')}</span>
                </div>

                <button
                  onClick={() => setPaso('datos')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  Continuar con los datos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PASO 2: DATOS DEL CLIENTE */}
            {paso === 'datos' && (
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <button type="button" onClick={() => setPaso('carrito')} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-white">2. Datos de entrega</h2>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Daniel Latorre"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Número de Teléfono</label>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="3001234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Dirección de Entrega</label>
                    <input
                      type="text"
                      required
                      autoComplete="street-address"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle / Carrera, Ciudad"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center mt-2">
                  <span className="text-slate-400 font-semibold">Total a pagar:</span>
                  <span className="text-2xl font-extrabold text-amber-400">${Number(total).toLocaleString('es-CO')}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/20"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Creando pedido...' : 'Confirmar y Pagar'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}