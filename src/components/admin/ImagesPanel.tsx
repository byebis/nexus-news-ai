'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ImageIcon, Wand2, RefreshCw, Camera, Archive, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ImageStats {
  total: number;
  withPhoto: number;
  missing: number;
  coverage: number;
  next: Array<{ id: string; title: string; category: string; source: string }>;
}

interface BackfillResult {
  id: string;
  title: string;
  origin?: string;
  credit?: string;
  error?: string;
}

const ORIGIN_BADGE: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  originale: { label: 'Originale fonte', icon: <Camera className="h-3 w-3" />, class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  archivio: { label: 'Archivio CC', icon: <Archive className="h-3 w-3" />, class: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  ai: { label: 'Illustrazione AI', icon: <Sparkles className="h-3 w-3" />, class: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

/**
 * ImagesPanel — tab "Immagini": copertura fotografica della testata
 * e backfill automatico (foto originale -> og:image -> archivi CC -> AI).
 */
export default function ImagesPanel() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResults, setLastResults] = useState<BackfillResult[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/images/backfill');
      const data = await res.json();
      if (typeof data?.total === 'number') setStats(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runBackfill = async () => {
    setRunning(true);
    setLastResults([]);
    try {
      const res = await fetch('/api/images/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Backfill fallito', description: data?.error, variant: 'destructive' });
      } else {
        setLastResults(Array.isArray(data?.results) ? data.results : []);
        const ok = data?.updated ?? 0;
        toast({
          title: `${ok} immagini trovate su ${data?.processed ?? 0} articoli`,
          description: 'Rilancia per continuare con gli articoli rimanenti.',
        });
        await load();
      }
    } catch {
      toast({ title: 'Errore di rete', variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Caricamento statistiche immagini…
      </div>
    );
  }

  const coverage = stats?.coverage ?? 0;

  return (
    <div className="space-y-6">
      {/* Coverage card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">Copertura fotografica</h3>
              <p className="text-xs text-muted-foreground">
                {stats?.withPhoto ?? 0} di {stats?.total ?? 0} articoli con foto — ogni pezzo merita la sua immagine
              </p>
            </div>
          </div>
          <Button onClick={runBackfill} disabled={running || (stats?.missing ?? 0) === 0} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {running ? 'Cerco immagini… (fino a 1 min)' : 'Completa immagini mancanti'}
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Copertura</span>
            <span className="font-semibold text-foreground">{coverage}%</span>
          </div>
          <Progress value={coverage} className="h-2" />
        </div>

        {(stats?.missing ?? 0) > 0 && (
          <div className="mt-4 rounded-lg border border-dashed p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Prossimi articoli senza foto ({stats?.missing} totali):
            </p>
            <ul className="space-y-1">
              {(stats?.next || []).slice(0, 5).map((n) => (
                <li key={n.id} className="truncate text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{n.category}</span> · {n.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(stats?.missing ?? 0) === 0 && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Tutti gli articoli hanno la loro immagine. 🎉
          </p>
        )}
      </div>

      {/* Last run results */}
      {lastResults.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Risultato ultimo completamento</h3>
            <Button variant="ghost" size="sm" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" /> Aggiorna
            </Button>
          </div>
          <div className="space-y-2">
            {lastResults.map((r) => {
              const badge = r.origin ? ORIGIN_BADGE[r.origin] : null;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    {r.credit && <p className="truncate text-xs text-muted-foreground">{r.credit}</p>}
                    {r.error && <p className="truncate text-xs text-red-500">{r.error}</p>}
                  </div>
                  {badge ? (
                    <Badge variant="secondary" className={`shrink-0 gap-1 ${badge.class}`}>
                      {badge.icon} {badge.label}
                    </Badge>
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
        <h4 className="mb-2 font-semibold text-foreground">Come sceglie l'immagine</h4>
        <ol className="list-inside list-decimal space-y-1">
          <li><span className="font-medium text-foreground">Foto originale</span> allegata alla notizia della fonte (ANSA/INAF)</li>
          <li><span className="font-medium text-foreground">og:image</span> della pagina originale dell'articolo</li>
          <li><span className="font-medium text-foreground">Archivi liberi</span> Openverse e Wikimedia Commons (foto CC con credit)</li>
          <li><span className="font-medium text-foreground">Illustrazione AI</span> editoriale generata su misura (deterministica)</li>
        </ol>
        <p className="mt-2 text-xs">
          Ogni immagine viene verificata (HTTP, formato) e mostra sempre la creditizzazione con link alla fonte.
          Se nulla viene trovato, resta la copertina generativa d'autore.
        </p>
      </div>
    </div>
  );
}
