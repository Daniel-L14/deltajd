'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  Home,
  MapPin,
  Clock,
  Award,
  Layers,
  Cpu
} from 'lucide-react';

export default function NosotrosPage() {
  const [year, setYear] = useState<number>(2026);
  const router = useRouter();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

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
            <span className="text-xl font-bold tracking-widest text-white">DELTA</span>
          </Link>
        </div>
      </header>

      {/* Hero de Nosotros */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Nuestra Esencia</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          TRADICIÓN Y <span className="text-amber-400">TECNOLOGÍA</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          Conoce la historia detrás de la marca que revoluciona el arte de la perfumería fina en Bogotá a través de un ecosistema digital avanzado.
        </p>
      </section>

      {/* Sección Historia de la Marca */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            El Origen de <span className="text-amber-400">DELTA Perfumería</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            **DELTA** nació con la vocación de transformar aceites esenciales y fragancias de alta maceración en experiencias exclusivas para el paladar olfativo más exigente de Bogotá.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cada frasco es ensamblado mediante procesos de refinamiento artesanal, seleccionando ingredientes finos y honrando el balance entre notas de salida, corazón y fondo.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nuestra plataforma digital de última generación optimiza la selección del catálogo, automatiza la atención de pedidos y moderniza la interacción entre la casa perfumista y sus clientes.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
          <div className="p-4 bg-gradient-to-br from-amber-500/20 to-slate-950 rounded-2xl border border-amber-500/20 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">DELTA Signature</h3>
            <p className="text-[11px] text-slate-400">Excelencia Olfativa Garantizada</p>
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
            <h3 className="text-base font-bold text-white">Ingredientes Seleccionados</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trabajamos con extractos puros y esencias importadas que garantizan durabilidad e intensidad.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 w-fit">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Maceración de Autor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cada fórmula reposa el tiempo óptimo para asegurar que la estela y la fijación sean impecables.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Tecnología Web Avanzada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diseño de software con Next.js 16 para una navegación fluida, ágil e intuitiva en cualquier dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* Ubicación y Horarios */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Visita Nuestra Boutique</h2>
          <p className="text-xs text-slate-400">Ven a experimentar nuestras colecciones exclusivas en persona.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Dirección Principal</h4>
                <p className="text-xs text-slate-400">Bogotá, Colombia • Calle 23D # 104A - 25</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Horarios de Atención</h4>
                <p className="text-xs text-slate-400">Lunes a Domingo: 10:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>

          <div className="h-48 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-semibold">
            Mapa Interactivo de Ubicación DELTA
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