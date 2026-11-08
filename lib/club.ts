/**
 * CLUB DELTA — programa de beneficios para clientes con sesión iniciada.
 *
 * Los puntos se calculan a partir de la tabla `pedidos` existente
 * (1 punto por cada $1.000 COP en pedidos no cancelados), así que no
 * requiere cambios en la base de datos.
 *
 * ⚠️ AJUSTAR: los beneficios de los niveles Oro y Reserva son compromisos
 * comerciales. Edita este archivo para dejar solo lo que DELTA pueda cumplir.
 */

export const COP_POR_PUNTO = 1000;

export type TierId = 'esencia' | 'oro' | 'reserva';

export interface Tier {
  id: TierId;
  name: string;
  min: number;
  tagline: string;
  perks: string[];
}

export const TIERS: Tier[] = [
  {
    id: 'esencia',
    name: 'Esencia',
    min: 0,
    tagline: 'Tu punto de partida en DELTA',
    perks: [
      'Favoritos guardados en tu cuenta',
      'Seguimiento de todos tus pedidos',
      'Recomendador de fragancias a tu medida',
    ],
  },
  {
    id: 'oro',
    name: 'Oro',
    min: 500,
    tagline: 'Para quien ya tiene su aroma de firma',
    perks: [
      'Muestra de cortesía en cada pedido',
      'Despacho prioritario',
    ],
  },
  {
    id: 'reserva',
    name: 'Reserva',
    min: 1500,
    tagline: 'El círculo más cercano de la casa',
    perks: [
      'Acceso anticipado a ediciones limitadas',
      'Asesoría personalizada por WhatsApp',
    ],
  },
];

export interface PedidoResumen {
  total: number | string | null;
  estado?: string | null;
}

export function calcularPuntos(pedidos: PedidoResumen[]): number {
  const gastado = pedidos
    .filter((p) => (p.estado ?? '').toLowerCase().trim() !== 'cancelado')
    .reduce((sum, p) => sum + Number(p.total ?? 0), 0);
  return Math.floor(gastado / COP_POR_PUNTO);
}

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  percent: number;
  pointsToNext: number;
}

export function getTierProgress(points: number): TierProgress {
  let idx = 0;
  TIERS.forEach((t, i) => {
    if (points >= t.min) idx = i;
  });
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;

  if (!next) return { current, next: null, percent: 100, pointsToNext: 0 };

  const span = next.min - current.min;
  const percent = Math.min(100, Math.max(0, ((points - current.min) / span) * 100));
  return { current, next, percent, pointsToNext: next.min - points };
}

export function nombreCorto(user: {
  email?: string | null;
  user_metadata?: Record<string, any> | null;
}): string {
  const full = (user.user_metadata?.full_name as string | undefined)?.trim();
  if (full) return full.split(/\s+/)[0];
  const local = user.email?.split('@')[0] ?? 'cliente';
  return local.charAt(0).toUpperCase() + local.slice(1);
}