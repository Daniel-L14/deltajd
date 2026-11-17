/** Club DELTA: puntos del ledger de pagos confirmados; niveles informativos, sin descuento automático. */

export const COP_POR_PUNTO = 1000;

export type TierId = "esencia" | "oro" | "reserva";

export interface Tier {
  id: TierId;
  name: string;
  min: number;
  tagline: string;
  perks: string[];
}

export const TIERS: Tier[] = [
  {
    id: "esencia",
    name: "Esencia",
    min: 0,
    tagline: "Tu punto de partida en DELTA",
    perks: [
      "Favoritos guardados en tu cuenta",
      "Seguimiento de todos tus pedidos",
      "Recomendador de fragancias a tu medida",
    ],
  },
  {
    id: "oro",
    name: "Oro",
    min: 500,
    tagline: "Para quien ya tiene su aroma de firma",
    perks: [
      "Historial de compras confirmadas",
      "Preferencias de fragancias guardadas en favoritos",
    ],
  },
  {
    id: "reserva",
    name: "Reserva",
    min: 1500,
    tagline: "El círculo más cercano de la casa",
    perks: [
      "Seguimiento de tu trayectoria de compras",
      "Asesoría personalizada por WhatsApp",
    ],
  },
];

export interface PedidoResumen {
  total: number | string | null;
  estado?: string | null;
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
  const percent = Math.min(
    100,
    Math.max(0, ((points - current.min) / span) * 100),
  );
  return { current, next, percent, pointsToNext: next.min - points };
}

export function nombreCorto(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const raw = user.user_metadata?.full_name;
  const full = typeof raw === "string" ? raw.trim() : "";
  if (full) return full.split(/\s+/)[0];
  const local = user.email?.split("@")[0] ?? "cliente";
  return local.charAt(0).toUpperCase() + local.slice(1);
}
