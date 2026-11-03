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
  Search
} from 'lucide-react';

interface PerfumeItem {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
  stock: number;
}

export default function AdminClientPage() {
  const [products, setProducts] = useState<PerfumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Formulario para crear perfume
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('DELTA Private Blend');
  const [family, setFamily] = useState('Orientales & Madera');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');

  const supabase = createClient();

  const defaultCatalog: PerfumeItem[] = [
    {
      id: '1',
      name: 'Elixir Noir',
      brand: 'DELTA Private Blend',
      family: 'Orientales & Madera',
      price: 240000,
      description: 'Extracto de perfume con notas intensas de ámbar gris, oud ahumado y vainilla negra.',
      stock: 12
    },
    {
      id: '2',
      name: 'Bergamot Imperial',
      brand: 'DELTA Signature',
      family: 'Cítricos & Florales',
      price: 185000,
      description: 'Acordes frescos de bergamota de Calabria, jazmín silvestre y té blanco.',
      stock: 8
    },
    {
      id: '3',
      name: 'Oud Supremacy',
      brand: 'DELTA Private Blend',
      family: 'Extractos Concentrados',
      price: 290000,
      description: 'Concentración al 35% de aceites esenciales puros, resina de incienso y especias.',
      stock: 5
    }
  ];

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
      description
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Panel de Control General
          </div>
          <h1 className="text-2xl font-extrabold text-white">Gestión de Inventario DELTA</h1>
          <p className="text-xs text-slate-400">Controla precios, stock y nuevos lanzamientos de perfumería.</p>
        </div>

        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Sincronizar Datos
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Total Fragancias en Catálogo</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{products.length}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Valor de Inventario Estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">${totalValue.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
            <span>Familias Olfativas</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">3 Categorías</div>
        </div>
      </div>

      {/* Formulario y Tabla */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 lg:col-span-1 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Agregar Nuevo Perfume
            </h2>
            <p className="text-xs text-slate-400">Registra un nuevo producto en el catálogo en línea.</p>
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
              <label className="block text-slate-300 font-semibold mb-1">Descripción & Notas</label>
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

        {/* Tabla de Productos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 lg:col-span-2 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Catálogo de Productos Activos</h2>
              <p className="text-xs text-slate-400">Total: {filteredProducts.length} productos mostrados.</p>
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

          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{product.name}</span>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      {product.family}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-amber-400">${Number(product.price).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Stock: {product.stock || 10} unidades</div>
                  </div>

                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 bg-slate-900 hover:bg-red-950/60 hover:border-red-800 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl transition-colors"
                    title="Eliminar Producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}