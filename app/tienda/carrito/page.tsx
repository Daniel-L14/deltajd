'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, Trash2, Plus, Minus, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const WHATSAPP_NUMBER = '573142352488'; 

  const handleCheckoutWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      alert('Por favor completa Nombre, Teléfono y Dirección.');
      return;
    }

    setLoading(true);

    // 1. Armar el mensaje para WhatsApp
    let mensaje = `✨ *NUEVO PEDIDO - DELTA PERFUMERÍA* ✨\n\n`;
    mensaje += `👤 *Cliente:* ${nombre.trim()}\n`;
    mensaje += `📞 *Teléfono:* ${telefono.trim()}\n`;
    mensaje += `📍 *Dirección:* ${direccion.trim()}\n\n`;
    mensaje += `🛍️ *DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item, i) => {
      const subtotal = item.price * item.quantity;
      mensaje += `${i + 1}. *${item.name}* x${item.quantity} - $${subtotal.toLocaleString()}\n`;
    });

    mensaje += `\n💰 *TOTAL A PAGAR:* $${total.toLocaleString()}\n\n`;
    mensaje += `Quedo atento a la confirmación del pago. ¡Gracias!`;

    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(mensaje)}`;

    // 2. Abrir WhatsApp (Redirección directa)
    window.location.href = url;

    // 3. Guardar orden en Supabase
    try {
      await supabase.from('pedidos').insert([
        {
          cliente_nombre: nombre.trim(),
          cliente_telefono: telefono.trim(),
          direccion: direccion.trim(),
          items: cart,
          total: total,
          estado: 'Pendiente'
        }
      ]);
    } catch (err) {
      console.error('Error guardando pedido en base de datos:', err);
    } finally {
      clearCart();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Listado de productos */}
            <div className="space-y-4">
              <h2 className="font-bold text-slate-300 text-sm">Resumen de tu compra</h2>
              
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <p className="text-xs text-amber-400 font-semibold">${item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-800 rounded-md text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-800 rounded-md text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400 text-sm font-semibold">Total estimado:</span>
                <span className="text-xl font-extrabold text-amber-400">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Columna Derecha: Formulario de datos */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h2 className="font-bold text-white text-base border-b border-slate-800 pb-2">Datos para la entrega</h2>
              
              <form onSubmit={handleCheckoutWhatsApp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Daniel Latorre"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Número de Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3001234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Dirección de Entrega</label>
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle / Carrera, Ciudad"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Redirigiendo a WhatsApp...' : 'Enviar Pedido por WhatsApp'}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}