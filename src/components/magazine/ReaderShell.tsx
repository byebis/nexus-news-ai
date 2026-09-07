'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, Type, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  /** Plain text of the article, used for speech synthesis */
  text: string;
  children: React.ReactNode;
}

const SIZES = [
  { label: 'A', scale: 0.95, px: 'text-[0.95rem]' },
  { label: 'A', scale: 1, px: 'text-[1.05rem]' },
  { label: 'A', scale: 1.15, px: 'text-[1.15rem]' },
  { label: 'A', scale: 1.3, px: 'text-[1.3rem]' },
];

/**
 * ReaderShell — premium reading experience:
 * 1. Fixed reading-progress bar (top of viewport)
 * 2. "Ascolta" TTS via SpeechSynthesis (it-IT voice, sentence chunking)
 * 3. Text size controls (4 steps)
 */
export default function ReaderShell({ text, children }: Props) {
  const { toast } = useToast();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTools, setShowTools] = useState(false);

  // --- TTS state ---
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [spokenPct, setSpokenPct] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);
  const RATES = [1, 1.25, 1.5];
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const idxRef = useRef(0);
  const speakingRef = useRef(false);

  const sentences = useMemo(() => {
    // Split into ~220 char sentence chunks for reliable sequential speech
    const raw = text.replace(/\s+/g, ' ').trim();
    if (!raw) return [];
    const parts = raw.match(/[^.!?;:]+[.!?;:]*/g) || [raw];
    const chunks: string[] = [];
    let buf = '';
    for (const p of parts) {
      if ((buf + p).length > 220 && buf) {
        chunks.push(buf.trim());
        buf = p;
      } else {
        buf += p;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
  }, [text]);

  const stopSpeech = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
    } catch { /* noop */ }
    queueRef.current = [];
    idxRef.current = 0;
    speakingRef.current = false;
    setSpeaking(false);
    setPaused(false);
    setSpokenPct(0);
  }, []);

  const startSpeech = useCallback(() => {
    if (sentences.length === 0) return;
    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const itVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('it'));
      const rate = RATES[rateIdx];
      const queue = sentences.map((s, i) => {
        const u = new SpeechSynthesisUtterance(s);
        u.lang = 'it-IT';
        if (itVoice) u.voice = itVoice;
        u.rate = rate;
        u.pitch = 1;
        u.onend = () => {
          idxRef.current = i + 1;
          setSpokenPct(Math.round(((i + 1) / sentences.length) * 100));
          if (i + 1 >= sentences.length) stopSpeech();
        };
        u.onerror = () => stopSpeech();
        return u;
      });
      queueRef.current = queue;
      idxRef.current = 0;
      setSpokenPct(0);
      setSpeaking(true);
      setPaused(false);
      speakingRef.current = true;
      queue.forEach((u) => window.speechSynthesis.speak(u));
      // Guard: some environments (headless, blocked audio) silently drop speech
      setTimeout(() => {
        try {
          if (speakingRef.current && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            stopSpeech();
            toast({
              title: 'Voce non disponibile qui',
              description: 'Questo browser/ambiente non espone voci vocali. Prova da Chrome, Edge o Safari desktop/mobile.',
              variant: 'destructive',
            });
          }
        } catch { /* noop */ }
      }, 1200);
    } catch {
      toast({ title: 'Voce non disponibile', description: 'Il browser non supporta la sintesi vocale', variant: 'destructive' });
    }
  }, [sentences, rateIdx, stopSpeech, toast]);

  const togglePause = useCallback(() => {
    try {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
    } catch { /* noop */ }
  }, [paused]);

  // Cleanup on unmount
  useEffect(() => () => stopSpeech(), [stopSpeech]);

  // Reading progress: based on article body bounds
  useEffect(() => {
    const onScroll = () => {
      const el = bodyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.5;
      const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.5, 0), Math.max(total, 1));
      setScrollPct(Math.round((done / Math.max(total, 1)) * 100));
      setShowTools(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const size = SIZES[sizeIdx];

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 transition-[width] duration-150"
          style={{ width: `${scrollPct}%` }}
          aria-hidden
        />
      </div>

      {/* Floating toolbar (appears after scrolling into the article) */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showTools ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 rounded-full border bg-background/90 backdrop-blur-md shadow-lg px-2 py-1.5">
          {/* TTS controls */}
          {!speaking ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 rounded-full px-3"
              onClick={startSpeech}
              disabled={sentences.length === 0}
              aria-label="Ascolta l'articolo"
            >
              <Volume2 className="h-4 w-4 text-teal-500" />
              <span className="text-xs font-medium">Ascolta</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                onClick={togglePause}
                aria-label={paused ? 'Riprendi lettura' : 'Pausa lettura'}
              >
                {paused ? <Play className="h-4 w-4 text-emerald-500" /> : <Pause className="h-4 w-4 text-amber-500" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                onClick={stopSpeech}
                aria-label="Ferma lettura"
              >
                <Square className="h-3.5 w-3.5 text-red-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2 gap-1"
                onClick={() => {
                  const next = (rateIdx + 1) % RATES.length;
                  const wasSpeaking = speaking;
                  setRateIdx(next);
                  if (wasSpeaking) {
                    // restart at new rate keeping position
                    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
                    setTimeout(() => {
                      const voices = window.speechSynthesis.getVoices();
                      const itVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('it'));
                      const rate = RATES[next];
                      setSpeaking(true); setPaused(false);
                      for (let i = idxRef.current; i < sentences.length; i++) {
                        const u = new SpeechSynthesisUtterance(sentences[i]);
                        u.lang = 'it-IT';
                        if (itVoice) u.voice = itVoice;
                        u.rate = rate;
                        u.onend = () => {
                          setSpokenPct(Math.round(((i + 1) / sentences.length) * 100));
                          if (i + 1 >= sentences.length) stopSpeech();
                        };
                        u.onerror = () => stopSpeech();
                        window.speechSynthesis.speak(u);
                      }
                    }, 120);
                  }
                }}
                aria-label="Cambia velocità"
              >
                <span className="text-[11px] font-semibold text-muted-foreground">{RATES[rateIdx]}x</span>
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-center">
                {spokenPct}%
              </span>
            </>
          )}

          <div className="h-5 w-px bg-border mx-0.5" />

          {/* Text size */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-2 gap-0.5"
            onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
            disabled={sizeIdx === 0}
            aria-label="Diminuisci testo"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="text-[10px]">-</span>
          </Button>
          <span className="text-[10px] text-muted-foreground w-7 text-center">{sizeIdx + 1}/4</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-2 gap-0.5"
            onClick={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))}
            disabled={sizeIdx === SIZES.length - 1}
            aria-label="Aumenta testo"
          >
            <Type className="h-4 w-4" />
            <span className="text-xs">+</span>
          </Button>
        </div>
      </div>

      {/* Article body with adjustable size */}
      <div ref={bodyRef} style={{ fontSize: `${size.scale}rem` }}>
        {children}
      </div>
    </>
  );
}
