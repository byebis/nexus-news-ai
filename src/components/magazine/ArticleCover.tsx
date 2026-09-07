'use client';

import { CATEGORY_META } from '@/lib/categories';

interface Props {
  category: string;
  seed: string;
  className?: string;
}

// ============================================
// Deterministic PRNG (cyrb128 + mulberry32)
// ============================================
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================
// Category palettes: rich multi-stop combos
// ============================================
const PALETTES: Record<string, string[][]> = {
  tecnologia: [
    ['#06b6d4', '#3b82f6', '#0f172a'],
    ['#22d3ee', '#6366f1', '#020617'],
    ['#2dd4bf', '#0ea5e9', '#082f49'],
  ],
  politica: [
    ['#f59e0b', '#ef4444', '#1c1917'],
    ['#f97316', '#dc2626', '#292524'],
    ['#eab308', '#f97316', '#1c1917'],
  ],
  economia: [
    ['#10b981', '#059669', '#022c22'],
    ['#34d399', '#0d9488', '#064e3b'],
    ['#a3e635', '#16a34a', '#14532d'],
  ],
  scienza: [
    ['#8b5cf6', '#d946ef', '#1e1b4b'],
    ['#a78bfa', '#7c3aed', '#2e1065'],
    ['#c084fc', '#6d28d9', '#4c1d95'],
  ],
  sport: [
    ['#ef4444', '#f43f5e', '#450a0a'],
    ['#f87171', '#e11d48', '#4c0519'],
    ['#fb7185', '#dc2626', '#7f1d1d'],
  ],
  cultura: [
    ['#ec4899', '#a855f7', '#500724'],
    ['#f472b6', '#d946ef', '#831843'],
    ['#f9a8d4', '#c026d3', '#701a75'],
  ],
  salute: [
    ['#84cc16', '#10b981', '#1a2e05'],
    ['#a3e635', '#14b8a6', '#052e16'],
    ['#4ade80', '#22c55e', '#064e3b'],
  ],
  redazione: [['#f43f5e', '#f97316', '#1c0a0a']],
  default: [['#f43f5e', '#f97316', '#0f172a']],
};

type Rng = () => number;

interface Pattern {
  id: string;
  draw: (rng: Rng, colors: string[], uid: string) => React.ReactNode;
}

// ============================================
// 8 pattern families — every article gets one
// ============================================
const PATTERNS: Pattern[] = [
  {
    id: 'waves',
    draw: (rng, colors) => {
      const paths: React.ReactNode[] = [];
      const n = 5 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const yBase = 12 + i * (44 / n) + rng() * 6;
        const amp = 2.5 + rng() * 5;
        const freq = 1.2 + rng() * 1.6;
        const phase = rng() * 40;
        let d = `M -5 ${yBase}`;
        for (let x = 0; x <= 110; x += 5) {
          d += ` L ${x} ${(yBase + Math.sin((x + phase) * freq * 0.08) * amp).toFixed(1)}`;
        }
        paths.push(
          <path
            key={i}
            d={d}
            fill="none"
            stroke={i % 3 === 0 ? '#ffffff' : colors[0]}
            strokeWidth={0.7 + rng() * 0.9}
            opacity={0.14 + rng() * 0.22}
          />
        );
      }
      return <g>{paths}</g>;
    },
  },
  {
    id: 'rings',
    draw: (rng, colors) => {
      const cx = 15 + rng() * 70;
      const cy = 10 + rng() * 40;
      const rings: React.ReactNode[] = [];
      const n = 5 + Math.floor(rng() * 4);
      for (let i = 1; i <= n; i++) {
        rings.push(
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i * (4.5 + rng() * 2)}
            fill="none"
            stroke={i % 2 === 0 ? '#ffffff' : colors[0]}
            strokeWidth={0.5 + rng() * 0.7}
            opacity={0.16 + rng() * 0.18}
          />
        );
      }
      rings.push(<circle key="core" cx={cx} cy={cy} r={2 + rng() * 2} fill="#ffffff" opacity="0.5" />);
      return <g>{rings}</g>;
    },
  },
  {
    id: 'constellation',
    draw: (rng, colors) => {
      const pts: Array<[number, number]> = [];
      const n = 9 + Math.floor(rng() * 6);
      for (let i = 0; i < n; i++) {
        pts.push([rng() * 100, rng() * 60]);
      }
      const lines: React.ReactNode[] = [];
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i][0] - pts[j][0];
          const dy = pts[i][1] - pts[j][1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 24) {
            lines.push(
              <line key={`${i}-${j}`} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]}
                stroke="#ffffff" strokeWidth="0.35" opacity="0.22" />
            );
          }
        }
      }
      return (
        <g>
          {lines}
          {pts.map(([x, y], i) => (
            <circle key={`p${i}`} cx={x} cy={y} r={0.7 + rng() * 1.1}
              fill={i % 4 === 0 ? colors[0] : '#ffffff'} opacity={0.55 + rng() * 0.4} />
          ))}
        </g>
      );
    },
  },
  {
    id: 'dots',
    draw: (rng, colors) => {
      const cells: React.ReactNode[] = [];
      const cols = 10 + Math.floor(rng() * 5);
      const rows = 7 + Math.floor(rng() * 3);
      const gap = 100 / cols;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const r = rng();
          if (r < 0.45) continue;
          cells.push(
            <circle key={`${i}-${j}`}
              cx={gap * (i + 0.5) + (rng() - 0.5) * 1.5}
              cy={(60 / rows) * (j + 0.5) + (rng() - 0.5) * 1.5}
              r={0.4 + r * 1.4}
              fill={r > 0.85 ? colors[0] : '#ffffff'}
              opacity={0.12 + r * 0.3}
            />
          );
        }
      }
      return <g>{cells}</g>;
    },
  },
  {
    id: 'stripes',
    draw: (rng, colors) => {
      const bars: React.ReactNode[] = [];
      const n = 7 + Math.floor(rng() * 6);
      const rot = -(15 + rng() * 35);
      for (let i = 0; i < n; i++) {
        const x = -20 + i * (140 / n) + rng() * 8;
        const w = 1.5 + rng() * 5;
        bars.push(
          <rect key={i} x={x} y="-25" width={w} height="120"
            fill={i % 3 === 0 ? colors[0] : '#ffffff'}
            opacity={0.08 + rng() * 0.16}
            transform={`rotate(${rot} 50 30)`} />
        );
      }
      return <g>{bars}</g>;
    },
  },
  {
    id: 'peaks',
    draw: (rng, colors) => {
      const layers: React.ReactNode[] = [];
      const n = 3 + Math.floor(rng() * 2);
      for (let l = 0; l < n; l++) {
        let d = `M -5 ${62}`;
        const steps = 6 + Math.floor(rng() * 4);
        const baseY = 32 + l * 8 + rng() * 4;
        for (let s = 0; s <= steps; s++) {
          const x = -5 + (110 / steps) * s;
          const y = baseY - rng() * (18 - l * 4);
          d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        d += ` L 105 62 Z`;
        layers.push(
          <path key={l} d={d}
            fill={l % 2 === 0 ? '#000000' : colors[0]}
            opacity={l % 2 === 0 ? 0.35 - l * 0.06 : 0.14 + rng() * 0.1} />
        );
      }
      // sun/moon
      layers.push(
        <circle key="sun" cx={18 + rng() * 64} cy={10 + rng() * 10} r={4 + rng() * 3}
          fill="#ffffff" opacity="0.5" />
      );
      return <g>{layers}</g>;
    },
  },
  {
    id: 'orbits',
    draw: (rng, colors, uid) => {
      const cx = 50 + (rng() - 0.5) * 30;
      const cy = 30 + (rng() - 0.5) * 16;
      const el: React.ReactNode[] = [];
      const n = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const rx = 12 + i * (9 + rng() * 4);
        const ry = rx * (0.35 + rng() * 0.35);
        const rot = rng() * 180;
        el.push(
          <ellipse key={`e${i}`} cx={cx} cy={cy} rx={rx} ry={ry}
            fill="none" stroke={i % 2 === 0 ? '#ffffff' : colors[0]}
            strokeWidth="0.5" opacity={0.2 + rng() * 0.18}
            transform={`rotate(${rot} ${cx} ${cy})`} />
        );
        // planet on the orbit
        const angle = rng() * Math.PI * 2;
        const px = cx + rx * Math.cos(angle);
        const py = cy + ry * Math.sin(angle);
        el.push(<circle key={`pl${i}`} cx={px} cy={py} r={0.9 + rng() * 1.2}
          fill={colors[0]} opacity="0.85" />);
      }
      el.push(
        <circle key="star" cx={cx} cy={cy} r={3.2 + rng() * 2}
          fill={`url(#core-${uid})`} opacity="0.9" />
      );
      return <g>{el}</g>;
    },
  },
  {
    id: 'cells',
    draw: (rng, colors) => {
      const blobs: React.ReactNode[] = [];
      const n = 5 + Math.floor(rng() * 5);
      for (let i = 0; i < n; i++) {
        const cx = rng() * 100;
        const cy = rng() * 60;
        const r = 3 + rng() * 9;
        blobs.push(
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke={i % 2 === 0 ? '#ffffff' : colors[0]}
              strokeWidth={0.5 + rng() * 0.6} opacity={0.14 + rng() * 0.2} />
            <circle cx={cx} cy={cy} r={r * 0.45} fill={i % 3 === 0 ? colors[0] : '#ffffff'} opacity={0.1 + rng() * 0.14} />
            {rng() > 0.5 && (
              <circle cx={cx + r * 0.5} cy={cy - r * 0.4} r={r * 0.18} fill="#ffffff" opacity="0.3" />
            )}
          </g>
        );
      }
      return <g>{blobs}</g>;
    },
  },
];

/**
 * Generative Cover Art Engine — every article gets a unique, deterministic
 * piece of procedural art: layered gradients + one of 8 pattern families
 * + film grain. Zero external images, zero cost, instant render.
 */
export function ArticleCover({ category, seed, className }: Props) {
  const catKey = (category || 'default').toLowerCase();
  const palettes = PALETTES[catKey] || PALETTES.default;
  const hash = cyrb128(seed || category || 'nexus');
  const rng = mulberry32(hash[0]);

  const colors = palettes[Math.floor(rng() * palettes.length)];
  const pattern = PATTERNS[Math.floor(rng() * PATTERNS.length)];
  const meta = CATEGORY_META[category] || CATEGORY_META.default;

  // Gradient geometry
  const ang = Math.floor(rng() * 4);
  const dirs = [
    ['0%', '0%', '100%', '100%'],
    ['100%', '0%', '0%', '100%'],
    ['0%', '100%', '100%', '0%'],
    ['100%', '100%', '0%', '0%'],
  ] as const;
  const [x1, y1, x2, y2] = dirs[ang];

  // Glow positions
  const g1x = 15 + rng() * 70, g1y = 10 + rng() * 40;
  const g2x = 15 + rng() * 70, g2y = 10 + rng() * 45;

  const uid = `${hash[0].toString(36)}${hash[1].toString(36)}`.slice(0, 10);
  const patternArt = pattern.draw(rng, colors, uid);
  const emojiX = 4 + rng() * 6;
  const emojiY = 10 + rng() * 4;

  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="55%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
        <radialGradient id={`glow1-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`glow2-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="0.55" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={colors[0]} />
        </radialGradient>
        <radialGradient id={`vig-${uid}`} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="78%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.42" />
        </radialGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.06" />
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Base */}
      <rect width="100" height="60" fill={`url(#bg-${uid})`} />
      {/* Glows */}
      <circle cx={g1x} cy={g1y} r={26 + rng() * 12} fill={`url(#glow1-${uid})`} />
      <circle cx={g2x} cy={g2y} r={22 + rng() * 14} fill={`url(#glow2-${uid})`} />
      {/* Pattern */}
      <g>{patternArt}</g>
      {/* Vignette */}
      <rect width="100" height="60" fill={`url(#vig-${uid})`} />
      {/* Film grain */}
      <rect width="100" height="60" filter={`url(#grain-${uid})`} opacity="0.5" />
      {/* Category emoji signature */}
      <text x={emojiX} y={emojiY} fontSize="5" opacity="0.85">{meta.emoji}</text>
    </svg>
  );
}
