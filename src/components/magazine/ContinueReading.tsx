'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useT, useCategoryName } from '@/lib/i18n';
import { ArticleImage } from '@/components/magazine/ArticleImage';
import { Button } from '@/components/ui/button';

/**
 * ContinueReading — Level 8 "Continua a leggere":
 * strip degli ultimi articoli letti (localStorage, max 8).
 * Visibile solo in homepage e solo se c'è cronologia.
 */
export default function ContinueReading() {
  const router = useRouter();
  const t = useT();
  const categoryName = useCategoryName();
  const { history, hydrated, hydrate, removeHistory, clearHistory } = usePersonalization();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated || history.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-muted/30 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
          <History className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t('continueReading')}</h2>
          <p className="truncate text-xs text-muted-foreground">{t('continueReadingSub')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 text-xs text-muted-foreground"
          onClick={clearHistory}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('clearHistory')}
        </Button>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-1 pb-2">
        {history.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="group relative w-64 shrink-0 snap-start"
          >
            <button
              onClick={() => router.push(`/articolo/${h.id}`)}
              className="flex w-full items-stretch gap-3 rounded-xl border bg-background p-2.5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                <ArticleImage
                  imageUrl={h.imageUrl}
                  category={h.category}
                  seed={h.id}
                  alt={h.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {categoryName(h.category)}
                </p>
                <h3 className="line-clamp-2 text-xs font-bold leading-snug group-hover:text-primary transition-colors">
                  {h.title}
                </h3>
              </div>
            </button>
            <button
              aria-label={t('removeFromHistory')}
              onClick={() => removeHistory(h.id)}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
