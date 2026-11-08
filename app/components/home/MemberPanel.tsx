'use client';

import Link from 'next/link';
import {
  Check,
  Compass,
  Crown,
  Gift,
  Heart,
  Lock,
  Package,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { TIERS, COP_POR_PUNTO } from '@/lib/club';
import { ESTADO_LABEL, type EstadoPedido } from '@/lib/pedidos/types';
import { formatCOP } from '@/lib/format';
import type { Member } from '@/lib/useMember';

interface Props {
  member: Member;
  showWelcome: boolean;
  onDismissWelcome: () => void;
}

export default function MemberPanel({ member, showWelcome, onDismissWelcome }: Props) {
  const { firstName, points, progress, ultimoPedido, favs, toggleFav, pedidosCount } = member;
  const { current, next, percent, pointsToNext } = progress;

  const estado = (ultimoPedido?.estado ?? '').toLowerCase().trim() as EstadoPedido;
  const estadoLabel = ESTADO_LABEL[estado] ?? ultimoPedido?.estado ?? '';

  const currentIdx = TIERS.findIndex((t) => t.id === current.id);
  const unlocked = TIERS.slice(0, currentIdx + 1).flatMap((t) => t.perks);
  const locked = next ? next.perks : [];

  return (
    <section
      id="mi-espacio"
      aria-label="Tu espacio en el Club DELTA"
      className="scroll-mt-24 px-6 pt-10 max-w-6xl mx-auto w-full"
    >
      {showWelcome && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-gold-400/40 bg-gold-500/10 px-5 py-4 text-sm"
        >
          <Sparkles className="w-5 h-5 text-gold-400 mt-0.5 shrink-0" />
          <p className="flex-1 text-gold-200 leading-relaxed">
            <span className="font-semibold text-white">Bienvenido de vuelta, {firstName}.</span>{' '}
            Tu sesión está iniciada: guarda favoritos, sigue tus pedidos y acumula puntos en cada compra.
          </p>
          <button
            onClick={onDismissWelcome}
            aria-label="Cerrar mensaje de bienvenida"
            className="p-1 text-gold-300/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="gold-ring relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine-900 via-slate-950 to-slate-950 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                <Crown className="w-3.5 h-3.5" /> Club DELTA · nivel {current.name}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                Hola, {firstName}
              </h2>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                {ultimoPedido
                  ? `Tu último pedido${ultimoPedido.codigo ? ` ${ultimoPedido.codigo}` : ''} está en estado «${estadoLabel}». ${current.tagline}.`
                  : 'Aún no tienes pedidos. Con el primero empiezas a acumular puntos.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="font-display text-5xl font-semibold text-gold-gradient leading-none">
                    {points.toLocaleString('es-CO')}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">puntos acumulados</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {pedidosCount} {pedidosCount === 1 ? 'pedido' : 'pedidos'}
                </div>
              </div>

              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
                aria-label={next ? `Progreso hacia el nivel ${next.name}` : 'Nivel máximo alcanzado'}
                className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
              >
                <div
                  className="bar-fill h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-200"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-slate-400">
                {next
                  ? `Te faltan ${pointsToNext.toLocaleString('es-CO')} puntos (${formatCOP(pointsToNext * COP_POR_PUNTO)} en pedidos) para llegar a ${next.name}.`
                  : 'Estás en el nivel más alto. Gracias por ser parte de la casa.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Ganas 1 punto por cada {formatCOP(COP_POR_PUNTO)} en pedidos que no se cancelan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/cuenta/pedidos"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-gold-400/50 hover:text-white transition-colors"
              >
                <Package className="w-4 h-4 text-gold-400" /> Mis pedidos
              </Link>
              <Link
                href="/test"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-gold-400/50 hover:text-white transition-colors"
              >
                <Compass className="w-4 h-4 text-gold-400" /> Encontrar mi fragancia
              </Link>
              <Link
                href="/tienda"
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-gold-400 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Ir al catálogo
              </Link>
            </div>
          </div>

          <div className="space-y-6 lg:border-l lg:border-gold-400/10 lg:pl-8">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Gift className="w-4 h-4 text-gold-400" /> Tus beneficios
              </h3>
              <ul className="space-y-2">
                {unlocked.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {perk}
                  </li>
                ))}
                {locked.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-slate-500">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      {perk} <span className="text-slate-600">(nivel {next?.name})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Heart className="w-4 h-4 text-rose-400" /> Tus favoritos
              </h3>
              {favs.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toca el corazón en cualquier fragancia del catálogo para guardarla aquí.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {favs.slice(0, 6).map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-500/5 pl-3 pr-1.5 py-1 text-xs text-slate-200"
                    >
                      {f.name}
                      <button
                        onClick={() => toggleFav(f)}
                        aria-label={`Quitar ${f.name} de favoritos`}
                        className="rounded-full p-0.5 text-slate-500 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}