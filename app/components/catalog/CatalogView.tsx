'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, ShoppingCart, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  type: 'ORIGINAL' | '1.1';
  family: string;
  price: number;
  description: string;
  budget_category: string;
  is_active: boolean;
}

export default function CatalogView() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('perfumes')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) {
        setPerfumes(data as Perfume[]);
      }
      setLoading(false);
    };

    fetchCatalog();
  }, [supabase]);

  const filteredPerfumes = perfumes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.family.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Botones de Navegación de Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" /> Retroceder
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <Home className="w-4 h-4 text-slate-400" /> Ir al Inicio
        </Link>
      </div>

      {/* Encabezado y Barra de Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Catálogo de Fragancias
          </h1>
          <p className="text-xs text-slate-400">
            Explora fragancias originales y de inspiración 1.1 con disponibilidad inmediata.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca o nombre..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="1.1">Versiones 1.1</option>
            <option value="ORIGINAL">Originales</option>
          </select>
        </div>
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Cargando catálogo...</div>
      ) : filteredPerfumes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPerfumes.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {p.family}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      p.type === 'ORIGINAL'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {p.type}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">{p.brand}</p>
                <p className="text-xs text-slate-400 line-clamp-2 pt-1">{p.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">Precio</div>
                  <div className="text-base font-extrabold text-amber-400">
                    ${Number(p.price).toLocaleString()}
                  </div>
                </div>
                <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 text-xs">
                  <ShoppingCart className="w-4 h-4" /> Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-xs">
          No se encontraron perfumes que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}