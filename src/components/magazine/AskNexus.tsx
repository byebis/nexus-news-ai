'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, ArrowUp, Loader2, FileText, CornerDownRight } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * "Chiedi a Nexus" — assistente AI pubblico (RAG sugli articoli pubblicati).
 * Bottone orbit flottante + pannello domande/risposte con citazioni.
 */

interface AskSource {
  n: number;
  id: string;
  title: string;
  category: string;
  date: string | null;
}

interface AskTurn {
  question: string;
  answer: string;
  sources: AskSource[];
}

const SUGGESTED = {
  it: [
    'Cosa sta succedendo nel mondo dell\u2019IA?',
    'Riassumimi le notizie sport di oggi',
    'Parlami della ricerca spaziale',
    'Quali sono le ultime notizie sull\u2019economia?',
  ],
  en: [
    'What is happening in the AI world?',
    'Summarize today\u2019s sports news',
    'Tell me about space research',
    'What are the latest economy stories?',
  ],
};

export default function AskNexus() {
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset error when language changes
  useEffect(() => setError(null), [lang]);

  // Autofocus + scroll su nuovo turno
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || loading) return;
    setQuestion('');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lang }),
        signal: AbortSignal.timeout(65_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('askError'));
        return;
      }
      setTurns((prev) => [
        ...prev,
        { question, answer: data.answer, sources: data.sources || [] },
      ]);
    } catch {
      setError(t('askError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Orb flottante */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('askNexusTitle')}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl shadow-rose-500/25"
        style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 50%, #a855f7 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping opacity-20" />
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Sparkles className="h-6 w-6 text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </motion.button>

      {/* Pannello */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-5 sm:w-[420px] z-50 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-violet-500/10 px-4 py-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{t('askNexusTitle')}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t('askNexusSub')}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversazione */}
            <div ref={scrollRef} className="max-h-[52vh] min-h-[180px] overflow-y-auto px-4 py-3 space-y-4">
              {turns.length === 0 && !loading && (
                <div className="py-2 space-y-3">
                  <p className="text-xs text-muted-foreground">{t('askNexusIntro')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED[lang].map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-full border bg-muted/50 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted hover:border-rose-400"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((turn, i) => (
                <div key={i} className="space-y-2">
                  {/* Domanda */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm">
                      {turn.question}
                    </div>
                  </div>
                  {/* Risposta */}
                  <div className="flex justify-start">
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed">
                      <p className="whitespace-pre-wrap break-words">{turn.answer}</p>
                      {turn.sources.length > 0 && (
                        <div className="mt-3 border-t pt-2 space-y-1">
                          <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {t('askSources')}
                          </p>
                          {turn.sources.map((s) => (
                            <a
                              key={s.id}
                              href={`/articolo/${s.id}`}
                              onClick={() => setOpen(false)}
                              className="group flex items-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-[9px] font-bold text-rose-600">
                                {s.n}
                              </span>
                              <span className="line-clamp-1 group-hover:underline">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    <span className="animate-pulse">{t('askThinking')}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <CornerDownRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(question);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('askPlaceholder')}
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-full border bg-muted/30 px-4 py-2.5 text-sm outline-none transition-colors focus:border-rose-400 focus:bg-background"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  aria-label={t('askSend')}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity',
                    !question.trim() || loading
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:opacity-90'
                  )}
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #f97316)' }}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
