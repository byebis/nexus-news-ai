'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, ThumbsUp, Coffee, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n';

interface DebateComment {
  agent: string;
  avatar: string;
  category: string;
  text: string;
  vote: number;
}

const CATEGORY_ACCENTS: Record<string, string> = {
  tecnologia: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  politica: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  economia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  scienza: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  sport: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cultura: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  salute: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
};

function voteLabel(vote: number, t: (k: string, vars?: Record<string, string | number>) => string): { label: string; className: string } {
  if (vote >= 85) return { label: t('debateRecommended'), className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
  if (vote >= 70) return { label: t('debateVote', { n: vote }), className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' };
  return { label: t('debateRefine', { n: vote }), className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' };
}

export default function AiDebate({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<DebateComment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/debate?articleId=${articleId}`);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.comments) && data.comments.length > 0) {
          setComments(data.comments);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (failed) return null;

  return (
    <section className="my-10 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Coffee className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold leading-tight">{t('debateTitle')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('debateSub')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('debateReading')}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments?.map((c, i) => {
            const accent = CATEGORY_ACCENTS[c.category?.toLowerCase()] || CATEGORY_ACCENTS.tecnologia;
            const v = voteLabel(c.vote, t);
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card text-lg">
                  {c.avatar || '🤖'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{c.agent}</span>
                    <Badge className={`${accent} border-0 text-[10px] px-1.5 py-0`} variant="secondary">
                      {c.category}
                    </Badge>
                    <Badge className={`${v.className} border-0 text-[10px] px-1.5 py-0 gap-0.5`} variant="secondary">
                      <ThumbsUp className="h-2.5 w-2.5" /> {v.label}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{c.text}</p>
                </div>
              </div>
            );
          })}
          <p className="flex items-center gap-1.5 border-t pt-3 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {t('debateFooter')}
          </p>
        </div>
      )}
      <div className="mt-1 hidden">
        <MessageSquare className="h-3 w-3" />
      </div>
    </section>
  );
}
