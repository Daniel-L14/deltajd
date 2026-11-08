'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Crown, Heart, Home, Package, Sparkles } from 'lucide-react';
import HeroBottle from '@/app/components/home/HeroBottle';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const BENEFICIOS = [
  { icon: Crown, text: 'Puntos del Club DELTA en cada pedido' },
  { icon: Heart, text: 'Favoritos guardados en tu cuenta' },
  { icon: Package, text: 'Seguimiento de todos tus pedidos' },
];

export default function AuthShell({ title, subtitle, children }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="grain relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-wine-900 via-wine-950 to-slate-950 p-12">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="p-2.5 rounded-2xl border border-gold-400/30 bg-gold-500/10 text-gold-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-[0.25em] text-white">DELTA</span>
        </Link>

        <div className="relative flex flex-col items-center gap-8">
          <HeroBottle className="w-64 h-auto" />
          <div className="space-y-4 max-w-sm">
            <h2 className="font-display text-3xl font-semibold text-white leading-tight">
              Tu cuenta, tu aroma de firma
            </h2>
            <ul className="space-y-3">
              {BENEFICIOS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/25 bg-gold-500/10">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative text-xs text-slate-500 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-gold-400" /> Crear tu cuenta es gratis
        </p>
      </aside>

      <main className="relative flex flex-col items-center justify-center p-6 py-20">
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gold-400" /> Volver
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" /> Inicio
          </Link>
        </div>

        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <div className="lg:hidden inline-flex p-3 rounded-2xl border border-gold-400/30 bg-gold-500/10 text-gold-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="font-display text-4xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}