'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  ShoppingBag,
  ArrowLeft,
  Home,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Flame,
  Filter
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

interface CartItem extends Perfume {
  quantity: number;
}

export default function TiendaMenuPage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('TODOS');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Catálogo inicial de muestra si Supabase aún no contiene registros
  const defaultPerfumes: Perfume[] = [
    {
      id: '1',
      name: 'Elixir Noir',
      brand: 'DELTA Private Blend',
      family: 'Orientales & Madera',
      price: 240000,
      description: 'Extracto de perfume con notas intensas de ámbar gris, oud ahumado y vainilla negra.',
    },
    {
      id: '2',
      name: 'Bergamot Imperial',
      brand: 'DELTA Signature',
      family: 'Cítricos & Florales',
      price: 185000,
      description: 'Acordes frescos de bergamota de Calabria, jazmín silvestre y té blanco.',
    },
    {
      id: '3',
      name: 'Santale Reserve',
      brand: 'DELTA Reserve',
      family: 'Orientales & Madera',
      price: 210000,
      description: 'Madera de sándalo australiano con pimienta rosa, cardamomo y cuero fino.',
    },
    {
      id: '4',
      name: 'Rose Privée',
      brand: 'DELTA Exclusive',
      family: 'Cítricos & Florales',
      price: 195000,
      description: 'Cosecha de rosa de Grasse con destellos de violeta y almizcle blanco.',
    },
    {
      id: '5',
      name: 'Oud Supremacy',
      brand: 'DELTA Private Blend',
      family: 'Extractos Concentrados',
      price: 290000,
      description: 'Concentración al 35% de aceites esenciales puros, resina de incienso y especias.',
    },
    {
      id: '6',
      name: 'Aqua Di Delta',
      brand: 'DELTA Fresh',
      family: 'Cítricos & Florales',
      price: 160000,
      description: 'Notas marinas cristalinas, salvia salada y madera a la deriva.',
    },
  ];

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        setPerfumes(data as Perfume[]);
      } else {
        setPerfumes(defaultPerfumes);
      }
      setLoading(false);
    };

    fetchCatalog();
  }, [supabase]);

  // Manejo del Carrito
  const addToCart = (product: Perfume) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filtrado de productos
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
      {/* 1. Header Fijo con Navegación y Marca */}
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

          {/* Botón Carrito Flotante/Header */}
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

      {/* 2. Hero de Menú / Catálogo & Buscador */}
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

        {/* Buscador & Selector de Categorías (Tabs) */}
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

        {/* 3. Rejilla de Productos */}
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
                          onClick={() => removeFromCart(perfume.id)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">{inCart.quantity}</span>
                        <button
                          onClick={() => addToCart(perfume)}
                          className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(perfume)}
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

      {/* 4. Sidebar Modal de Pedido / Carrito en Línea */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl space-y-6">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Tu Pedido DELTA</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white text-xs">{item.name}</div>
                        <div className="text-[10px] text-amber-400 font-semibold">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1 text-amber-400 hover:text-amber-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Tu pedido está vacío. Agrega tus fragancias favoritas para continuar.
                </div>
              )}
            </div>

            {/* Resumen del Total y Finalizar */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${totalCartPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Envío Nacional</span>
                    <span className="text-emerald-400 font-semibold">GRATIS</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
                    <span>Total</span>
                    <span className="text-amber-400">${totalCartPrice.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href="/tienda/checkout"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Proceder al Pago
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}