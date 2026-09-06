'use client';

import { CATEGORY_META } from '@/lib/categories';

interface Props {
  category: string;
  seed: string;
  className?: string;
}

// Deterministic pseudo-random from string seed
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Lightweight procedural SVG cover art per article:
 * gradient base + geometric shapes, deterministic per article id.
 * No external images needed - zero cost, instant load.
 */
export function ArticleCover({ category, seed, className }: Props) {
  const meta = CATEGORY_META[category] || CATEGORY_META.default;
  const h = hashSeed(seed || category);

  // Shapes vary per article but stay stable for the same id
  const cx1 = 12 + (h % 70);
  const cy1 = 10 + ((h >> 3) % 60);
  const r1 = 22 + ((h >> 5) % 30);
  const rot = h % 360;
  const x2 = 60 + ((h >> 7) % 35);
  const y2 = 55 + ((h >> 9) % 35);

  const gid = `g-${h.toString(36)}`;

  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={meta.accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill={`url(#${gid})`} />
      <circle cx={cx1} cy={cy1} r={r1} fill="#ffffff" opacity="0.08" />
      <circle cx={x2} cy={y2} r="14" fill="#ffffff" opacity="0.06" />
      <rect x="-20" y="42" width="140" height="30" transform={`rotate(${rot / 12} 50 55)`} fill="#000000" opacity="0.18" />
      <text x="78" y="52" fontSize="16" opacity="0.9">{meta.emoji}</text>
    </svg>
  );
}
