'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutDashboard, Package, ShoppingCart, Archive, Users, Settings, ArrowLeft, Home } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/admin/inventario', label: 'Inventario', icon: Archive },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between min-h-screen">
      <div className="space-y-8">
        {/* Marca DELTA */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white tracking-widest text-lg">DELTA</div>
              <div className="text-[10px] text-slate-400 font-medium">Perfumería Admin</div>
            </div>
          </div>

          {/* Navegación Flotante Global */}
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-[11px] font-semibold transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" /> Inicio
            </Link>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}