'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Send,
  Link2,
  MessageSquare,
  Linkedin,
  Camera,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Loader2,
  Megaphone,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore, type ChannelConfig, type Article } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { fetchApprovedArticles } from '@/lib/api';

const PLATFORMS = [
  { key: 'blog', label: 'Blog', icon: Globe },
  { key: 'telegram', label: 'Telegram', icon: Send },
  { key: 'webhook', label: 'Webhook', icon: Link2 },
  { key: 'twitter', label: 'X/Twitter', icon: MessageSquare },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'instagram', label: 'Instagram', icon: Camera },
  { key: 'facebook', label: 'Facebook', icon: ThumbsUp },
] as const;

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label])
);

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  tecnologia: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  politica: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  economia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  scienza: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  sport: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cultura: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  salute: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
};

function PlatformStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'published':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'skipped':
      return <MinusCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function PlatformStatusLabel({ status }: { status: string }) {
  switch (status) {
    case 'published':
      return <span className="text-emerald-600 dark:text-emerald-400 text-xs">Pubblicato</span>;
    case 'failed':
      return <span className="text-red-600 dark:text-red-400 text-xs">Fallito</span>;
    case 'skipped':
      return <span className="text-amber-600 dark:text-amber-400 text-xs">Non configurato</span>;
    default:
      return <span className="text-muted-foreground text-xs">In attesa</span>;
  }
}

function PublishingCard({
  article,
  channels,
  onPublished,
}: {
  article: Article;
  channels: ChannelConfig[];
  onPublished: () => void;
}) {
  const { loadingPublish, setLoadingPublish } = useNexusStore();
  const isLoading = loadingPublish === article.id;

  // Selezione canali: default blog + tutti i canali attivi
  const [selected, setSelected] = useState<Set<string>>(new Set(['blog']));
  const [results, setResults] = useState<Record<string, { status: string; detail: string }>>({});

  useEffect(() => {
    const defaults = new Set<string>(['blog']);
    for (const ch of channels) {
      if (ch.enabled && ch.channel !== 'blog') defaults.add(ch.channel);
    }
    setSelected(defaults);
  }, [channels]);

  const categoryLower = article.category?.toLowerCase() || 'tecnologia';
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;

  // Stato per-platform da publishLogs + risultati locali
  const platformStatuses: Record<string, string> = {};
  if (article.publishLogs) {
    for (const log of article.publishLogs) {
      if (!platformStatuses[log.platform] || log.status === 'published') {
        platformStatuses[log.platform] = log.status;
      }
    }
  }
  for (const [platform, result] of Object.entries(results)) {
    platformStatuses[platform] = result.status;
  }
  const platformDetails = { ...platformStatuses, ...Object.fromEntries(Object.entries(results).map(([p, r]) => [p, r.detail])) };

  const channelEnabled = (key: string) => {
    if (key === 'blog') return true;
    const ch = channels.find((c) => c.channel === key);
    return !!ch?.enabled;
  };

  const allSelectedPublished = PLATFORMS.every(
    (p) => !selected.has(p.key) || platformStatuses[p.key] === 'published'
  );

  const toggleChannel = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePublish = async () => {
    const platforms = Array.from(selected);
    if (platforms.length === 0) {
      toast({ title: 'Nessun canale selezionato', description: 'Seleziona almeno un canale.', variant: 'destructive' });
      return;
    }
    setLoadingPublish(article.id);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, platforms }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Pubblicazione fallita', variant: 'destructive' });
        return;
      }

      // Mostra risultati per canale
      const resultMap: Record<string, { status: string; detail: string }> = {};
      for (const r of data.results || []) resultMap[r.platform] = { status: r.status, detail: r.detail };
      setResults((prev) => ({ ...prev, ...resultMap }));

      const pub = (data.results || []).filter((r: { status: string }) => r.status === 'published');
      const skipped = (data.results || []).filter((r: { status: string }) => r.status === 'skipped');
      const failed = (data.results || []).filter((r: { status: string }) => r.status === 'failed');

      const parts = [`${pub.length} pubblicat${pub.length === 1 ? 'o' : 'i'}`];
      if (skipped.length > 0) parts.push(`${skipped.length} non configurat${skipped.length === 1 ? 'o' : 'i'}`);
      if (failed.length > 0) parts.push(`${failed.length} fallit${failed.length === 1 ? 'o' : 'i'}`);

      toast({
        title: pub.length > 0 ? '📰 Pubblicazione completata' : 'Nessun canale pubblicato',
        description: `Su ${platforms.length} canali selezionati: ${parts.join(', ')}.` +
          (skipped.length > 0 ? ' Configura i canali mancanti nella tab Canali.' : ''),
        variant: pub.length > 0 ? 'default' : 'destructive',
      });
      onPublished();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile avviare la pubblicazione.', variant: 'destructive' });
    } finally {
      setLoadingPublish(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className={`${badgeClass} border-0 text-xs`}>{article.category}</Badge>
            {article.status === 'published' && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs">
                Pubblicato
              </Badge>
            )}
            {article.status === 'approved' && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-xs">
                Approvato
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{article.title}</h3>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0 mt-1" />}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {article.agent?.name || 'AI Agent'}
        </div>
        {article.publishedAt && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.publishedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>

      {/* Selettore canali */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          Canali da pubblicare ({selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isEnabled = channelEnabled(platform.key);
            const isSelected = selected.has(platform.key);
            return (
              <button
                key={platform.key}
                type="button"
                onClick={() => toggleChannel(platform.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-transparent bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-sm'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
                title={isEnabled ? `${PLATFORM_LABELS[platform.key]} configurato` : `${PLATFORM_LABELS[platform.key]} non configurato — vai alla tab Canali`}
              >
                <Icon className="h-3.5 w-3.5" />
                {platform.label}
                {!isEnabled && (
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-amber-500'}`}>⚙︎</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stato canali */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLATFORMS.map((platform) => {
          const status = platformStatuses[platform.key] || 'pending';
          const Icon = platform.icon;
          return (
            <div key={platform.key} className="flex items-center gap-2 rounded-lg border px-2.5 py-2" title={typeof platformDetails[platform.key] === 'string' ? platformDetails[platform.key] : undefined}>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate">{platform.label}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <PlatformStatusIcon status={status} />
                  <PlatformStatusLabel status={status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottone pubblica */}
      {!allSelectedPublished ? (
        <Button size="sm" onClick={handlePublish} disabled={isLoading || selected.size === 0} className="w-full gap-1.5">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
          Pubblica su {selected.size} {selected.size === 1 ? 'canale selezionato' : 'canali selezionati'}
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pubblicato su tutti i canali selezionati
        </div>
      )}
    </motion.div>
  );
}

export default function PublishingPanel() {
  const [approvedArticles, setApprovedArticles] = useState<Article[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesData, channelsRes] = await Promise.all([
        fetchApprovedArticles(),
        fetch('/api/channels').then((r) => (r.ok ? r.json() : { channels: [] })).catch(() => ({ channels: [] })),
      ]);
      setApprovedArticles(Array.isArray(articlesData) ? articlesData : []);
      setChannels(channelsRes.channels || []);
    } catch {
      // silenzioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Caricamento…</span>
      </div>
    );
  }

  if (approvedArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Send className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessun articolo da pubblicare</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Approva articoli dalla coda di approvazione per vederli qui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {approvedArticles.length} articol{approvedArticles.length !== 1 ? 'i' : 'o'} pront{approvedArticles.length !== 1 ? 'i' : 'o'} per la pubblicazione. Seleziona i canali per ogni articolo: puoi pubblicare solo dove vuoi.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {approvedArticles.map((article) => (
          <PublishingCard
            key={article.id}
            article={article}
            channels={channels}
            onPublished={loadData}
          />
        ))}
      </div>
    </div>
  );
}
