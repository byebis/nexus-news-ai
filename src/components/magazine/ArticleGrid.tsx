'use client';

import { useEffect, useMemo, useState } from 'react';
import { Newspaper, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useT } from '@/lib/i18n';
import ArticleCard from './ArticleCard';

type SortMode = 'recent' | 'quality';

export default function ArticleGrid() {
  const { articles, selectedCategory, setArticles } = useNexusStore();
  const t = useT();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadArticles() {
      setLoading(true);
      try {
        let data = await fetchArticles({
          status: 'published',
          limit: 50,
          category:
            selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'bookmarks'
              ? selectedCategory
              : undefined,
        });
        if (selectedCategory === 'bookmarks') {
          useBookmarks.getState().hydrate();
          const saved = new Set(useBookmarks.getState().ids);
          data = data.filter((a) => saved.has(a.id));
        }
        if (!cancelled) setArticles(data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadArticles();
    return () => { cancelled = true; };
  }, [selectedCategory, setArticles]);

  const filteredArticles = useMemo(() => {
    let list = articles.filter(
      (a) =>
        selectedCategory === 'all' ||
        selectedCategory === 'bookmarks' ||
        a.category === selectedCategory
    );
    if (selectedCategory === 'bookmarks') {
      const saved = new Set(useBookmarks.getState().ids);
      list = list.filter((a) => saved.has(a.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.agent?.name?.toLowerCase().includes(q)
      );
    }
    if (sort === 'quality') {
      list = [...list].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
      );
    }
    return list;
  }, [articles, selectedCategory, query, sort]);

  if (loading && articles.length === 0) {
    return (
      <div>
        {/* Skeleton toolbar */}
        <div className="flex gap-2 mb-5">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredArticles.length === 0 && !loading && !query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t('noArticlesTitle')}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {t('noArticlesBody')}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + sort toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
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

      {filteredArticles.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t('noResults')} &laquo;{query}&raquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
