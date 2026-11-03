'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
// ⚠️ Ajusta esta ruta según dónde esté tu CartDrawer.tsx
import CartDrawer from '@/app/components/CartDrawer';
import {
  Sparkles,
  Search,
  ShoppingBag,
  ArrowLeft,
  Home,
  Plus,
  Minus,
  Flame,
} from 'lucide-react';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
  stock?: number;
}

export default function TiendaMenuPage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('TODOS');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🔑 Usamos el contexto global en lugar de useState local
  const { cart, addToCart, updateQuantity } = useCart();

  const supabase = createClient();
  const router = useRouter();

  const defaultPerfumes: Perfume[] = [
    { id: '1', name: 'Elixir Noir', brand: 'DELTA Private Blend', family: 'Orientales & Madera', price: 240000, description: 'Extracto de perfume con notas intensas de ámbar gris, oud ahumado y vainilla negra.' },
    { id: '2', name: 'Bergamot Imperial', brand: 'DELTA Signature', family: 'Cítricos & Florales', price: 185000, description: 'Acordes frescos de bergamota de Calabria, jazmín silvestre y té blanco.' },
    { id: '3', name: 'Santale Reserve', brand: 'DELTA Reserve', family: 'Orientales & Madera', price: 210000, description: 'Madera de sándalo australiano con pimienta rosa, cardamomo y cuero fino.' },
    { id: '4', name: 'Rose Privée', brand: 'DELTA Exclusive', family: 'Cítricos & Florales', price: 195000, description: 'Cosecha de rosa de Grasse con destellos de violeta y almizcle blanco.' },
    { id: '5', name: 'Oud Supremacy', brand: 'DELTA Private Blend', family: 'Extractos Concentrados', price: 290000, description: 'Concentración al 35% de aceites esenciales puros, resina de incienso y especias.' },
    { id: '6', name: 'Aqua Di Delta', brand: 'DELTA Fresh', family: 'Cítricos & Florales', price: 160000, description: 'Notas marinas cristalinas, salvia salada y madera a la deriva.' },
  ];

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      const { data } = await supabase.from('productos').select('*').order('name', { ascending: true });
      setPerfumes(data && data.length > 0 ? (data as Perfume[]) : defaultPerfumes);
      setLoading(false);
    };
    fetchCatalog();
  }, [supabase]);

  // 🔑 Envoltorios para adaptar Perfume -> CartItem
  const handleAdd = (perfume: Perfume) => {
    addToCart({
      id: perfume.id,
      name: perfume.name,
      price: perfume.price,
      quantity: 1,
    });
  };

  const handleDecrement = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item) updateQuantity(id, item.quantity - 1);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const families = ['TODOS', 'Extractos Concentrados', 'Orientales & Madera', 'Cítricos & Florales'];

  const filteredPerfumes = perfumes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = selectedFamily === 'TODOS' || p.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" /> Volver
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Home className="w-4 h-4 text-slate-400" /> Inicio
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-widest text-white hidden sm:inline">DELTA</span>
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-amber-500/10"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mi Pedido</span>
            {totalCartCount > 0 && (
              <span className="ml-1 bg-slate-950 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}
      <div className="px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4" /> Menú Digital Exclusivo
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Catálogo de Perfumería <span className="text-amber-400">DELTA</span>
          </h1>
          <p className="text-xs text-slate-400">
            Selecciona tus fragancias favoritas y realiza tu pedido directo en línea.
          </p>
        </div>

        {/* BUSCADOR + TABS */}
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por aroma, notas o colección..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {families.map((family) => (
              <button
                key={family}
                onClick={() => setSelectedFamily(family)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFamily === family
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {family}
              </button>
            ))}
          </div>
        </div>

        {/* GRID PRODUCTOS */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs animate-pulse">
            Cargando catálogo en línea...
          </div>
        ) : filteredPerfumes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredPerfumes.map((perfume) => {
              const inCart = cart.find((item) => item.id === perfume.id);

              return (
                <div
                  key={perfume.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all group shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {perfume.family}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{perfume.brand}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {perfume.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {perfume.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Precio Unitario</div>
                      <div className="text-lg font-extrabold text-amber-400">
                        ${Number(perfume.price).toLocaleString()}
                      </div>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                        <button
                          onClick={() => handleDecrement(perfume.id)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">{inCart.quantity}</span>
                        <button
                          onClick={() => handleAdd(perfume)}
                          className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(perfume)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Agregar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No se encontraron fragancias en esta categoría.
          </div>
        )}
      </div>

      {/* 🔑 AQUÍ VA EL DRAWER QUE YA TIENE EL FORMULARIO Y WHATSAPP */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}