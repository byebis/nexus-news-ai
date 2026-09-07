'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, SlidersHorizontal, Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';
import { useT, useLang, useCategoryName, LDate, pickTitle } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/categories';
import { ArticleImage } from '@/components/magazine/ArticleImage';
import type { Article } from '@/lib/store';

interface SearchRow extends Partial<Article> {
  id: string;
  title: string;
  category: string;
}

/**
 * Advanced search overlay: full-text (title/summary/content) + filters
 * (category, agent, period) + sort. Server-side via /api/search.
 */
export default function SearchOverlay() {
  const { searchOpen, setSearchOpen, agents } = useNexusStore();
  const t = useT();
  const { lang } = useLang();
  const categoryName = useCategoryName();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [agentId, setAgentId] = useState('');
  const [days, setDays] = useState(0);
  const [sort, setSort] = useState<'recent' | 'old' | 'quality'>('recent');

  const [results, setResults] = useState<SearchRow[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [touched, setTouched] = useState(false);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q && !category && !agentId && !days) {
      setResults([]);
      setState('idle');
      return;
    }
    setState('loading');
    setTouched(true);
    try {
      const params = new URLSearchParams({ sort, limit: '24' });
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (agentId) params.set('agent', agentId);
      if (days) params.set('days', String(days));
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
    } finally {
      setState('done');
    }
  }, [query, category, agentId, days, sort]);

  // Debounced auto-search
  useEffect(() => {
    if (!searchOpen) return;
    const h = setTimeout(runSearch, 350);
    return () => clearTimeout(h);
  }, [runSearch, searchOpen]);

  // Focus + esc + body scroll lock
  useEffect(() => {
    if (!searchOpen) return;
    setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [searchOpen, setSearchOpen]);

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setAgentId('');
    setDays(0);
    setSort('recent');
    setResults([]);
    setState('idle');
    setTouched(false);
    inputRef.current?.focus();
  };

  const hasFilters = !!query.trim() || !!category || !!agentId || !!days;
  const staffAgents = agents.filter((a) => a.category !== 'redazione');

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-[6vh] flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{t('searchOpenTitle')}</h2>
                  <p className="text-xs text-muted-foreground">{t('searchOpenSubtitle')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Chiudi">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Input */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchInputPlaceholder')}
                  className="h-11 w-full rounded-lg border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary"
                  aria-label={t('searchOpenTitle')}
                />
                {state === 'loading' && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Filters */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
                {/* Category chips */}
                <button
                  onClick={() => setCategory('')}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${!category ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {t('searchAllCategories')}
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? '' : c)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${category === c ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    {categoryName(c)}
                  </button>
                ))}

                <span className="mx-1 hidden h-4 w-px bg-border sm:block" />

                {/* Agent select */}
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="h-7 rounded-full border bg-background px-2 text-xs outline-none"
                  aria-label={t('searchAgent')}
                >
                  <option value="">{t('searchAllAgents')}</option>
                  {staffAgents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>

                {/* Period select */}
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
                  className="h-7 rounded-full border bg-background px-2 text-xs outline-none"
                  aria-label={t('searchPeriod')}
                >
                  <option value={0}>{t('searchPeriodAll')}</option>
                  <option value={7}>{t('searchPeriod7')}</option>
                  <option value={30}>{t('searchPeriod30')}</option>
                  <option value={90}>{t('searchPeriod90')}</option>
                </select>

                {/* Sort select */}
                <select
                  value={sort}
                  onChange={(e) => setSort((e.target.value as 'recent' | 'old' | 'quality') || 'recent')}
                  className="h-7 rounded-full border bg-background px-2 text-xs outline-none"
                  aria-label={t('searchSort')}
                >
                  <option value="recent">{t('searchSortRecent')}</option>
                  <option value="old">{t('searchSortOld')}</option>
                  <option value="quality">{t('searchSortQuality')}</option>
                </select>

                {hasFilters && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={resetFilters}>
                    <X className="mr-1 h-3 w-3" /> {t('searchReset')}
                  </Button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {state === 'idle' && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t('searchStartHint')}</p>
                </div>
              )}

              {state === 'loading' && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">{t('searchSearching')}</p>
                </div>
              )}

              {state === 'done' && results.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Newspaper className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {t('noResults')} &laquo;{query.trim()}&raquo;
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('searchEmptyHint')}</p>
                </div>
              )}

              {state === 'done' && results.length > 0 && (
                <div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{results.length}</span> {t('searchResultsFor')}
                    {query.trim() && <> &laquo;<span className="font-semibold text-foreground">{query.trim()}</span>&raquo;</>}
                  </p>
                  <div className="space-y-2.5">
                    {results.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(`/articolo/${r.id}`);
                        }}
                        className="group flex w-full items-stretch gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/60"
                      >
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                          <ArticleImage
                            imageUrl={r.imageUrl}
                            imageCredit={r.imageCredit}
                            imageCreditUrl={r.imageCreditUrl}
                            category={r.category}
                            seed={r.id}
                            alt={r.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              {categoryName(r.category)}
                            </Badge>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {(r as unknown as { agents?: { name?: string } }).agents?.name || ''}
                            </span>
                          </div>
                          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
                            {pickTitle(lang, r as Article)}
                          </h3>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {r.summary || r.subtitle || ''}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            <LDate date={r.publishedAt || r.createdAt || ''} />
                            {r.readTime ? <> · {r.readTime} min</> : null}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
