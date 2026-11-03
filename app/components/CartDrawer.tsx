'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, X, Trash2, Plus, Minus, Send } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const WHATSAPP_NUMBER = '573000000000'; // Tu número de WhatsApp con código de país

  const handleCheckoutWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !nombre || !telefono || !direccion) return;

    setLoading(true);

    let mensaje = `✨ *NUEVO PEDIDO - DELTA PERFUMERÍA* ✨\n\n`;
    mensaje += `👤 *Cliente:* ${nombre.trim()}\n`;
    mensaje += `📞 *Teléfono:* ${telefono.trim()}\n`;
    mensaje += `📍 *Dirección:* ${direccion.trim()}\n\n`;
    mensaje += `🛍️ *DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item, i) => {
      mensaje += `${i + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}\n`;
    });

    mensaje += `\n💰 *TOTAL A PAGAR:* $${total.toLocaleString()}\n\n`;
    mensaje += `Quedo atento a la confirmación del pago. ¡Gracias!`;

    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(mensaje)}`;

    // Abrir WhatsApp antes de esperar a la BD para evitar el bloqueo del popup
    const win = window.open(url, '_blank');

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
      console.error('Error al guardar pedido:', err);
    } finally {
      clearCart();
      setLoading(false);
      onClose();
      if (win) win.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col justify-between h-full p-6 shadow-2xl overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-extrabold text-white">Tu Carrito DELTA</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs">Tu carrito está vacío.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-amber-400 font-semibold">${item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-xl">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-800 rounded-md text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-800 rounded-md text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold">Total a Pagar:</span>
              <span className="text-xl font-extrabold text-amber-400">${total.toLocaleString()}</span>
            </div>

            <form onSubmit={handleCheckoutWhatsApp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tu Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Daniel Latorre"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Procesando...' : 'Enviar Pedido por WhatsApp'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}