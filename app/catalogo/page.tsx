'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ShoppingBag, Filter } from 'lucide-react';

interface PerfumeItem {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
  stock: number;
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<PerfumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState('Todos');

  const supabase = createClient();

  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data as PerfumeItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();

    // Sincronización en tiempo real: si cambias algo en el admin, se actualiza la vista del cliente
    const channel = supabase
      .channel('productos-catalogo-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchProductos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const familias = ['Todos', 'Orientales & Madera', 'Extractos Concentrados', 'Cítricos & Florales'];

  const filteredProducts = selectedFamily === 'Todos'
    ? products
    : products.filter(p => p.family === selectedFamily);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6 max-w-7xl mx-auto space-y-10">
      {/* Encabezado */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Colección Exclusiva
        </div>
        <h1 className="text-4xl font-extrabold text-white">Catálogo de Fragancias</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Explora nuestras creaciones olfativas de alta perfumería elaboradas con los ingredientes más finos.
        </p>
      </div>

      {/* Filtros por Familia */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {familias.map((fam) => (
          <button
            key={fam}
            onClick={() => setSelectedFamily(fam)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedFamily === fam
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {fam}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm font-medium">
          Cargando catálogo...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-sm">No hay fragancias disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    {product.family}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{product.brand}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{product.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Precio</span>
                  <span className="text-lg font-extrabold text-amber-400">
                    ${Number(product.price).toLocaleString()}
                  </span>
                </div>
                <button
                  disabled={product.stock <= 0}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    product.stock > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}