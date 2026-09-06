'use client';

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useNexusStore } from '@/lib/store';

/**
 * Breaking news ticker: scrolls titles of the newest articles.
 * CSS-only animation, pauses on hover.
 */
export default function NewsTicker() {
  const { articles } = useNexusStore();

  const items = useMemo(() => {
    const sorted = [...articles].sort(
      (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );
    return sorted.slice(0, 6).map((a) => ({ id: a.id, title: a.title, category: a.category }));
  }, [articles]);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="relative flex items-stretch overflow-hidden rounded-xl border bg-card h-10">
      <div className="z-10 flex items-center gap-1.5 bg-red-600 text-white px-3 shrink-0">
        <Zap className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Ultim&apos;ora</span>
        <span className="text-xs font-bold uppercase sm:hidden">Flash</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center ticker-scroll whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={`${item.id}-${i}`} className="inline-flex items-center text-sm mx-6">
              <span className="text-muted-foreground mr-2 text-xs">{item.category}</span>
              <span className="font-medium">{item.title}</span>
              <span className="ml-6 text-border">•</span>
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-scroll {
          animation: ticker 40s linear infinite;
          width: max-content;
        }
        .ticker-container:hover .ticker-scroll,
        div:hover > .ticker-scroll {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
