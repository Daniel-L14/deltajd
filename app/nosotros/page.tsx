"use client";
import { useSyncExternalStore } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Home,
  MapPin,
  Clock,
  Award,
  Layers,
  Cpu,
} from "lucide-react";

export default function NosotrosPage() {
  const year = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => 2026,
  );
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header Fijo */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" /> Volver
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Home className="w-4 h-4 text-slate-400" /> Inicio
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-widest text-white">
              DELTA
            </span>
          </Link>
        </div>
      </header>

      {/* Hero de Nosotros */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
          Nuestra Esencia
        </span>
        <h1 className="delta-title">
          Tradición y <em>tecnología</em>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          Conoce la historia detrás de la marca que revoluciona el arte de la
          perfumería fina en Bogotá a través de un ecosistema digital avanzado.
        </p>
      </section>

      {/* Sección Historia de la Marca */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="delta-section-title">
            El origen de <em>DELTA Perfumería</em>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            DELTA reúne un catálogo de fragancias y herramientas para ayudarte a
            elegir según tus preferencias.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consulta en cada producto su marca, presentación y notas
            registradas. Nuestro equipo puede orientarte antes de comprar.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nuestra plataforma digital de última generación optimiza la
            selección del catálogo, automatiza la atención de pedidos y
            moderniza la interacción entre la casa perfumista y sus clientes.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
          <div className="p-4 bg-gradient-to-br from-amber-500/20 to-slate-950 rounded-2xl border border-amber-500/20 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">DELTA Signature</h3>
            <p className="text-[11px] text-slate-400">Una elección personal</p>
          </div>
        </div>
      </section>

      {/* Trilogía de Pilares */}
      <section className="px-6 py-16 bg-slate-900/50 border-y border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 w-fit">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Ingredientes Seleccionados
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consulta los atributos de cada producto. La duración percibida
              depende de las condiciones de uso.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 w-fit">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Preferencias personales
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El test combina presupuesto, familia olfativa, ocasión y clima
              para ordenar las opciones disponibles.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Tecnología Web Avanzada
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diseño de software con Next.js 16 para una navegación fluida, ágil
              e intuitiva en cualquier dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* Ubicación y Horarios */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="delta-section-title">
            Visita nuestra <em>boutique</em>
          </h2>
          <p className="text-xs text-slate-400">
            Consulta disponibilidad y condiciones de entrega con la tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Dirección Principal
                </h4>
                <p className="text-xs text-slate-400">
                  Consulta con la tienda el punto de entrega o recogida.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Horarios de Atención
                </h4>
                <p className="text-xs text-slate-400">
                  Confirma los horarios con nuestro equipo.
                </p>
              </div>
            </div>
          </div>

          <div className="h-48 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-semibold">
            Coordina tu entrega al confirmar el pedido.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-8 text-center text-xs text-slate-500">
        © {year} DELTA Perfumería. Todos los derechos reservados.
      </footer>
    </div>
  );
}
