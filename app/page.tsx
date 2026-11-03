'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Flame,
  Clock,
  Globe,
  Share2,
  MessageCircle,
  MapPin,
  LogOut,
  User
} from 'lucide-react';

export default function HomePage() {
  const [year, setYear] = useState<number>(2026);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setYear(new Date().getFullYear());

    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const role = user.user_metadata?.role || user.app_metadata?.role;
        setIsAdmin(role === 'admin');
      }
    };

    getSession();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header & Navegación Principal */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-widest text-white block leading-none">DELTA</span>
              <span className="text-[10px] text-amber-400/80 font-medium tracking-wider">ALTA PERFUMERÍA</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/tienda" className="hover:text-amber-400 transition-colors">
              Catálogo Exclusivo
            </Link>
            <Link href="/nosotros" className="hover:text-amber-400 transition-colors">
              Nuestra Historia
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Panel Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" /> {user.email}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-red-950/50 hover:border-red-800 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/tienda"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" /> Ver Catálogo
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" /> Boutique en Bogotá & Envíos Nacionales
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            EL ARTE DE LA <br />
            <span className="text-amber-400">ALTA PERFUMERÍA</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Descubre fragancias artesanales de autor, extractos de perfume altamente concentrados e ingredientes finos seleccionados para crear una huella olfativa imborrable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href="/tienda"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
            >
              <ShoppingBag className="w-4 h-4" /> Explorar Catálogo Directo <ArrowRight className="w-4 h-4" />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="w-full sm:w-auto px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Entrar al Panel de Control
              </Link>
            )}
          </div>
        </div>

        {/* Tarjeta Destacada */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Flame className="w-4 h-4" /> Edición Limitada
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Entrega Inmediata
              </span>
            </div>

            <div className="h-48 bg-gradient-to-br from-amber-500/20 via-slate-950 to-slate-900 rounded-2xl border border-amber-500/20 flex items-center justify-center p-6 text-center">
              <div>
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <div className="font-extrabold text-white text-xl">ELIXIR NOIR</div>
                <div className="text-xs text-slate-400">Extracto de Perfume 100ml</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">PRECIO EXCLUSIVO</span>
                <span className="text-xl font-bold text-amber-400">$240.000</span>
              </div>
              <Link
                href="/tienda"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Pedir Ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Completo */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400 pb-12 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white text-sm tracking-widest">DELTA PERFUMERÍA</span>
            </div>
            <p className="leading-relaxed">
              El arte de crear esencias duraderas. Calidad artesanal y tecnología web avanzada para llevar el aroma perfecto a tu puerta.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tienda" className="hover:text-amber-400 transition-colors">
                  Ver Catálogo Digital
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-amber-400 transition-colors">
                  Nuestra Historia
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin" className="text-amber-400 hover:underline transition-colors font-bold">
                    Panel de Control
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Ubicación y Envíos</h4>
            <ul className="space-y-2">
              <li>Bogotá, Colombia</li>
              <li>Despachos a nivel nacional en 24/48h.</li>
              <li>Atención al cliente en línea activa.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Proyecto DELTA</h4>
            <p className="leading-relaxed">
              Plataforma desarrollada con Next.js 16 y Supabase. Experiencia optimizada para dispositivos móviles y escritorio.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {year} DELTA Perfumería. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacidad</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Términos del Servicio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}