'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Loader2, Network, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { WireRunResult } from '@/lib/wire-engine';

interface RunSummary {
  id: string;
  status: string;
  createdAt: string;
  data: {
    topic: string;
    status: string;
    sources?: { title: string; source: string; url: string }[];
    articleId?: string;
    reviewScore?: number;
    error?: string;
    title?: string;
  };
}

const PHASES = [
  'Lettura delle fonti in arrivo…',
  'Gli agenti stanno scegliendo le 3-5 fonti migliori…',
  'Ricercatore al lavoro sul dossier…',
  'Redattore capo sta scrivendo la bozza…',
  'Due revisori stanno valutando la bozza…',
  'Editor responsabile sta fondendo le revisioni…',
  'Invio in coda di approvazione…',
];

const TOPIC_IDEAS = [
  'Intelligenza artificiale e lavoro',
  'Transizione energetica in Europa',
  'Elezioni e politica digitale',
  'Missione lunare Artemis',
  'Economia: tassi e inflazione',
  'Nuove terapie nel settore salute',
];

export default function WirePanel() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [loadingState, setLoadingState] = useState(true);
  const [topic, setTopic] = useState('');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [result, setResult] = useState<WireRunResult | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);

  const loadState = useCallback(async () => {
    setLoadingState(true);
    try {
      const res = await fetch('/api/wire/runs');
      const data = await res.json();
      setEnabled(data.enabled !== false);
      setRuns(Array.isArray(data.runs) ? data.runs.slice(0, 10) : []);
    } catch {
      // silent
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(loadState, 0);
    return () => clearTimeout(id);
  }, [loadState]);

  // Progress animation while running (the pipeline takes 1-3 minutes)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, 18000);
    return () => clearInterval(id);
  }, [running]);

  const toggleEnabled = async (on: boolean) => {
    setEnabled(on);
    try {
      // Il toggle passa da un endpoint dedicato che salva l'impostazione
      const res = await fetch('/api/wire/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: on }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: on ? 'Nexus Wire attivato' : 'Nexus Wire disattivato',
        description: on
          ? 'Il portale /wire è visibile al pubblico.'
          : 'Il portale /wire è nascosto al pubblico.',
      });
    } catch {
      setEnabled(!on);
      toast({ title: 'Errore', description: 'Impossibile salvare l’impostazione', variant: 'destructive' });
    }
  };

  const startRun = async () => {
    if (topic.trim().length < 3 || running) return;
    setRunning(true);
    setPhaseIdx(0);
    setResult(null);
    try {
      const res = await fetch('/api/wire/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Redazione interrotta', description: data.error || 'Errore sconosciuto', variant: 'destructive' });
      } else {
        setResult(data as WireRunResult);
        toast({
          title: 'Edizione completata!',
          description: `"${data.title}" è in coda di approvazione (qualità ${data.reviewScore}%).`,
        });
        setTopic('');
      }
    } catch {
      toast({ title: 'Errore di rete', description: 'Riprova tra poco', variant: 'destructive' });
    } finally {
      setRunning(false);
      loadState();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + toggle */}
      <div className="flex items-start justify-between gap-4 rounded-xl border bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Network className="h-5 w-5 text-violet-500" /> Nexus Wire — Redazione Collettiva
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Gli agenti producono insieme la migliore notizia: almeno 3 fonti lette, dossier, bozza, due revisioni
            incrociate e editor finale. Il risultato arriva nella tua coda di approvazione.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Switch checked={enabled} onCheckedChange={toggleEnabled} disabled={loadingState} aria-label="Attiva Nexus Wire" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{enabled ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Start new run */}
      <div className="rounded-xl border p-5">
        <h3 className="font-semibold">Nuova edizione</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Scrivi l’argomento da coprire: gli agenti leggeranno almeno 3 articoli diversi prima di scrivere.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Es. Regolamento europeo sull'intelligenza artificiale"
            maxLength={120}
            disabled={running || !enabled}
            onKeyDown={(e) => e.key === 'Enter' && startRun()}
          />
          <Button
            onClick={startRun}
            disabled={running || !enabled || topic.trim().length < 3}
            className="shrink-0 gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:opacity-90"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Redazione in corso…' : 'Avvia la redazione'}
          </Button>
        </div>

        {!running && !result && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TOPIC_IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => setTopic(idea)}
                disabled={!enabled}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {running && (
          <div className="mt-4 space-y-2 rounded-lg border bg-muted/40 p-4">
            {PHASES.map((p, i) => (
              <p
                key={p}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  i < phaseIdx ? 'opacity-40' : i === phaseIdx ? 'opacity-100 font-medium' : 'opacity-25'
                }`}
              >
                {i < phaseIdx ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : i === phaseIdx ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/40" />
                )}
                {p}
              </p>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              La redazione collettiva impiega 1-3 minuti: non chiudere questa pagina.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" /> Edizione completata: “{result.title}”
            </p>
            <p className="text-sm text-muted-foreground">
              {result.sources.length} fonti · qualità media {result.reviewScore}% (revisioni: {result.scores.join(', ') || '—'}) ·
              agenti: {result.agents.map((a) => `${a.name} (${a.role})`).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground">Modelli usati: {result.models.join(', ')}</p>
            <div className="flex gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin" onClick={() => undefined}>
                  Vai alla coda di approvazione
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="/wire" target="_blank" rel="noopener noreferrer">
                  Vedi nel portale Wire <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-xl border p-5">
        <h3 className="font-semibold">Storico edizioni</h3>
        {runs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nessuna edizione ancora: avvia la prima redazione collettiva.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.data.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {r.data.sources ? ` · ${r.data.sources.length} fonti` : ''}
                    {typeof r.data.reviewScore === 'number' ? ` · qualità ${r.data.reviewScore}%` : ''}
                    {r.data.error ? ` · ${r.data.error}` : ''}
                  </p>
                </div>
                {r.data.status === 'completed' ? (
                  <Badge className="shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Completata
                  </Badge>
                ) : r.data.status === 'failed' ? (
                  <Badge variant="destructive" className="shrink-0 gap-1">
                    <XCircle className="h-3 w-3" /> Fallita
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> In corso
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
