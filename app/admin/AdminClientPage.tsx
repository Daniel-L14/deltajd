'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Plus,
  Trash2,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  LayoutDashboard,
  ShoppingBag,
  Edit3,
  Check,
  TrendingUp,
  Clock,
  User,
  MapPin,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface PerfumeItem {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
  stock: number;
  featured?: boolean;
}

interface OrderItem {
  id: string;
  customer: string;
  email: string;
  items: string;
  total: number;
  status: 'Completado' | 'Pendiente' | 'Enviado';
  date: string;
}

export default function AdminClientPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'catalog'>('dashboard');
  const [products, setProducts] = useState<PerfumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Estado para la edición en línea del catálogo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PerfumeItem>>({});

  // Formulario de creación de producto
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('DELTA Private Blend');
  const [family, setFamily] = useState('Orientales & Madera');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');

  const supabase = createClient();

  // Catálogo Base
  const defaultCatalog: PerfumeItem[] = [
    {
      id: '1',
      name: 'Elixir Noir',
      brand: 'DELTA Private Blend',
      family: 'Orientales & Madera',
      price: 240000,
      description: 'Extracto de perfume con notas intensas de ámbar gris, oud ahumado y vainilla negra.',
      stock: 12,
      featured: true
    },
    {
      id: '2',
      name: 'Bergamot Imperial',
      brand: 'DELTA Signature',
      family: 'Cítricos & Florales',
      price: 185000,
      description: 'Acordes frescos de bergamota de Calabria, jazmín silvestre y té blanco.',
      stock: 8,
      featured: false
    },
    {
      id: '3',
      name: 'Oud Supremacy',
      brand: 'DELTA Private Blend',
      family: 'Extractos Concentrados',
      price: 290000,
      description: 'Concentración al 35% de aceites esenciales puros, resina de incienso y especias.',
      stock: 5,
      featured: true
    }
  ];

  // Pedidos de prueba
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: 'ORD-2026-001',
      customer: 'Carlos Mendoza',
      email: 'carlos.m@example.com',
      items: '1x Elixir Noir (100ml)',
      total: 240000,
      status: 'Enviado',
      date: '2026-11-02'
    },
    {
      id: 'ORD-2026-002',
      customer: 'Sofía Ramírez',
      email: 'sofia.ramirez@example.com',
      items: '2x Bergamot Imperial',
      total: 370000,
      status: 'Pendiente',
      date: '2026-11-02'
    },
    {
      id: 'ORD-2026-003',
      customer: 'Andrés Gómez',
      email: 'andres.g@example.com',
      items: '1x Oud Supremacy',
      total: 290000,
      status: 'Completado',
      date: '2026-11-01'
    }
  ]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setProducts(data as PerfumeItem[]);
    } else {
      setProducts(defaultCatalog);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [supabase]);

  // Edición en línea
  const handleStartEdit = (product: PerfumeItem) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.from('productos').update(editForm).eq('id', id);

    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, ...editForm } as PerfumeItem : p));
    } else {
      setProducts(products.map(p => p.id === id ? { ...p, ...editForm } as PerfumeItem : p));
    }
    setEditingId(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newPerfume = {
      id: Date.now().toString(),
      name,
      brand,
      family,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      description,
      featured: false
    };

    const { error } = await supabase.from('productos').insert([newPerfume]);

    if (!error) {
      fetchProducts();
    } else {
      setProducts([newPerfume, ...products]);
    }

    setName('');
    setPrice('');
    setDescription('');
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('productos').delete().eq('id', id);
    setProducts(products.filter(p => p.id !== id));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.family.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 1)), 0);
  const totalOrdersValue = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado y Selector de Pestañas */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Centro de Administración DELTA
          </div>
          <h1 className="text-2xl font-extrabold text-white">Panel de Control & Catálogo</h1>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="flex bg-slate-950 p-1.5 border border-slate-800 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Editar Catálogo
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DASHBOARD GENERAL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
                <span>Ventas Totales</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">${totalOrdersValue.toLocaleString()}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
                <span>Total Fragancias</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{products.length}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
                <span>Valor en Inventario</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400">${totalValue.toLocaleString()}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
                <span>Pedidos Activos</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{orders.length}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Últimas Órdenes Registradas
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Ver todas las órdenes →
              </button>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 2).map((order) => (
                <div key={order.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{order.customer}</div>
                    <div className="text-xs text-slate-400">{order.items}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">${order.total.toLocaleString()}</div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: PEDIDOS DE LA TIENDA */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Listado de Pedidos Recibidos</h2>
              <p className="text-xs text-slate-400">Gestiona los despachos y estados de compras de tus clientes.</p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">{order.id}</span>
                    <span className="text-xs text-slate-400">{order.date}</span>
                  </div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {order.customer} ({order.email})
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{order.items}</div>
                </div>

                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-amber-400">${order.total.toLocaleString()}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      order.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      order.status === 'Enviado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: EDITAR CATÁLOGO & PRECIOS (LO QUE VE EL CLIENTE) */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Formulario Crear Fragancia */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 lg:col-span-1 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Crear Producto Nuevo
              </h2>
              <p className="text-xs text-slate-400">Se mostrará en la tienda inmediatamente.</p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Perfume</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Amber Wood Elixir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio ($)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="220000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Familia Olfativa</label>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Orientales & Madera">Orientales & Madera</option>
                  <option value="Extractos Concentrados">Extractos Concentrados</option>
                  <option value="Cítricos & Florales">Cítricos & Florales</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción que verá el cliente</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notas de salida de bergamota, corazón de rosa y fondo de sándalo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Publicar en el Catálogo
              </button>
            </form>
          </div>

          {/* Edición Directa del Catálogo Activo */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 lg:col-span-2 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" /> Edición Directa del Catálogo
                </h2>
                <p className="text-xs text-slate-400">Modifica precios, descripciones y títulos en tiempo real.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar fragancia..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 transition-all"
                >
                  {editingId === product.id ? (
                    /* MODO EDICIÓN */
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Precio ($)</label>
                          <input
                            type="number"
                            value={editForm.price || ''}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-400 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Descripción</label>
                        <textarea
                          rows={2}
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(product.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar Cambios
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* MODO VISUALIZACIÓN & BOTONES */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{product.name}</span>
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {product.family}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{product.description}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                        <div className="text-right">
                          <div className="text-base font-extrabold text-amber-400">${Number(product.price).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Stock: {product.stock || 10} unidades</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl transition-colors"
                            title="Editar Perfume y Precio"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-slate-900 hover:bg-red-950/60 hover:border-red-800 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl transition-colors"
                            title="Eliminar Producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}