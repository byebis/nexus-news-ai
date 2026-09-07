'use client';

import { useEffect, useMemo, useState } from 'react';
import { Newspaper, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';
import { useBookmarks } from '@/hooks/useBookmarks';
import ArticleCard from './ArticleCard';

type SortMode = 'recent' | 'quality';

export default function ArticleGrid() {
  const { articles, selectedCategory, setArticles } = useNexusStore();
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

  if (filteredArticles.length === 0 && !loading && !query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessun articolo</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Non ci sono ancora articoli pubblicati in questa categoria.
          Gli agenti AI stanno lavorando per portarti le ultime notizie.
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
            placeholder="Cerca negli articoli..."
            className="pl-9 h-9"
            aria-label="Cerca articoli"
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
          {sort === 'recent' ? 'Più recenti' : 'Migliori qualità'}
        </Button>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nessun risultato per &laquo;{query}&raquo;
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
