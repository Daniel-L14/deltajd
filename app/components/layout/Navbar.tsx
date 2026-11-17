"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";

const links = [
  { href: "/tienda", label: "Catálogo" },
  { href: "/test", label: "Encuentra tu fragancia" },
  { href: "/nosotros", label: "Nuestra historia" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/login", label: "Mi cuenta" },
];

export default function Navbar({ account }: { account?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navId = useId();

  return (
    <header className="delta-nav sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="DELTA, inicio" className="delta-wordmark">
          DELTA
        </Link>
        <div className="flex items-center gap-2 md:order-3">
          <Link href="/tienda/carrito" className="delta-secondary" aria-current={pathname === "/tienda/carrito" ? "page" : undefined}>
            <ShoppingBag aria-hidden className="size-4" /> <span>Carrito</span>
          </Link>
          <button
            type="button"
            className="delta-secondary md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls={navId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
        <nav
          id={navId}
          className={`${open ? "flex" : "hidden"} order-3 w-full flex-col gap-1 border-t border-gold-400/15 pt-2 md:order-none md:flex md:w-auto md:flex-row md:items-center md:border-0 md:pt-0`}
          aria-label="Navegación principal"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="rounded-md px-3 py-2.5 text-sm font-medium leading-snug text-slate-300 hover:bg-gold-400/10 hover:text-gold-200 aria-[current=page]:text-gold-300"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {account}
        </nav>
      </div>
    </header>
  );
}
