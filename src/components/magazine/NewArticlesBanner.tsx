'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';
import { useT } from '@/lib/i18n';

/**
 * AutoRefresh — polls for newly published articles every 60s.
 * When new articles exist that aren't in the store yet, shows a
 * floating "N nuovi articoli" banner; clicking loads them instantly
 * into the store (no full page reload).
 */
export default function NewArticlesBanner() {
  const { articles, setArticles } = useNexusStore();
  const t = useT();
  const [newCount, setNewCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Track current article ids
  useEffect(() => {
    if (articles.length > 0) {
      knownIdsRef.current = new Set(articles.map((a) => a.id));
    }
  }, [articles]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const latest = await fetchArticles({ status: 'published', limit: 10 });
      const fresh = latest.filter((a) => !knownIdsRef.current.has(a.id));
      if (fresh.length > 0 && knownIdsRef.current.size > 0) {
        setNewCount((prev) => Math.max(prev, fresh.length));
      } else if (knownIdsRef.current.size === 0 && latest.length > 0) {
        // First population happens via ArticleGrid; just adopt ids
        knownIdsRef.current = new Set(latest.map((a) => a.id));
      }
    } catch {
      // silent — polling must never disturb UX
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Wait for initial grid load, then poll every 60s
    const t0 = setTimeout(check, 5000);
    const t = setInterval(check, 60_000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [check]);

  const loadNew = useCallback(async () => {
    try {
      const data = await fetchArticles({ status: 'published', limit: 50 });
      setArticles(data);
      setNewCount(0);
    } catch {
      setNewCount(0);
    }
  }, [setArticles]);

  return (
    <AnimatePresence>
      {newCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 right-5 z-50"
        >
          <div className="flex items-center gap-2.5 rounded-full border bg-background/95 backdrop-blur-md shadow-xl pl-3 pr-1.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <span className="text-xs font-medium whitespace-nowrap">
              <BellRing className="inline h-3.5 w-3.5 text-teal-500 mr-1 -mt-0.5" />
              {newCount} {newCount === 1 ? t('oneNewArticle') : t('manyNewArticles')}
            </span>
            <Button size="sm" className="h-7 rounded-full px-3 gap-1.5" onClick={loadNew}>
              <RefreshCw className="h-3 w-3" />
              {t('loadNow')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
