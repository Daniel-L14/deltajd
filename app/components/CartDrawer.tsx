'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!cart || cart.length === 0) return;
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      alert('Por favor completa todos tus datos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: nombre.trim(),
          cliente_email: email.trim() || null,
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

      clearCart();
      setNombre(''); setEmail(''); setTelefono(''); setDireccion('');
      onClose();
      
      // 🔑 REDIRECCIÓN CORRECTA: Va a /tienda/pedido/ y NO al admin
      window.location.href = `/tienda/pedido/${data.codigo}`;
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message ?? 'No se pudo crear el pedido.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0B1120] border-l border-slate-800 text-slate-100 flex flex-col justify-between h-full p-6 shadow-2xl overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-extrabold text-white">Tu Pedido DELTA</h2>
            </div>
            <button onClick={onClose} type="button" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs">Tu carrito está vacío.</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {cart.map((item: any) => (
                <div key={item.id} className="bg-[#070C18] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-amber-400 font-semibold">${item.price.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B1120] p-1 border border-slate-800 rounded-lg">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-800 rounded text-slate-300"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-800 rounded text-slate-300"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>${total.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between text-emerald-400 font-semibold"><span>Envío Nacional</span><span>GRATIS</span></div>
              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total</span><span className="text-lg text-amber-400">${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3 text-xs pt-2">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Nombre Completo</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Daniel Latorre" className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Correo Electrónico (Opcional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Número de Teléfono</label>
                <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 3001234567" className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dirección de Entrega</label>
                <input type="text" required value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle / Carrera, Ciudad" className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg cursor-pointer mt-2 disabled:opacity-50">
                <ArrowRight className="w-4 h-4" />
                {loading ? 'Creando pedido...' : 'Confirmar y continuar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}