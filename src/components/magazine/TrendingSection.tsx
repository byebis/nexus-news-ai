'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Eye } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  views: number;
}

export default function TrendingSection() {
  const [items, setItems] = useState<TrendingItem[] | null>(null);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/views/trending')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.items)) {
          setItems(data.items.slice(0, 5));
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/50">
          <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wide">{t('trendingNow')}</h2>
        <span className="text-xs text-muted-foreground">{t('trendingSub')}</span>
      </div>

      {items === null ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 w-72 shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={`/articolo/${item.id}`}
              className="group flex w-72 shrink-0 items-center gap-3 rounded-xl border bg-background/60 p-3 text-left transition-all hover:border-primary/40 hover:shadow-md"
            >
              <span className="text-2xl font-black leading-none text-primary/70 group-hover:text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Eye className="h-3 w-3" /> {item.views} {t('reads')} · {item.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
