'use client';

import { motion } from 'framer-motion';
import { RefreshCw, Pause, Play, Loader2, Clock, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { updateAgent } from '@/lib/api';
import type { Agent } from '@/lib/store';

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  active: { label: 'Attivo', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', dotColor: 'bg-emerald-500' },
  paused: { label: 'In Pausa', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', dotColor: 'bg-amber-500' },
  error: { label: 'Errore', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', dotColor: 'bg-red-500' },
};

function formatLastRun(dateStr: string | null): string {
  if (!dateStr) return 'Mai';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Adesso';
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.floor(hours / 24);
  return `${days} giorni fa`;
}

interface AgentCardProps {
  agent: Agent;
  index: number;
}

function AgentCard({ agent, index }: AgentCardProps) {
  const { loadingCollect, setLoadingCollect, setAgents } = useNexusStore();
  const { toast } = useToast();
  const isLoading = loadingCollect === agent.id;
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.paused;
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState('');

  // Elapsed timer + live phase from activity logs while collecting
  useEffect(() => {
    if (!isLoading) { setElapsed(0); setPhase(''); return; }
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/activity?limit=3');
        if (res.ok) {
          const logs = await res.json();
          const list = Array.isArray(logs) ? logs : logs.logs || [];
          const mine = list.find((l: { agent_id?: string }) => l.agent_id === agent.id);
          if (mine?.detail) setPhase(mine.detail);
        }
      } catch { /* ignore poll errors */ }
    }, 4000);
    return () => { clearInterval(timer); clearInterval(poll); };
  }, [isLoading, agent.id]);

  const handleCollect = async () => {
    setLoadingCollect(agent.id);
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
        signal: AbortSignal.timeout(280_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Errore ${res.status}`);
      }
      const created = data.created ?? 0;
      const evaluated = data.evaluated ?? 0;
      toast({
        title: created > 0 ? `${created} articoli generati` : 'Raccolta completata',
        description: created > 0
          ? `${agent.name}: ${evaluated} notizie valutate, ${created} articoli pronti${data.mode === 'semi_autonomous' ? ' (in coda approvazione)' : ''}`
          : `${agent.name}: nessuna notizia abbastanza rilevante oggi. Riprova più tardi.`,
        variant: created > 0 ? 'default' : 'default',
      });
      // refresh agent last_run locally
      setAgents(useNexusStore.getState().agents.map((a) =>
        a.id === agent.id ? { ...a, lastRun: new Date().toISOString() } : a
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossibile avviare la raccolta';
      toast({
        title: 'Errore',
        description: msg.startsWith('LOCK:') ? msg.replace('LOCK: ', '') : msg.slice(0, 140),
        variant: 'destructive',
      });
    } finally {
      setLoadingCollect(null);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    try {
      await updateAgent(agent.id, { status: newStatus });
      setAgents(useNexusStore.getState().agents.map((a) =>
        a.id === agent.id ? { ...a, status: newStatus } : a
      ));
      toast({ title: 'Stato aggiornato', description: `${agent.name} è ora ${newStatus === 'active' ? 'attivo' : 'in pausa'}`, variant: 'default' });
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-xl border bg-card p-4 sm:p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
            {agent.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.category}</p>
          </div>
        </div>
        <Badge className={`${statusConfig.color} border-0 text-xs gap-1`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {agent.description}
      </p>

      {/* Personality */}
      <div className="text-xs">
        <span className="text-muted-foreground">Stile: </span>
        <span className="font-medium italic">{agent.personality}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span>{agent._count?.articles || 0} articoli</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatLastRun(agent.lastRun)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCollect}
            disabled={isLoading || agent.status === 'paused'}
            className="flex-1 gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isLoading ? `Lavoro in corso... ${elapsed}s` : 'Raccogli Notizie'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleStatus}
            className="gap-1.5"
          >
            {agent.status === 'active' ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {isLoading && phase && (
          <p className="text-[11px] text-muted-foreground truncate" title={phase}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            {phase}
          </p>
        )}
        {isLoading && !phase && (
          <p className="text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            Raccolta notizie reali da fonti RSS + scrittura AI (di solito 40-90s)
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentManager() {
  const { agents } = useNexusStore();
  const { toast } = useToast();
  const [runningAll, setRunningAll] = useState(false);

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const res = await fetch('/api/collect-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(590_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
      const created = data.created ?? 0;
      const ran = data.ran ?? 0;
      toast({
        title: created > 0 ? `Redazione completata: ${created} nuovi articoli` : 'Redazione completata',
        description: created > 0
          ? `${ran} agenti hanno lavorato. Gli articoli sono in coda d'approvazione.`
          : `${ran} agenti hanno lavorato, nessuna notizia abbastanza rilevante ora.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Esecuzione fallita';
      toast({ title: 'Errore', description: msg.slice(0, 140), variant: 'destructive' });
    } finally {
      setRunningAll(false);
    }
  };

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <RefreshCw className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessun agente configurato</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Inizializza il database per creare gli agenti AI predefiniti.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {agents.filter((a) => a.status === 'active' && a.category !== 'redazione').length} agenti attivi su {agents.filter((a) => a.category !== 'redazione').length}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRunAll}
          disabled={runningAll}
          className="gap-1.5"
        >
          {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {runningAll ? 'Redazione al lavoro...' : 'Esegui Tutti gli Agenti'}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents
          .filter((a) => a.category !== 'redazione')
          .map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}