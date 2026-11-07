'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { ShoppingBag, X, Trash2, Plus, Minus, Send, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CatalogView() {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [paso, setPaso] = useState<'carrito' | 'datos'>('carrito');

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmarPedidoWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!cart || cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      alert('Por favor completa Nombre, Teléfono y Dirección.');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear el pedido en el servidor
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: nombre.trim(),
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

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al crear el pedido');
      }

      // 2. Guardar pedido completo para la página de confirmación
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

      // 3. Historial del cliente
      try {
        const historial = JSON.parse(localStorage.getItem('delta_pedidos') ?? '[]');
        historial.push({
          codigo: data.codigo,
          total: data.total,
          fecha: new Date().toISOString(),
        });
        localStorage.setItem('delta_pedidos', JSON.stringify(historial));
      } catch {}

      // 4. Limpiar y redirigir a confirmación
      clearCart();
      setNombre('');
      setTelefono('');
      setDireccion('');
      setPaso('carrito');
      setIsDrawerOpen(false);
      window.location.href = `/tienda/pedido/${data.codigo}`;
    } catch (err: any) {
      console.error('Error guardando pedido:', err);
      alert(err.message ?? 'No se pudo crear el pedido. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 relative">
      <div className="p-4 flex justify-between items-center max-w-7xl mx-auto border-b border-slate-800/60">
        <h1 className="text-xl font-black tracking-widest text-white">DELTA PERFUMERÍA</h1>
        <button
          onClick={() => {
            setPaso('carrito');
            setIsDrawerOpen(true);
          }}
          type="button"
          className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-400 transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Mi Pedido ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
        </button>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#0B1120] border-l border-slate-800 text-slate-100 flex flex-col justify-between h-full p-6 shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  {paso === 'datos' && (
                    <button
                      type="button"
                      onClick={() => setPaso('carrito')}
                      className="p-1 text-slate-400 hover:text-white mr-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-extrabold text-white">
                    {paso === 'carrito' ? 'Tu Pedido DELTA' : 'Datos del Cliente'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paso === 'carrito' && (
                <>
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
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {paso === 'datos' && (
                <form id="form-pedidos" onSubmit={handleConfirmarPedidoWhatsApp} className="space-y-4 py-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Daniel Latorre"
                      className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
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
                      placeholder="Ej. 3001234567"
                      className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
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
                      className="w-full bg-[#070C18] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Envío Nacional</span>
                    <span>GRATIS</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Total</span>
                    <span className="text-lg text-amber-400">${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {paso === 'carrito' && (
                  <button
                    type="button"
                    onClick={() => setPaso('datos')}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg cursor-pointer"
                  >
                    Continuar con los datos
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {paso === 'datos' && (
                  <button
                    type="submit"
                    form="form-pedidos"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Creando pedido...' : 'Confirmar y continuar'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}