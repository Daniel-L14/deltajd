"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Home,
  LogOut,
  Sparkles,
} from "lucide-react";

// 1. Renombramos tu componente original a AdminSidebarContent
function AdminSidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Resumen", href: "/admin", icon: LayoutDashboard },
    { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
    { name: "Inventario", href: "/admin/inventario", icon: Package },
  ];

  return (
    <div className="delta-frame flex min-h-screen flex-col text-slate-100 md:flex-row">
      {/* Sidebar / Barra de Navegación */}
      <aside className="flex w-full shrink-0 flex-col justify-between gap-3 border-b border-gold-400/20 bg-slate-900 px-5 py-4 md:w-60 md:border-r md:border-b-0 md:px-6 md:py-8">
        <div className="space-y-5 md:space-y-8">
          {/* Logo / Título */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="delta-wordmark">
                DELTA
              </h2>
              <p className="delta-eyebrow mt-1">
                Administración
              </p>
            </div>
          </div>

          {/* Menú de Secciones */}
          <nav aria-label="Panel de administración" className="flex flex-wrap gap-1.5 md:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
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
        <div className="flex flex-wrap gap-2 border-t border-gold-400/15 pt-3 md:flex-col md:pt-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Volver a la Tienda
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10">{children}</main>
    </div>
  );
}

// 2. Este es el layout que Next.js lee. Envuelve el Sidebar en Suspense.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
          Cargando panel...
        </div>
      }
    >
      <AdminSidebarContent>{children}</AdminSidebarContent>
    </Suspense>
  );
}
