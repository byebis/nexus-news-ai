'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Pause, Play, Radio, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useT, useLang, useCategoryName } from '@/lib/i18n';
import { plainSpokenText } from '@/lib/summary';

/**
 * AudioBriefing — podcast-style daily briefing card on the homepage.
 * Reads the top 5 published headlines aloud via SpeechSynthesis
 * (zero cost, no API keys, works offline with the OS voice).
 */
interface BriefItem {
  id: string;
  title: string;
  category: string;
  summary: string;
}

const RATES = [1, 1.25, 1.5];

export default function AudioBriefing() {
  const { toast } = useToast();
  const t = useT();
  const { lang } = useLang();
  const categoryName = useCategoryName();
  const voiceLang = lang === 'en' ? 'en-US' : 'it-IT';
  const voicePrefix = lang === 'en' ? 'en' : 'it';

  const [items, setItems] = useState<BriefItem[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pct, setPct] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);

  const idxRef = useRef(0);
  const speakingRef = useRef(false);

  // Localized date — computed after mount (async) to avoid hydration mismatch
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setDateStr(
          new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())
        );
      } catch {
        setDateStr('');
      }
    }, 0);
    return () => clearTimeout(id);
  }, [lang]);

  // Fetch today's top published stories via the server API (robust: no build-time env needed)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/articles?status=published&limit=6', { signal: ac.signal });
        if (!res.ok) return;
        const data = await res.json();
        const list = (Array.isArray(data) ? data : [])
          .filter((a: { title?: string }) => !!a?.title)
          .slice(0, 5)
          .map((a: { id: string; title: string; category: string; summary?: string }) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            summary: a.summary || '',
          }));
        setItems(list);
      } catch {
        // silent — the card stays hidden
      }
    })();
    return () => ac.abort();
  }, []);

  const stopSpeech = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
    idxRef.current = 0;
    speakingRef.current = false;
    setSpeaking(false);
    setPaused(false);
    setPct(0);
  }, []);

  const speakFrom = useCallback(
    (startIdx: number, rate: number, chunkList: string[]) => {
      if (chunkList.length === 0) return;
      try {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.lang?.toLowerCase().startsWith(voicePrefix));
        setSpeaking(true);
        setPaused(false);
        speakingRef.current = true;
        for (let i = startIdx; i < chunkList.length; i++) {
          const u = new SpeechSynthesisUtterance(chunkList[i]);
          u.lang = voiceLang;
          if (voice) u.voice = voice;
          u.rate = rate;
          u.pitch = 1;
          u.onend = () => {
            idxRef.current = i + 1;
            setPct(Math.round(((i + 1) / chunkList.length) * 100));
            if (i + 1 >= chunkList.length) stopSpeech();
          };
          u.onerror = () => stopSpeech();
          window.speechSynthesis.speak(u);
        }
        // Guard: headless/blocked environments silently drop speech
        if (startIdx === 0) {
          setTimeout(() => {
            try {
              if (speakingRef.current && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                stopSpeech();
                toast({
                  title: t('ttsUnavailableHere'),
                  description: t('ttsUnavailableHereBody'),
                  variant: 'destructive',
                });
              }
            } catch {
              /* noop */
            }
          }, 1200);
        }
      } catch {
        toast({ title: t('ttsUnavailable'), description: t('ttsUnsupported'), variant: 'destructive' });
      }
    },
    [voicePrefix, voiceLang, stopSpeech, toast, t]
  );

  // Stop playback on language change (via cleanup) or unmount
  useEffect(() => {
    return () => stopSpeech();
  }, [lang, stopSpeech]);

  const script = useMemo(() => {
    if (items.length === 0) return '';
    const n = items.length;
    const intro = t('briefingScriptIntro', { date: dateStr || (lang === 'en' ? 'today' : 'oggi'), n });
    const body = items
      .map((it, i) => {
        const item = t('briefingScriptItem', { n: i + 1, cat: categoryName(it.category), title: it.title });
        const sum = plainSpokenText(it.summary);
        return sum ? `${item} ${sum}` : item;
      })
      .join(' ');
    return `${intro} ${body} ${t('briefingScriptOutro')}`;
  }, [items, dateStr, lang, t, categoryName]);

  const chunks = useMemo(() => {
    const raw = plainSpokenText(script);
    if (!raw) return [];
    const parts = raw.match(/[^.!?;:]+[.!?;:]*/g) || [raw];
    const out: string[] = [];
    let buf = '';
    for (const p of parts) {
      if ((buf + p).length > 220 && buf) {
        out.push(buf.trim());
        buf = p;
      } else {
        buf += p;
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }, [script]);

  const togglePause = useCallback(() => {
    try {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
    } catch {
      /* noop */
    }
  }, [paused]);

  const cycleRate = useCallback(() => {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    if (speakingRef.current) speakFrom(idxRef.current, RATES[next], chunks);
  }, [rateIdx, speaking, speakFrom, chunks]);

  // Word-count based duration estimate (≈150 wpm at 1x)
  const estMin = useMemo(() => {
    const words = chunks.join(' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / (150 * RATES[rateIdx])));
  }, [chunks, rateIdx]);

  if (items.length === 0) return null;

  return (
    <section
      aria-label={t('briefingKicker')}
      className="overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/15 dark:via-teal-500/15 dark:to-cyan-500/15"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
            {speaking && !paused ? (
              <div className="flex h-7 items-end gap-1" aria-hidden>
                {[45, 85, 60, 95].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 animate-pulse rounded-full bg-white"
                    style={{ height: `${h}%`, animationDelay: `${i * 130}ms` }}
                  />
                ))}
              </div>
            ) : (
              <AudioLines className="h-7 w-7" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3.5 w-3.5" aria-hidden /> {t('briefingKicker')}
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight sm:text-xl">{t('briefingTitle')}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {speaking
                ? paused
                  ? t('briefingPaused')
                  : t('briefingPlaying')
                : `${t('briefingStories', { n: items.length })} · ${t('briefingEst', { n: estMin })} · ${t('briefingUpdated')}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          {!speaking ? (
            <Button
              onClick={() => speakFrom(0, RATES[rateIdx], chunks)}
              className="h-12 gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-white shadow-md hover:opacity-90"
              aria-label={t('briefingPlay')}
            >
              <Play className="h-5 w-5 fill-current" aria-hidden />
              <span className="text-sm font-bold">{t('briefingPlay')}</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={togglePause}
                aria-label={paused ? t('briefingResume') : t('briefingPause')}
              >
                {paused ? <Play className="h-5 w-5 text-emerald-500" aria-hidden /> : <Pause className="h-5 w-5 text-amber-500" aria-hidden />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={stopSpeech}
                aria-label={t('briefingStop')}
              >
                <Square className="h-4 w-4 text-red-500" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-3 text-xs font-semibold"
                onClick={cycleRate}
                aria-label={t('briefingSpeed')}
              >
                {RATES[rateIdx]}x
              </Button>
            </>
          )}
        </div>
      </div>

      {speaking ? (
        <div className="px-5 pb-4 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">{pct}%</p>
        </div>
      ) : (
        <ol className="divide-y border-t px-5 py-2 sm:px-6">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-baseline gap-2.5 py-1.5 text-sm">
              <span className="shrink-0 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{i + 1}.</span>
              <span className="truncate text-foreground/85">{it.title}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
