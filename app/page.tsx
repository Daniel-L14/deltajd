"use client";

import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { useEffect, useState, useSyncExternalStore } from "react";
import Navbar from "@/app/components/layout/Navbar";
import { api } from "@/lib/client-api";
import type { Product } from "@/lib/products";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useMember } from "@/lib/useMember";
import { TIERS } from "@/lib/club";
import { formatCOP } from "@/lib/format";
import Image from "next/image";
import MemberPanel from "@/app/components/home/MemberPanel";
import {
  Sparkles,
  ShoppingBag,
  ShieldCheck,
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
} from "lucide-react";

interface Destacado {
  stock: number;
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  description: string;
  image_url: string | null;
}

const PASOS_RECOMENDADOR = [
  "Tu presupuesto",
  "La familia olfativa que te atrae",
  "La ocasión en la que lo usarás",
  "El clima de tu ciudad",
];

export default function HomePage() {
  const router = useRouter();
  const member = useMember();
  const {
    user,
    isAdmin,
    loading,
    firstName,
    points,
    progress,
    signOut,
    isFav,
    toggleFav,
  } = member;
  const { addToCart, cart, ready } = useCart();

  const year = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => 2026,
  );
  const [dismissed, setDismissed] = useState(false);
  const fromLogin = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("bienvenida") === "1",
    () => false,
  );
  const showWelcome = fromLogin && !dismissed;
  const setShowWelcome = (v: boolean) => setDismissed(!v);
  const [destacados, setDestacados] = useState<Destacado[]>([]);
  const [recienAgregado, setRecienAgregado] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api<{ products: Product[] }>("/api/productos")
      .then((d) => {
        if (live) setDestacados(d.products.slice(0, 3));
      })
      .catch(() => {
        /* Sin catálogo disponible no se ofrecen productos ficticios. */
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (showWelcome && user) {
      document
        .getElementById("mi-espacio")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showWelcome, user]);

  const handleAdd = (p: Destacado) => {
    addToCart({ id: p.id, name: p.name, price: Number(p.price), quantity: 1, image: p.image_url ?? undefined });
    setRecienAgregado(p.id);
    setTimeout(
      () => setRecienAgregado((cur) => (cur === p.id ? null : cur)),
      1600,
    );
  };

  const handleFav = async (p: Destacado) => {
    const ok = await toggleFav({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      family: p.family,
    });
    if (!ok) router.push("/login?next=/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="sticky top-0 z-50 md:hidden">
        <Navbar account={user && (
          <button type="button" onClick={signOut} className="rounded-md px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-gold-400/10">
            Cerrar sesión
          </button>
        )} />
      </div>
      {/* ---------- Header ---------- */}
      <header className="delta-nav sticky top-0 z-50 hidden px-6 py-4 md:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-2xl border border-gold-400/30 bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="delta-wordmark block">
                DELTA
              </span>
              <span className="text-[10px] text-gold-400/80 font-medium tracking-wider">
                Alta perfumería
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <Link
              href="/tienda"
              className="hover:text-gold-300 transition-colors"
            >
              Catálogo
            </Link>
            <Link
              href="/test"
              className="hover:text-gold-300 transition-colors"
            >
              Encontrar mi fragancia
            </Link>
            <a
              href={user ? "#mi-espacio" : "#club"}
              className="hover:text-gold-300 transition-colors"
            >
              Club DELTA
            </a>
            <Link
              href="/nosotros"
              className="hover:text-gold-300 transition-colors"
            >
              Nuestra historia
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 font-bold text-gold-300 hover:text-white transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Panel admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/tienda/carrito" className="delta-secondary" aria-label="Ver carrito">
              <ShoppingBag aria-hidden className="size-4" />
              {!!cart.length && <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </Link>
            {loading ? (
              <div
                className="h-9 w-28 rounded-xl bg-slate-900 animate-pulse"
                aria-hidden
              />
            ) : user ? (
              <>
                <a
                  href="#mi-espacio"
                  className="hidden sm:flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-500/10 px-3 py-2 text-xs font-semibold text-gold-300 hover:bg-gold-500/20 transition-colors"
                  title="Ver mi espacio en el Club DELTA"
                >
                  <Crown className="w-3.5 h-3.5" />
                  {firstName} · {progress.current.name} ·{" "}
                  {points.toLocaleString("es-CO")} pts
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
        <section className="delta-campaign">
          <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-5 py-9 sm:px-8 sm:py-12 lg:grid-cols-[.88fr_1.12fr] lg:gap-14 lg:px-14 lg:py-16">
            <div className="max-w-2xl space-y-6 lg:py-5">
              <p className="delta-eyebrow flex items-center gap-2">
                <MapPin aria-hidden className="size-4" /> Perfumería en Bogotá
              </p>
              <h1 className="font-display text-[clamp(3rem,7vw,7rem)] leading-[.92] tracking-[-.065em] text-slate-100">
                El arte de la <em className="text-gold-300">alta perfumería</em>
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-300 sm:text-lg">
                Descubre fragancias para el día a día, ocasiones especiales y
                cada forma de llevar tu aroma.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/tienda" className="delta-button min-h-12">
                  <ShoppingBag aria-hidden className="size-4" /> Explorar el catálogo
                </Link>
                <Link href="/test" className="delta-secondary min-h-12">
                  <Compass aria-hidden className="size-4" /> Encontrar mi fragancia
                </Link>
                {user && <a href="#mi-espacio" className="delta-secondary min-h-12">Mi espacio</a>}
                {isAdmin && <Link href="/admin" className="delta-secondary min-h-12">Panel de control</Link>}
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-gold-400/20 pt-5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Truck aria-hidden className="size-4 text-gold-400" /> Entrega coordinada</li>
                <li className="flex items-center gap-2"><MessageCircle aria-hidden className="size-4 text-gold-400" /> Atención por WhatsApp</li>
              </ul>
            </div>
            <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-gold-400/20 sm:aspect-[3/2] lg:aspect-[5/4]">
              <Image
                src="/branding/delta-campana.webp"
                alt="Imagen de campaña de DELTA con un frasco ámbar iluminado en dorado"
                fill
                unoptimized
                preload
                className="object-cover object-[58%_50%]"
              />
            </div>
          </div>
        </section>

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
          <section
            id="club"
            className="scroll-mt-24 px-6 pt-16 max-w-6xl mx-auto w-full"
          >
            <div className="gold-ring relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine-900 via-slate-950 to-slate-950 p-8 sm:p-12 grid gap-10 lg:grid-cols-2 items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
              />

              <div className="relative space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                  <Crown className="w-3.5 h-3.5" /> Club DELTA
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
                  Crea tu cuenta y haz que cada pedido cuente
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Es gratis. Al iniciar sesión acumulas puntos con cada compra,
                  guardas tus fragancias favoritas y sigues tus pedidos desde un
                  solo lugar.
                </p>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" /> Favoritos
                    guardados en tu cuenta
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" /> Puntos por
                    cada pedido
                  </li>
                  <li className="flex items-center gap-2">
                    <Gem className="w-4 h-4 text-gold-400" /> Beneficios que
                    crecen con tu nivel
                  </li>
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
                  <li
                    key={tier.id}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {i < TIERS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-gold-400/50 to-gold-400/5"
                      />
                    )}
                    <span className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-400/60 bg-slate-950">
                      <span className="h-2 w-2 rounded-full bg-gold-400" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-xl font-semibold text-white">
                          {tier.name}
                        </span>
                        <span className="text-xs text-gold-400/80">
                          {tier.min === 0
                            ? "Al crear tu cuenta"
                            : `Desde ${tier.min.toLocaleString("es-CO")} puntos`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {tier.perks.join(" · ")}
                      </p>
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
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                Fragancias destacadas
              </h2>
              <p className="text-sm text-slate-400 max-w-md">
                Explora una selección del catálogo y consulta sus notas, precios y disponibilidad.
              </p>
            </div>
            <Link
              href="/tienda"
              className="text-sm font-semibold text-gold-300 hover:text-white transition-colors"
            >
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
                  className="delta-product-card group"
                >
                  <div className="relative overflow-hidden">
                    <ProductPhoto src={p.image_url} name={p.name} className="aspect-[4/3] w-full rounded-none border-0" />
                    <span className="absolute left-4 top-4 rounded-full border border-gold-400/25 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold text-gold-300 backdrop-blur">
                      {p.family}
                    </span>
                    <button
                      onClick={() => handleFav(p)}
                      aria-pressed={fav}
                      aria-label={
                        fav
                          ? `Quitar ${p.name} de favoritos`
                          : `Guardar ${p.name} en favoritos`
                      }
                      title={
                        user
                          ? fav
                            ? "Quitar de favoritos"
                            : "Guardar en favoritos"
                          : "Inicia sesión para guardar favoritos"
                      }
                      className="absolute right-4 top-4 rounded-full border border-slate-700/60 bg-slate-950/60 p-2 backdrop-blur transition-colors hover:border-rose-400/60"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${fav ? "fill-rose-500 text-rose-500" : "text-slate-300"}`}
                      />
                    </button>
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="space-y-1.5">
                      <h3 className="font-display text-2xl font-semibold text-slate-100">
                        <Link href={`/tienda/producto/${p.id}`} className="hover:text-gold-300">{p.name}</Link>
                      </h3>
                      <p className="text-xs text-slate-500">{p.brand}</p>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <span className="text-lg font-bold text-gold-300">
                        {formatCOP(Number(p.price))}
                      </span>
                      <button
                        disabled={
                          !ready ||
                          (cart.find((i) => i.id === p.id)?.quantity ?? 0) >=
                            p.stock
                        }
                        onClick={() => handleAdd(p)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                          agregado
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-gold-500 text-slate-950 hover:bg-gold-400"
                        }`}
                      >
                        {agregado ? (
                          <>
                            <Check className="w-4 h-4" /> Agregado
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Agregar
                          </>
                        )}
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
                Responde cuatro preguntas rápidas y te mostramos las fragancias
                que mejor encajan contigo.
              </p>
              <Link
                href="/test"
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-gold-400 transition-colors"
              >
                <Compass className="w-4 h-4" /> Encontrar mi fragancia
              </Link>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {PASOS_RECOMENDADOR.map((paso) => (
                <li
                  key={paso}
                  className="glass flex items-center gap-4 rounded-2xl px-5 py-3.5"
                >
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold-400" />
                  <span className="text-sm text-slate-200">{paso}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Por qué DELTA ---------- */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-10 max-w-xl">
            Perfumería de autor, con atención de boutique
          </h2>
          <div className="grid gap-10 md:grid-cols-3 md:divide-x md:divide-gold-400/10">
            {[
              {
                icon: Droplets,
                title: "Extractos concentrados",
                text: "Consulta las notas, presentación y concentración registradas en cada ficha de producto.",
              },
              {
                icon: Gem,
                title: "Boutique en Bogotá",
                text: "Una selección pequeña y cuidada, con asesoría real de quienes conocen cada fragancia.",
              },
              {
                icon: Truck,
                title: "Del pedido a tu puerta",
                text: "Arma tu pedido en línea y coordina con la tienda el pago y las condiciones de entrega.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="space-y-3 md:px-8 first:md:pl-0 last:md:pr-0"
              >
                <Icon className="w-6 h-6 text-gold-400" />
                <h3 className="font-display text-xl font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-slate-900 border-t border-gold-400/20 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400 pb-12 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span className="font-display font-semibold text-white text-sm tracking-[0.25em]">
                DELTA
              </span>
            </div>
            <p className="leading-relaxed">
              Perfumería y asesoría en Bogotá, Colombia.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tienda"
                  className="hover:text-gold-300 transition-colors"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href="/test"
                  className="hover:text-gold-300 transition-colors"
                >
                  Encontrar mi fragancia
                </Link>
              </li>
              <li>
                <Link
                  href="/nosotros"
                  className="hover:text-gold-300 transition-colors"
                >
                  Nuestra historia
                </Link>
              </li>
              {user && (
                <li>
                  <Link
                    href="/cuenta/pedidos"
                    className="hover:text-gold-300 transition-colors"
                  >
                    Mis pedidos
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="font-bold text-gold-300 hover:underline"
                  >
                    Panel de control
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Ubicación y envíos</h4>
            <ul className="space-y-2">
              <li>Bogotá, Colombia</li>
              <li>Consulta cobertura y tiempos de entrega.</li>
              <li>Atención al cliente en línea.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Cómo pedir</h4>
            <p className="leading-relaxed">
              Elige tus fragancias, completa tus datos y confirma tu pedido por
              WhatsApp con nuestro equipo.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {year} DELTA Perfumería. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
