"use client";
import Link from "next/link";
import { useState } from "react";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto p-4 flex flex-wrap justify-between items-center gap-4">
        <Link href="/" className="text-amber-300 text-xl font-bold">
          DELTA
        </Link>
        <button
          className="md:hidden delta-secondary"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          Menú
        </button>
        <nav
          id="main-nav"
          className={`${open ? "flex" : "hidden"} md:flex flex-wrap gap-5`}
          aria-label="Navegación principal"
        >
          <Link href="/tienda">Catálogo</Link>
          <Link href="/test">Encontrar mi fragancia</Link>
          <Link href="/cuenta/pedidos">Mis pedidos</Link>
          <Link href="/tienda/carrito">Carrito</Link>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/login">Mi cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
