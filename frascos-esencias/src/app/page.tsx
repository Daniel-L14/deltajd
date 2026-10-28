import Link from 'next/link';
import { Sparkles, ShieldCheck, Compass, ShoppingBag } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Frascos & Esencias
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Perfumería Inteligente
        </h1>

        <p className="text-slate-400 text-base sm:text-lg">
          Sistema interactivo de recomendación personalizada de fragancias, catálogo dinámico y gestión centralizada de inventarios.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/test"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-colors"
          >
            <Compass className="w-5 h-5" /> Test de Fragancias
          </Link>

          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-amber-500" /> Ver Catálogo
          </Link>

          <Link
            href="/admin/inventory"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-semibold px-6 py-3.5 rounded-xl transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-slate-500" /> Admin
          </Link>
        </div>
      </div>
    </div>
  );
}