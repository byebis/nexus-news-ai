'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Loader2, Send, Sparkles, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import type { WeeklyDigest } from '@/lib/store';
import { useT, useLang } from '@/lib/i18n';

/**
 * WeeklyDigestSection — "Il Digest della Redazione".
 * Public: shows this week's editorial threads (one per agent).
 * Staff (admin/editor): generate buttons + Telegram send.
 */
export default function WeeklyDigestSection() {
  const { currentUser } = useNexusStore();
  const t = useT();
  const { lang } = useLang();
  const [digests, setDigests] = useState<WeeklyDigest[] | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; avatar: string; category: string; weekCount: number }> | null>(null);
  const [generating, setGenerating] = useState<string | null>(null); // 'all' | agentId
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isStaff = !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/digests');
      const data = await res.json();
      if (Array.isArray(data?.digests)) setDigests(data.digests);
      if (Array.isArray(data?.agents)) setAgents(data.agents);
    } catch {
      if (digests === null) setDigests([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (agentId: string) => {
    setGenerating(agentId);
    setMessage(null);
    try {
      const res = await fetch('/api/digests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data?.error || 'Generazione fallita', type: 'error' });
      } else {
        await load();
      }
      return !res.ok ? (data?.error || 'Generazione fallita') : null;
    } catch {
      return 'Errore di rete durante la generazione';
    } finally {
      setGenerating(null);
    }
  };

  /** Silent variant used inside the sequential "generate all" loop. */
  const generateOne = async (agentId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/digests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok) return data?.error || 'Generazione fallita';
      await load();
      return null;
    } catch {
      return 'Errore di rete';
    }
  };

  const sendTelegram = async (digestId: string) => {
    setSending(digestId);
    setMessage(null);
    try {
      const res = await fetch('/api/digests/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data?.error || 'Invio fallito', type: 'error' });
      } else {
        setMessage({ text: `${t('digestSent')} (${data?.sent} messaggi)`, type: 'success' });
        await load();
      }
    } catch {
      setMessage({ text: 'Errore di rete durante l\'invio', type: 'error' });
    } finally {
      setSending(null);
    }
  };

  if (digests === null) {
    return (
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <DigestHeader />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 w-full max-w-sm shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  const agentsReady = (agents || []).filter((a) => a.weekCount > 0);

  // Hidden for readers when nothing exists yet
  if (digests.length === 0 && !isStaff) return null;

  return (
    <section className="rounded-2xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
      <DigestHeader />

      {message && (
        <p className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium ${
          message.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
        }`}>
          {message.text}
        </p>
      )}

      {digests.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('digestEmptyStaff')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {digests.map((d, i) => {
            const posts = (d.content || '').split(/\n\n+/).filter(Boolean);
            return (
              <motion.article
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex flex-col rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-lg">
                    {d.agent?.avatar || '🤖'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold">{d.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {d.agent?.name || 'AI Agent'} · {d.articleCount} {lang === 'en' ? 'articles' : 'articoli'}
                      {d.sentChannels?.includes('telegram') && (
                        <Badge className="ml-2 border-0 bg-sky-100 text-[10px] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" variant="secondary">
                          TG ✓
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1">
                  {posts.slice(0, 6).map((p, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {j + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-foreground/85">{p}</p>
                    </div>
                  ))}
                </div>
                {isStaff && (
                  <div className="mt-3 border-t pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      disabled={sending === d.id}
                      onClick={() => sendTelegram(d.id)}
                    >
                      {sending === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      {t('digestSendTelegram')}
                    </Button>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}

      {isStaff && agentsReady.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {agentsReady.map((a) => `${a.avatar} ${a.name} (${a.weekCount})`).join(' · ')}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled={generating !== null}
              onClick={async () => {
                setGenerating('all');
                for (const a of agentsReady) {
                  await generateOne(a.id);
                }
                setGenerating(null);
              }}
            >
              {generating !== null ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {t('digestGenerateAll')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function DigestHeader() {
  const t = useT();
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Newspaper className="h-4.5 w-4.5 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide">{t('digestTitle')}</h2>
        <p className="text-xs text-muted-foreground">{t('digestSub')}</p>
      </div>
      <RefreshCw className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
    </div>
  );
}
