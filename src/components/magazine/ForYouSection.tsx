'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNexusStore } from '@/lib/store';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useT, useLang, useCategoryName, pickTitle } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/categories';
import { ArticleImage } from '@/components/magazine/ArticleImage';
import { cn } from '@/lib/utils';
import type { Article } from '@/lib/store';

/**
 * ForYouSection — Level 8 "Per te":
 * l'utente sceglie le categorie preferite (⭐) e qui appare un giornale
 * su misura: le ultime notizie SOLO delle sue categorie, in strip scorrevole.
 * Tutto locale (localStorage), zero backend.
 */
export default function ForYouSection() {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const categoryName = useCategoryName();
  const { articles } = useNexusStore();
  const { favorites, hydrated, hydrate, toggleFavorite } = usePersonalization();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const picks = useMemo(() => {
    if (favorites.length === 0) return [];
    const favSet = new Set(favorites.map((f) => f.toLowerCase()));
    return articles
      .filter((a) => a.status === 'published' && favSet.has((a.category || '').toLowerCase()))
      .slice(0, 10);
  }, [articles, favorites]);

  // Nascosto finché l'utente non ha preferenze
  if (!hydrated || favorites.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <Sparkles className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t('forYouTitle')}</h2>
          <p className="truncate text-xs text-muted-foreground">{t('forYouSub')}</p>
        </div>
      </div>

      {/* Chip categorie preferite (toggle) */}
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((cat) => {
          const active = favorites.some((f) => f.toLowerCase() === cat.toLowerCase());
          return (
            <button
              key={cat}
              onClick={() => toggleFavorite(cat)}
              aria-label={`${active ? t('removeFromFav') : t('addToFav')}: ${categoryName(cat)}`}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                active
                  ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Star className={cn('h-3.5 w-3.5', active && 'fill-amber-500 text-amber-500')} />
              {categoryName(cat)}
            </button>
          );
        })}
      </div>

      {/* Strip articoli delle categorie preferite */}
      {picks.length > 0 ? (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-1 pb-2">
          {picks.map((a, i) => (
            <ForYouCard
              key={a.id}
              article={a}
              index={i}
              onOpen={() => router.push(`/articolo/${a.id}`)}
              alt={pickTitle(lang, a)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('forYouEmpty')}</p>
      )}
    </section>
  );
}

function ForYouCard({
  article,
  index,
  onOpen,
  alt,
}: {
  article: Article;
  index: number;
  onOpen: () => void;
  alt: string;
}) {
  const t = useT();
  const categoryName = useCategoryName();
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onOpen}
      className="group w-60 shrink-0 snap-start overflow-hidden rounded-xl border bg-background text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-28 w-full overflow-hidden">
        <ArticleImage
          imageUrl={article.imageUrl}
          imageCredit={article.imageCredit}
          imageCreditUrl={article.imageCreditUrl}
          category={article.category}
          seed={article.id}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          {categoryName(article.category)}
        </p>
        <h3 className="line-clamp-2 min-h-[2.4em] text-xs font-bold leading-snug group-hover:text-primary transition-colors">
          {alt}
        </h3>
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {article.agent?.name || 'AI Agent'} · {article.readTime} {t('minRead')}
        </p>
      </div>
    </motion.button>
  );
}
