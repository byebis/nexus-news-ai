'use client';

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { Loader2, Languages, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReaderShell from '@/components/magazine/ReaderShell';
import { useLang, useT, useCategoryName } from '@/lib/i18n';
import type { Article } from '@/lib/store';

// ============================================
// Shared translation store (headline + body stay in sync)
// ============================================

interface EnData {
  title: string;
  subtitle: string;
  summary: string;
  content: string;
}

interface TranslationStore {
  map: Record<string, EnData>;
  set: (id: string, data: EnData) => void;
}

const useTranslationStore = create<TranslationStore>((set) => ({
  map: {},
  set: (id, data) => set((s) => ({ map: { ...s.map, [id]: data } })),
}));

function getEn(article: Article, map: Record<string, EnData>): EnData | null {
  if (map[article.id]) return map[article.id];
  if (article.contentEn) {
    return {
      title: article.titleEn || article.title,
      subtitle: article.subtitleEn || '',
      summary: article.summaryEn || '',
      content: article.contentEn,
    };
  }
  return null;
}

// ============================================
// Headline (in the hero cover) — switches IT/EN
// ============================================

export function TranslatableHeadline({ article }: { article: Article }) {
  const { lang } = useLang();
  const map = useTranslationStore((s) => s.map);
  const en = getEn(article, map);
  const title = lang === 'en' && en ? en.title : article.title;
  const subtitle = lang === 'en' && en ? en.subtitle : article.subtitle;

  return (
    <>
      <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
    </>
  );
}

// ============================================
// Small client labels used by the server page
// ============================================

export function CategoryBadgeLabel({ category }: { category: string }) {
  const categoryName = useCategoryName();
  return <>{categoryName(category)}</>;
}

export function RelatedHeading({ category }: { category: string }) {
  const t = useT();
  const categoryName = useCategoryName();
  return <>{t('relatedFrom', { cat: categoryName(category) })}</>;
}

export function SourceNote({ agentName }: { agentName: string }) {
  const t = useT();
  return <>{t('rewrittenBy', { agent: agentName })}</>;
}

// ============================================
// Article body — IT/EN switch + on-demand translation
// ============================================

export function ArticleBodyClient({ article }: { article: Article }) {
  const { lang, setLang } = useLang();
  const t = useT();
  const map = useTranslationStore((s) => s.map);
  const setTranslation = useTranslationStore((s) => s.set);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const en = getEn(article, map);
  const active = lang === 'en';
  const usingEn = active && !!en;

  const paragraphsIt = (article.content || '').split(/\n+/).filter((p) => p.trim().length > 0);
  const paragraphsEn = en ? (en.content || '').split(/\n+/).filter((p) => p.trim().length > 0) : [];
  const paragraphs = usingEn ? paragraphsEn : paragraphsIt;

  const plainText = [
    usingEn ? en!.title : article.title,
    usingEn ? (en!.subtitle || '') : (article.subtitle || ''),
    usingEn ? en!.content : (article.content || article.summary || ''),
  ].join('. ').replace(/\s+/g, ' ').trim();

  const ensureTranslation = useCallback(async () => {
    if (en || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/translate/${article.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.contentEn) {
        setError(true);
      } else {
        setTranslation(article.id, {
          title: data.titleEn || article.title,
          subtitle: data.subtitleEn || '',
          summary: data.summaryEn || '',
          content: data.contentEn,
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [en, loading, article.id, article.title, article.subtitleEn, setTranslation]);

  const switchLang = (next: 'it' | 'en') => {
    setLang(next);
    if (next === 'en' && !en) {
      void ensureTranslation();
    }
  };

  // Auto-translate when the page opens directly in EN without a cached translation
  useEffect(() => {
    if (lang === 'en' && !en && !loading) {
      void ensureTranslation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, article.id]);

  return (
    <>
      {/* Language switch */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {!active && (article.titleEn || article.contentEn) && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => switchLang('en')}
          >
            <Languages className="h-3.5 w-3.5" />
            {t('readInEnglish')}
          </Button>
        )}
        {!active && !article.contentEn && !article.titleEn && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            disabled={loading}
            onClick={() => switchLang('en')}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
            {t('readInEnglish')}
          </Button>
        )}
        {active && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => switchLang('it')}
          >
            <Languages className="h-3.5 w-3.5" />
            {t('readInItalian')}
          </Button>
        )}
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {t('translating')}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-600 dark:text-red-400">{t('translateFailed')}</span>
        )}
        {usingEn && !loading && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('translatedWithAI')}
          </span>
        )}
      </div>

      <ReaderShell text={plainText}>
        <div className="py-8 space-y-6 leading-relaxed">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p
                key={`${lang}-${i}`}
                className={
                  i === 0 && !usingEn
                    ? 'text-[1.25em] font-medium text-foreground/90 first-letter:text-5xl first-letter:font-extrabold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]'
                    : ''
                }
              >
                {p}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">{usingEn ? en!.summary : article.summary}</p>
          )}
        </div>
      </ReaderShell>
    </>
  );
}
