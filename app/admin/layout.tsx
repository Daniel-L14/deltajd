'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        return;
      }

      const email = user.email || '';
      setUserEmail(email);

      const role = user.user_metadata?.role || user.app_metadata?.role;

      if (role === 'admin' || email.toLowerCase() === 'daniel.latorrec@uniagustiniana.edu.co') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    };

    verifySession();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Verificando credenciales de administración DELTA...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-400 rounded-3xl">
          <ShieldAlert className="w-12 h-12 mx-auto" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h1 className="text-xl font-bold text-white">Acceso Restringido</h1>
          <p className="text-xs text-slate-400">
            La cuenta <span className="text-amber-400 font-semibold">{userEmail || 'actual'}</span> no cuenta con permisos de administrador.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/tienda')}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Ir a la Tienda
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Cambiar de Cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-widest text-white block leading-none">DELTA</span>
              <span className="text-[10px] text-amber-400 font-bold tracking-wider">PANEL CONTROL</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl transition-all shadow-md shadow-amber-500/10"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Inventario & Métricas</span>
            </Link>
            <Link
              href="/tienda"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Menú Digital</span>
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-red-950/50 hover:border-red-800 text-slate-300 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}