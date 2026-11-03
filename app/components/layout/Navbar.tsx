'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Compass, User, LogOut, Shield, ArrowLeft, Home } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;

        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (mounted && profile?.role === 'ADMIN') {
            setIsAdmin(true);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [pathname, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar fallos de red al desautenticar
    }
    window.location.href = '/';
  };

  const isHomePage = pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Izquierda: Botón Atrás + Logo */}
        <div className="flex items-center gap-3">
          {!isHomePage && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              title="Volver a la página anterior"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Atrás</span>
            </button>
          )}

          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">Frascos & Esencias</span>
          </Link>
        </div>

        {/* Centro: Navegación */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link 
            href="/" 
            className={`flex items-center gap-1 transition-colors ${pathname === '/' ? 'text-amber-400 font-bold' : 'hover:text-amber-400'}`}
          >
            <Home className="w-3.5 h-3.5" /> Inicio
          </Link>
          <Link 
            href="/catalogo" 
            className={`transition-colors ${pathname === '/catalogo' ? 'text-amber-400 font-bold' : 'hover:text-amber-400'}`}
          >
            Catálogo
          </Link>
          <Link 
            href="/test" 
            className={`flex items-center gap-1.5 transition-colors ${pathname === '/test' ? 'text-amber-300 font-bold' : 'text-amber-400 hover:text-amber-300'}`}
          >
            <Compass className="w-4 h-4" /> Recomendador
          </Link>
          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg"
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* Derecha: Iniciar Sesión / Salir */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs text-red-400 font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}