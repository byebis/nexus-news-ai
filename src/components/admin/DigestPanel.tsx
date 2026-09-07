'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Send, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { WeeklyDigest } from '@/lib/store';

interface DigestAgentRow {
  id: string;
  name: string;
  avatar: string;
  category: string;
  weekCount: number;
}

/**
 * DigestPanel — admin tab "Digest settimanale":
 * per-agent weekly article counts, generate threads, send to Telegram.
 */
export default function DigestPanel() {
  const { toast } = useToast();
  const [digests, setDigests] = useState<WeeklyDigest[]>([]);
  const [agents, setAgents] = useState<DigestAgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/digests');
      const data = await res.json();
      if (Array.isArray(data?.digests)) setDigests(data.digests);
      if (Array.isArray(data?.agents)) setAgents(data.agents);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (agentId: string) => {
    setGenerating(agentId);
    try {
      const res = await fetch('/api/digests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Generazione fallita', description: data?.error, variant: 'destructive' });
      } else {
        const failed: string[] = Array.isArray(data?.failed) ? data.failed : [];
        toast({
          title: 'Digest generato ✓',
          description: failed.length > 0
            ? `Alcuni agenti hanno fallito: ${failed.join('; ')}`
            : 'Thread editoriale creato e salvato.',
          variant: failed.length > 0 ? 'destructive' : 'default',
        });
        await load();
      }
    } catch {
      toast({ title: 'Errore di rete', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const sendTelegram = async (digestId: string) => {
    setSending(digestId);
    try {
      const res = await fetch('/api/digests/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Invio fallito', description: data?.error, variant: 'destructive' });
      } else {
        toast({ title: 'Thread inviato su Telegram ✓', description: `${data?.sent} messaggi inviati.` });
        await load();
      }
    } catch {
      toast({ title: 'Errore di rete', variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Caricamento digest…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agents with weekly counts */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Agenti e articoli della settimana</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <span className="text-xl">{a.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.category}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  variant="secondary"
                  className={
                    a.weekCount > 0
                      ? 'border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'border-0'
                  }
                >
                  {a.weekCount} articoli
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-[11px]"
                  disabled={a.weekCount === 0 || generating !== null}
                  onClick={() => generate(a.id)}
                >
                  {generating === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Genera
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated digests */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Digest generati</h3>
        {digests.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nessun digest generato. Premi «Genera» su un agente con articoli pubblicati questa settimana.
          </p>
        ) : (
          <div className="space-y-3">
            {digests.map((d) => (
              <div key={d.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{d.agent?.avatar || '🤖'}</span>
                  <span className="text-sm font-semibold">{d.title}</span>
                  <Badge variant="secondary" className="border-0 text-[10px]">
                    {d.agent?.name}
                  </Badge>
                  <Badge variant="secondary" className="border-0 text-[10px]">
                    settimana del {new Date(d.weekStart).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </Badge>
                  <Badge variant="secondary" className="border-0 text-[10px]">
                    {d.articleCount} articoli
                  </Badge>
                  {d.sentChannels?.includes('telegram') && (
                    <Badge className="border-0 bg-sky-100 text-[10px] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" variant="secondary">
                      Telegram ✓
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-7 gap-1 px-2 text-[11px]"
                    disabled={sending === d.id}
                    onClick={() => sendTelegram(d.id)}
                  >
                    {sending === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Invia a Telegram
                  </Button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {(d.content || '').split(/\n\n+/).filter(Boolean).map((p, i) => (
                    <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="mr-1 font-bold text-foreground/70">{i + 1}.</span>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
