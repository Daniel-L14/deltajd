'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/app/context/CartContext';
import { useMember } from '@/lib/useMember';
import { TIERS } from '@/lib/club';
import { formatCOP } from '@/lib/format';
import HeroBottle from '@/app/components/home/HeroBottle';
import MemberPanel from '@/app/components/home/MemberPanel';
import {
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Flame,
  MapPin,
  Truck,
  MessageCircle,
  LogOut,
  Crown,
  Heart,
  Check,
  Compass,
  Droplets,
  Gem,
  Plus,
  UserRound,
} from 'lucide-react';

interface Destacado {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
}

const NOTAS = [
  'Oud ahumado', 'Ámbar gris', 'Sándalo australiano', 'Rosa de Grasse', 'Bergamota de Calabria',
  'Vainilla negra', 'Incienso', 'Almizcle blanco', 'Cardamomo', 'Pimienta rosa', 'Jazmín silvestre',
];

const DESTACADOS_BASE: Destacado[] = [
  { id: '1', name: 'Elixir Noir', brand: 'DELTA Private Blend', family: 'Orientales & Madera', price: 240000, description: 'Extracto de perfume con notas intensas de ámbar gris, oud ahumado y vainilla negra.' },
  { id: '2', name: 'Bergamot Imperial', brand: 'DELTA Signature', family: 'Cítricos & Florales', price: 185000, description: 'Acordes frescos de bergamota de Calabria, jazmín silvestre y té blanco.' },
  { id: '5', name: 'Oud Supremacy', brand: 'DELTA Private Blend', family: 'Extractos Concentrados', price: 290000, description: 'Concentración al 35% de aceites esenciales puros, resina de incienso y especias.' },
];

const ARTE_FAMILIA: Record<string, string> = {
  'Orientales & Madera': 'from-amber-700/40 via-wine-900 to-slate-950',
  'Cítricos & Florales': 'from-rose-500/25 via-wine-800 to-slate-950',
  'Extractos Concentrados': 'from-gold-500/30 via-wine-900 to-slate-950',
};

const PASOS_RECOMENDADOR = ['Tu presupuesto', 'La familia olfativa que te atrae', 'La ocasión en la que lo usarás', 'El clima de tu ciudad'];

export default function HomePage() {
  const router = useRouter();
  const member = useMember();
  const { user, isAdmin, loading, firstName, points, progress, signOut, isFav, toggleFav } = member;
  const { addToCart } = useCart();

  const [year, setYear] = useState<number>(2026);
  const [showWelcome, setShowWelcome] = useState(false);
  const [destacados, setDestacados] = useState<Destacado[]>(DESTACADOS_BASE);
  const [recienAgregado, setRecienAgregado] = useState<string | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());

    const params = new URLSearchParams(window.location.search);
    if (params.get('bienvenida') === '1') {
      setShowWelcome(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    const supabase = createClient();
    supabase
      .from('productos')
      .select('id,name,brand,family,price,description')
      .order('name', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) setDestacados(data as Destacado[]);
      });
  }, []);

  useEffect(() => {
    if (showWelcome && user) {
      document.getElementById('mi-espacio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showWelcome, user]);

  const handleAdd = (p: Destacado) => {
    addToCart({ id: p.id, name: p.name, price: Number(p.price), quantity: 1 });
    setRecienAgregado(p.id);
    setTimeout(() => setRecienAgregado((cur) => (cur === p.id ? null : cur)), 1600);
  };

  const handleFav = (p: Destacado) => {
    const ok = toggleFav({ id: p.id, name: p.name, price: Number(p.price), family: p.family });
    if (!ok) router.push('/login?next=/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-gold-400/10 bg-slate-950/80 px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-2xl border border-gold-400/30 bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold tracking-[0.25em] text-white block leading-none">DELTA</span>
              <span className="text-[10px] text-gold-400/80 font-medium tracking-wider">Alta perfumería</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <Link href="/tienda" className="hover:text-gold-300 transition-colors">Catálogo</Link>
            <Link href="/test" className="hover:text-gold-300 transition-colors">Encontrar mi fragancia</Link>
            <a href={user ? '#mi-espacio' : '#club'} className="hover:text-gold-300 transition-colors">Club DELTA</a>
            <Link href="/nosotros" className="hover:text-gold-300 transition-colors">Nuestra historia</Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 font-bold text-gold-300 hover:text-white transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" /> Panel admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="h-9 w-28 rounded-xl bg-slate-900 animate-pulse" aria-hidden />
            ) : user ? (
              <>
                <a
                  href="#mi-espacio"
                  className="hidden sm:flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-500/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/20 transition-colors"
                  title="Ver mi espacio en el Club DELTA"
                >
                  <Crown className="w-3.5 h-3.5" />
                  {firstName} · {progress.current.name} · {points.toLocaleString('es-CO')} pts
                </a>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-red-800 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="btn-shine hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 text-xs font-bold text-slate-950 hover:bg-gold-400 transition-colors"
                >
                  <UserRound className="w-4 h-4" /> Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="grain relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-wine-800/50 blur-[120px]" />
            <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-gold-600/15 blur-[120px]" />
          </div>

          <div className="relative px-6 py-14 md:py-20 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div className="space-y-7 text-center lg:text-left">
              <div className="hero-in hero-in-1 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-500/10 px-3.5 py-1.5 text-xs font-semibold text-gold-300">
                <MapPin className="w-3.5 h-3.5" /> Boutique en Bogotá y envíos nacionales
              </div>

              <h1 className="hero-in hero-in-2 font-display text-5xl sm:text-6xl xl:text-7xl font-semibold text-white leading-[1.05] tracking-tight">
                El arte de la alta perfumería
              </h1>

              <p className="hero-in hero-in-3 text-slate-300 text-base max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Fragancias artesanales de autor y extractos altamente concentrados, elegidos para dejar una huella olfativa que nadie olvida.
              </p>

              <div className="hero-in hero-in-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                {user ? (
                  <a
                    href="#mi-espacio"
                    className="btn-shine w-full sm:w-auto px-7 py-4 rounded-2xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 transition-colors"
                  >
                    <Crown className="w-4 h-4" /> Ir a mi espacio
                  </a>
                ) : (
                  <Link
                    href="/tienda"
                    className="btn-shine w-full sm:w-auto px-7 py-4 rounded-2xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" /> Explorar el catálogo
                  </Link>
                )}
                <Link
                  href={user ? '/tienda' : '/test'}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl border border-gold-400/30 bg-slate-950/40 text-gold-200 hover:bg-gold-500/10 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {user ? (
                    <><ShoppingBag className="w-4 h-4" /> Explorar el catálogo</>
                  ) : (
                    <><Compass className="w-4 h-4" /> Encontrar mi fragancia</>
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full sm:w-auto px-5 py-4 rounded-2xl border border-gold-400/30 text-gold-300 hover:bg-gold-500/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Panel de control
                  </Link>
                )}
              </div>

              <ul className="hero-in hero-in-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-gold-400" /> Envíos en 24/48 h</li>
                <li className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-gold-400" /> Pedido confirmado por WhatsApp</li>
                <li className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-gold-400" /> Extractos concentrados</li>
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <HeroBottle className="w-full h-auto drop-shadow-[0_30px_60px_rgba(212,166,74,0.15)]" />

              <div className="glass absolute -bottom-2 left-0 sm:-left-6 w-60 rounded-2xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-gold-300">
                    <Flame className="w-3.5 h-3.5" /> Edición limitada
                  </span>
                </div>
                <div>
                  <div className="font-display text-lg font-semibold text-white leading-tight">Elixir Noir</div>
                  <div className="text-[11px] text-slate-400">Extracto de perfume 100 ml</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gold-300">{formatCOP(240000)}</span>
                  <Link
                    href="/tienda"
                    className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-gold-400 transition-colors"
                  >
                    Pedir ahora
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Cinta de notas olfativas ---------- */}
        <div
          aria-hidden
          className="marquee overflow-hidden border-y border-gold-400/10 bg-wine-950/60 py-4"
        >
          <div className="marquee-track flex items-center gap-10 text-sm text-gold-200/80 font-display italic">
            {[...NOTAS, ...NOTAS].map((nota, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {nota}
                <span className="block h-1.5 w-1.5 rotate-45 bg-gold-500/70" />
              </span>
            ))}
          </div>
        </div>

        {/* ---------- Club DELTA: miembro vs. invitado ---------- */}
        {loading ? (
          <div className="px-6 pt-10 max-w-6xl mx-auto w-full" aria-hidden>
            <div className="h-72 rounded-3xl bg-slate-900/60 animate-pulse" />
          </div>
        ) : user ? (
          <MemberPanel
            member={member}
            showWelcome={showWelcome}
            onDismissWelcome={() => setShowWelcome(false)}
          />
        ) : (
          <section id="club" className="scroll-mt-24 px-6 pt-16 max-w-6xl mx-auto w-full">
            <div className="gold-ring relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine-900 via-slate-950 to-slate-950 p-8 sm:p-12 grid gap-10 lg:grid-cols-2 items-center">
              <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />

              <div className="relative space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                  <Crown className="w-3.5 h-3.5" /> Club DELTA
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
                  Crea tu cuenta y haz que cada pedido cuente
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Es gratis. Al iniciar sesión acumulas puntos con cada compra, guardas tus fragancias favoritas y sigues tus pedidos desde un solo lugar.
                </p>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Favoritos guardados en tu cuenta</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Puntos por cada pedido</li>
                  <li className="flex items-center gap-2"><Gem className="w-4 h-4 text-gold-400" /> Beneficios que crecen con tu nivel</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/registro"
                    className="btn-shine rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-gold-400 transition-colors"
                  >
                    Crear mi cuenta
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-gold-400/50 transition-colors"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>

              <ol className="relative space-y-0">
                {TIERS.map((tier, i) => (
                  <li key={tier.id} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < TIERS.length - 1 && (
                      <span aria-hidden className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-gold-400/50 to-gold-400/5" />
                    )}
                    <span className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-400/60 bg-slate-950">
                      <span className="h-2 w-2 rounded-full bg-gold-400" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-xl font-semibold text-white">{tier.name}</span>
                        <span className="text-xs text-gold-400/80">
                          {tier.min === 0 ? 'Al crear tu cuenta' : `Desde ${tier.min.toLocaleString('es-CO')} puntos`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{tier.perks.join(' · ')}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* ---------- Fragancias destacadas ---------- */}
        <section className="px-6 pt-20 max-w-6xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">Fragancias destacadas</h2>
              <p className="text-sm text-slate-400 max-w-md">
                Una muestra de la casa: oud, flores de Grasse y extractos de alta concentración.
              </p>
            </div>
            <Link href="/tienda" className="text-sm font-semibold text-gold-300 hover:text-white transition-colors">
              Ver todo el catálogo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destacados.map((p) => {
              const fav = isFav(p.id);
              const agregado = recienAgregado === p.id;
              return (
                <article
                  key={p.id}
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 transition-colors hover:border-gold-400/40"
                >
                  <div className={`relative h-44 bg-gradient-to-br ${ARTE_FAMILIA[p.family] ?? 'from-gold-500/20 via-wine-900 to-slate-950'} flex items-center justify-center overflow-hidden`}>
                    <span aria-hidden className="font-display text-[9rem] leading-none italic text-gold-300/15 select-none transition-transform duration-500 group-hover:scale-110">
                      {p.name.charAt(0)}
                    </span>
                    <span className="absolute left-4 top-4 rounded-full border border-gold-400/25 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold text-gold-300 backdrop-blur">
                      {p.family}
                    </span>
                    <button
                      onClick={() => handleFav(p)}
                      aria-pressed={fav}
                      aria-label={fav ? `Quitar ${p.name} de favoritos` : `Guardar ${p.name} en favoritos`}
                      title={user ? (fav ? 'Quitar de favoritos' : 'Guardar en favoritos') : 'Inicia sesión para guardar favoritos'}
                      className="absolute right-4 top-4 rounded-full border border-slate-700/60 bg-slate-950/60 p-2 backdrop-blur transition-colors hover:border-rose-400/60"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${fav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="space-y-1.5">
                      <h3 className="font-display text-xl font-semibold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.brand}</p>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <span className="text-lg font-bold text-gold-300">{formatCOP(Number(p.price))}</span>
                      <button
                        onClick={() => handleAdd(p)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                          agregado
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-gold-500 text-slate-950 hover:bg-gold-400'
                        }`}
                      >
                        {agregado ? (<><Check className="w-4 h-4" /> Agregado</>) : (<><Plus className="w-4 h-4" /> Agregar</>)}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------- Recomendador ---------- */}
        <section className="px-6 pt-20 max-w-6xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-3xl border border-gold-400/15 bg-gradient-to-r from-wine-900 via-wine-950 to-slate-950 p-8 sm:p-12 grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
                ¿No sabes cuál elegir?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                Responde cuatro preguntas rápidas y te mostramos las fragancias que mejor encajan contigo.
              </p>
              <Link
                href="/test"
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-gold-400 transition-colors"
              >
                <Compass className="w-4 h-4" /> Encontrar mi fragancia
              </Link>
            </div>

            <ol className="space-y-3">
              {PASOS_RECOMENDADOR.map((paso, i) => (
                <li key={paso} className="glass flex items-center gap-4 rounded-2xl px-5 py-3.5">
                  <span className="font-display text-2xl font-semibold text-gold-gradient w-6 text-center">{i + 1}</span>
                  <span className="text-sm text-slate-200">{paso}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Por qué DELTA ---------- */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-10 max-w-xl">
            Perfumería de autor, con atención de boutique
          </h2>
          <div className="grid gap-10 md:grid-cols-3 md:divide-x md:divide-gold-400/10">
            {[
              { icon: Droplets, title: 'Extractos concentrados', text: 'Aceites esenciales puros en altas concentraciones, para que el aroma dure y evolucione en la piel.' },
              { icon: Gem, title: 'Boutique en Bogotá', text: 'Una selección pequeña y cuidada, con asesoría real de quienes conocen cada fragancia.' },
              { icon: Truck, title: 'Del pedido a tu puerta', text: 'Arma tu pedido en línea, confírmalo por WhatsApp y recíbelo en todo el país en 24/48 horas.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-3 md:px-8 first:md:pl-0 last:md:pr-0">
                <Icon className="w-6 h-6 text-gold-400" />
                <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-slate-900/60 border-t border-gold-400/10 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400 pb-12 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span className="font-display font-semibold text-white text-sm tracking-[0.25em]">DELTA</span>
            </div>
            <p className="leading-relaxed">
              El arte de crear esencias duraderas. Calidad artesanal para llevar el aroma perfecto a tu puerta.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li><Link href="/tienda" className="hover:text-gold-300 transition-colors">Catálogo</Link></li>
              <li><Link href="/test" className="hover:text-gold-300 transition-colors">Encontrar mi fragancia</Link></li>
              <li><Link href="/nosotros" className="hover:text-gold-300 transition-colors">Nuestra historia</Link></li>
              {user && (
                <li><Link href="/cuenta/pedidos" className="hover:text-gold-300 transition-colors">Mis pedidos</Link></li>
              )}
              {isAdmin && (
                <li><Link href="/admin" className="font-bold text-gold-300 hover:underline">Panel de control</Link></li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Ubicación y envíos</h4>
            <ul className="space-y-2">
              <li>Bogotá, Colombia</li>
              <li>Despachos a nivel nacional en 24/48 h.</li>
              <li>Atención al cliente en línea.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Cómo pedir</h4>
            <p className="leading-relaxed">
              Elige tus fragancias, completa tus datos y confirma tu pedido por WhatsApp con nuestro equipo.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {year} DELTA Perfumería. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacidad</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Términos del servicio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}