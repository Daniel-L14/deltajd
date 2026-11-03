'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Home, 
  LogOut, 
  Sparkles 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
    { name: 'Inventario', href: '/admin/inventario', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Barra de Navegación */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo / Título */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-wider">DELTA</h2>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Admin Control</p>
            </div>
          </div>

          {/* Menú de Secciones */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botones inferiores: Ir a Inicio y Cerrar Sesión */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2 mt-8 md:mt-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Volver a la Tienda
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}