'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { AGENT_REACTIONS } from '@/lib/agent-slug';

const STORAGE_KEY = 'nexus_reactions_v1';

const LABEL_KEY: Record<string, string> = {
  '🔥': 'reactionFire',
  '👏': 'reactionApplause',
  '🤯': 'reactionWow',
  '😢': 'reactionTear',
  '🤖': 'reactionBot',
};

function readMine(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeMine(map: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage pieno/bloccato: la reazione resta comunque registrata server-side
  }
}

/**
 * Reactions — barra reazioni rapide a fine articolo (Level 13).
 * Una sola reazione per tipo per browser (dedup via localStorage),
 * conteggi live dall'API, aggiornamento ottimistico con rollback.
 */
export default function Reactions({ articleId }: { articleId: string }) {
  const t = useT();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/reactions?articleId=${encodeURIComponent(articleId)}`, {
          signal: ac.signal,
        });
        const json = await res.json();
        if (json?.counts) setCounts(json.counts);
      } catch {
        // silent — la barra resta con zeri
      }
    })();
    // differito: evita setState sincrono nell'effetto (cascading render)
    const tid = setTimeout(() => setMine(readMine()[articleId] || []), 0);
    return () => {
      ac.abort();
      clearTimeout(tid);
    };
  }, [articleId]);

  const react = async (reaction: string) => {
    if (busy || mine.includes(reaction)) return;
    setBusy(reaction);

    // aggiornamento ottimistico
    setCounts((c) => ({ ...c, [reaction]: (c[reaction] || 0) + 1 }));
    const nextMine = [...mine, reaction];
    setMine(nextMine);
    writeMine({ ...readMine(), [articleId]: nextMine });

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, reaction }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'failed');
      if (json.counts) setCounts(json.counts);
      toast({ title: t('reactionThanksTitle'), description: t('reactionThanksBody') });
    } catch {
      // rollback
      setCounts((c) => ({ ...c, [reaction]: Math.max(0, (c[reaction] || 1) - 1) }));
      const rolled = nextMine.filter((r) => r !== reaction);
      setMine(rolled);
      writeMine({ ...readMine(), [articleId]: rolled });
      toast({ title: t('reactionError'), description: t('reactionErrorBody'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section aria-label={t('reactionTitle')} className="my-8 rounded-xl border bg-muted/30 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {t('reactionTitle')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {AGENT_REACTIONS.map((r) => {
          const active = mine.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => react(r)}
              disabled={active || busy === r}
              aria-pressed={active}
              aria-label={t(LABEL_KEY[r])}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                active
                  ? 'border-primary bg-primary/10 font-semibold text-primary'
                  : 'bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm'
              } disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none`}
            >
              <span className="text-base leading-none">{r}</span>
              <span className="hidden sm:inline">{t(LABEL_KEY[r])}</span>
              <span className="text-xs font-bold tabular-nums text-muted-foreground">{counts[r] || 0}</span>
            </button>
          );
        })}
      </div>
      {total > 0 && (
        <p className="mt-2.5 text-xs text-muted-foreground">{t('reactionTotal', { n: total })}</p>
      )}
    </section>
  );
}
