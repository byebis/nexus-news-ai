'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Database, BrainCircuit, Rss, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CheckResult {
  ok: boolean;
  detail: string;
  ms: number;
}

interface HealthData {
  status: 'ok' | 'degraded';
  checks: Record<string, CheckResult>;
  timestamp: string;
}

const SERVICE_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  supabase: {
    label: 'Database Supabase',
    icon: <Database className="h-5 w-5" />,
    desc: 'Archivio articoli, agenti, log attività',
  },
  openrouter: {
    label: 'Motore AI (OpenRouter)',
    icon: <BrainCircuit className="h-5 w-5" />,
    desc: 'Chiave API per generazione articoli',
  },
  rss: {
    label: 'Fonti RSS (ANSA / INAF)',
    icon: <Rss className="h-5 w-5" />,
    desc: 'Notizie reali per la redazione AI',
  },
};

export default function HealthPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(35_000) });
      const json = await res.json();
      setData(json);
      setLastCheck(new Date());
    } catch {
      setData({
        status: 'degraded',
        checks: {},
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [check]);

  const allOk = data?.status === 'ok';
  const checkEntries = Object.entries(data?.checks || {});

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {loading && !data ? (
            <Badge variant="outline" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Verifica in corso...
            </Badge>
          ) : allOk ? (
            <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tutto operativo
            </Badge>
          ) : (
            <Badge className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">
              <XCircle className="h-3.5 w-3.5" /> Servizio degradato
            </Badge>
          )}
          {lastCheck && (
            <span className="text-xs text-muted-foreground">
              Ultimo controllo: {lastCheck.toLocaleTimeString('it-IT')}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={check} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Ricontrolla ora
        </Button>
      </div>

      {/* Service cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const c = data?.checks?.[key];
          const ok = c?.ok;
          const unknown = !c;
          return (
            <div key={key} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    unknown ? 'bg-muted text-muted-foreground' : ok ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{meta.label}</h3>
                    <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                  </div>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${
                    unknown ? 'bg-zinc-400 animate-pulse' : ok ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  title={unknown ? 'verifica...' : ok ? 'ok' : 'errore'}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={unknown ? 'text-muted-foreground' : ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {unknown ? 'in verifica...' : ok ? 'Operativo' : 'Problema rilevato'}
                </span>
                {c && c.ms > 0 && (
                  <span className="text-muted-foreground tabular-nums">{c.ms} ms</span>
                )}
              </div>
              {c && (
                <p className="text-[11px] text-muted-foreground break-words line-clamp-2" title={c.detail}>
                  {c.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto-refresh note */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        Monitoraggio automatico ogni 30 secondi. La verifica RSS scarica un feed reale da ANSA.
      </p>
    </div>
  );
}
