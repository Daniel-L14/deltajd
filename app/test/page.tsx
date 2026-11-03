'use client';

import RecommendationWizard from '@/app/components/recommendation/RecommendationWizard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

export default function TestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 py-12 relative">
      {/* Botones de Navegación Flotantes */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
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

      <RecommendationWizard />
    </div>
  );
}