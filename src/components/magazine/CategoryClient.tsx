'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, ArrowUpDown, Newspaper, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchArticles } from '@/lib/api';
import { useT, useLang } from '@/lib/i18n';
import { CATEGORY_META, categoryBySlug } from '@/lib/categories';
import type { Article } from '@/lib/store';
import ArticleCard from './ArticleCard';

type SortMode = 'recent' | 'quality';

/**
 * Pagina sezione (/categoria/[slug]): hero con colore categoria,
 * breadcrumb, ricerca e grid articoli — come le sezioni dei grandi magazine.
 */
export default function CategoryClient({ slug, categoryName }: { slug: string; categoryName: string }) {
  const t = useT();
  const { lang } = useLang();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const cat = categoryBySlug(slug);
  const meta = CATEGORY_META[categoryName] || CATEGORY_META.default;

  // Nome localizzato server-independent: usa il dizionario i18n client
  const labelKey = cat?.labelKey || 'catTechnology';
  const descKey = cat?.descKey || 'catDescTechnology';
  const localLabel = t(labelKey);
  const localDesc = t(descKey);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchArticles({ status: 'published', category: categoryName, limit: 50 });
        if (!cancelled) setArticles(data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [categoryName]);

  const filtered = useMemo(() => {
    let list = articles;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q)
      );
    }
    if (sort === 'quality') {
      list = [...list].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    } else {
      list = [...list].sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
    }
    return list;
  }, [articles, query, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          {t('catBreadcrumbHome')}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{localLabel}</span>
      </nav>

      {/* Hero sezione */}
      <header
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${meta.gradient} p-[1px]`}
      >
        <div className="rounded-2xl bg-background/90 backdrop-blur px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-lg text-2xl`}
              aria-hidden
            >
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{localLabel}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{localDesc}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {loading ? '…' : t('catArticlesCount', { n: articles.length })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar ricerca + ordinamento */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9 h-9"
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 shrink-0"
          onClick={() => setSort((s) => (s === 'recent' ? 'quality' : 'recent'))}
          aria-label="Cambia ordinamento"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
          {sort === 'recent' ? t('sortRecent') : t('sortQuality')}
        </Button>
      </div>

      {/* Grid */}
      {loading && articles.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t('noArticlesTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{t('catEmptyBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}

      <span className="sr-only">{lang === 'en' ? 'Section' : 'Sezione'} {localLabel}</span>
    </div>
  );
}
