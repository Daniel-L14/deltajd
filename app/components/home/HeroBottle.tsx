import type { CSSProperties } from 'react';

export default function HeroBottle({ className = '' }: { className?: string }) {
  const particles = [
    { x: 182, d: '0s', dx: '-14px' },
    { x: 200, d: '1.1s', dx: '10px' },
    { x: 218, d: '2.2s', dx: '-6px' },
    { x: 191, d: '3.3s', dx: '16px' },
    { x: 209, d: '4.4s', dx: '-18px' },
  ];
  const sparkles = [
    { x: 78, y: 170, s: 1, d: '0s' },
    { x: 330, y: 250, s: 0.8, d: '1.2s' },
    { x: 95, y: 410, s: 0.6, d: '2.1s' },
    { x: 318, y: 120, s: 0.7, d: '0.6s' },
  ];

  return (
    <svg
      viewBox="0 0 400 520"
      className={className}
      role="img"
      aria-label="Frasco de perfume Elixir Noir de DELTA"
    >
      <defs>
        <radialGradient id="hb-aura" cx="50%" cy="58%" r="55%">
          <stop offset="0%" stopColor="#b9852c" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#55203a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#07070b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hb-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#f3d9a0" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="hb-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3d9a0" />
          <stop offset="35%" stopColor="#d4a64a" />
          <stop offset="75%" stopColor="#8a3b2a" />
          <stop offset="100%" stopColor="#3d1429" />
        </linearGradient>
        <linearGradient id="hb-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a5f1c" />
          <stop offset="30%" stopColor="#f6e6c0" />
          <stop offset="60%" stopColor="#d4a64a" />
          <stop offset="100%" stopColor="#7a521a" />
        </linearGradient>
        <linearGradient id="hb-cap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d0b0a" />
          <stop offset="35%" stopColor="#2e241b" />
          <stop offset="70%" stopColor="#15110e" />
          <stop offset="100%" stopColor="#0a0908" />
        </linearGradient>
        <clipPath id="hb-body-clip">
          <rect x="112" y="192" width="176" height="258" rx="26" />
        </clipPath>
      </defs>

      <circle className="glow-pulse" cx="200" cy="300" r="200" fill="url(#hb-aura)" />

      <ellipse cx="200" cy="470" rx="150" ry="18" fill="none" stroke="#f3d9a0" strokeOpacity="0.12" />
      <ellipse cx="200" cy="470" rx="110" ry="12" fill="none" stroke="#f3d9a0" strokeOpacity="0.18" />

      {particles.map((p) => (
        <circle
          key={p.x}
          className="scent"
          cx={p.x}
          cy="90"
          r="4"
          fill="#f3d9a0"
          style={{ '--d': p.d, '--dx': p.dx } as CSSProperties}
        />
      ))}

      {sparkles.map((s) => (
        <path
          key={`${s.x}-${s.y}`}
          className="sparkle"
          d={`M${s.x} ${s.y - 12 * s.s} L${s.x + 3 * s.s} ${s.y - 3 * s.s} L${s.x + 12 * s.s} ${s.y} L${s.x + 3 * s.s} ${s.y + 3 * s.s} L${s.x} ${s.y + 12 * s.s} L${s.x - 3 * s.s} ${s.y + 3 * s.s} L${s.x - 12 * s.s} ${s.y} L${s.x - 3 * s.s} ${s.y - 3 * s.s} Z`}
          fill="#f6e6c0"
          style={{ '--d': s.d } as CSSProperties}
        />
      ))}

      <g className="float-slow">
        <ellipse cx="200" cy="462" rx="92" ry="9" fill="#000" opacity="0.45" />

        <rect x="112" y="192" width="176" height="258" rx="26" fill="#0e0c12" />
        <g clipPath="url(#hb-body-clip)">
          <rect x="112" y="250" width="176" height="200" fill="url(#hb-liquid)" />
          <ellipse cx="200" cy="250" rx="88" ry="7" fill="#f6e6c0" opacity="0.55" />
          <circle cx="140" cy="410" r="3" fill="#f6e6c0" opacity="0.35" />
          <circle cx="255" cy="385" r="2.2" fill="#f6e6c0" opacity="0.3" />
          <circle cx="160" cy="300" r="1.8" fill="#f6e6c0" opacity="0.3" />
        </g>
        <rect x="112" y="192" width="176" height="258" rx="26" fill="url(#hb-glass)" stroke="#f3d9a0" strokeOpacity="0.45" />

        <rect x="124" y="208" width="9" height="222" rx="4.5" fill="#fff" opacity="0.16" />
        <rect x="270" y="222" width="4" height="150" rx="2" fill="#fff" opacity="0.1" />

        <rect x="146" y="312" width="108" height="92" rx="6" fill="#07070b" fillOpacity="0.62" stroke="url(#hb-gold)" strokeWidth="1.2" />
        <text x="200" y="350" textAnchor="middle" fontSize="20" fill="url(#hb-gold)" letterSpacing="4" fontFamily="var(--font-playfair), Georgia, serif" fontWeight="700">
          DELTA
        </text>
        <line x1="170" y1="361" x2="230" y2="361" stroke="#d4a64a" strokeOpacity="0.6" />
        <text x="200" y="379" textAnchor="middle" fontSize="12" fill="#f3d9a0" fontStyle="italic" fontFamily="var(--font-playfair), Georgia, serif">
          Elixir Noir
        </text>
        <text x="200" y="394" textAnchor="middle" fontSize="7.5" fill="#f3d9a0" fillOpacity="0.7" letterSpacing="2">
          EXTRAIT 100 ML
        </text>

        <rect x="168" y="168" width="64" height="28" rx="3" fill="url(#hb-gold)" />
        <rect x="160" y="190" width="80" height="8" rx="3" fill="url(#hb-gold)" />
        <rect x="152" y="98" width="96" height="76" rx="14" fill="url(#hb-cap)" stroke="#f3d9a0" strokeOpacity="0.35" />
        <rect x="152" y="158" width="96" height="9" fill="url(#hb-gold)" />
        <rect x="164" y="110" width="7" height="46" rx="3.5" fill="#fff" opacity="0.14" />
      </g>
    </svg>
  );
}