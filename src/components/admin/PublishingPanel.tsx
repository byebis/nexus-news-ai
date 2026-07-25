'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  MessageSquare,
  Linkedin,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Send,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { fetchApprovedArticles, publishArticle } from '@/lib/api';
import type { Article } from '@/lib/store';

const PLATFORMS = [
  { key: 'blog', label: 'Blog', icon: Globe },
  { key: 'twitter', label: 'Twitter/X', icon: MessageSquare },
  { key: 'facebook', label: 'Facebook', icon: MessageSquare },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'instagram', label: 'Instagram', icon: Camera },
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  blog: 'Blog',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

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
    default:
      return <span className="text-muted-foreground text-xs">In attesa</span>;
  }
}

function PublishingCard({ article }: { article: Article }) {
  const { loadingPublish, setLoadingPublish } = useNexusStore();
  const isLoading = loadingPublish === article.id;

  const categoryLower = article.category?.toLowerCase() || 'tecnologia';
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;

  // Build platform status map from publishLogs
  const platformStatuses: Record<string, string> = {};
  if (article.publishLogs) {
    for (const log of article.publishLogs) {
      platformStatuses[log.platform] = log.status;
    }
  }

  const allPublished = PLATFORMS.every((p) => platformStatuses[p.key] === 'published');
  const hasFailed = PLATFORMS.some((p) => platformStatuses[p.key] === 'failed');
  const pendingPlatforms = PLATFORMS.filter(
    (p) => !platformStatuses[p.key] || platformStatuses[p.key] !== 'published'
  );

  const handlePublishAll = async () => {
    setLoadingPublish(article.id);
    try {
      const platforms = pendingPlatforms.map((p) => p.key);
      await publishArticle(article.id, platforms);
      toast({
        title: 'Pubblicazione avviata',
        description: `Pubblicazione su ${platforms.length} piattaforme in corso...`,
      });
    } catch {
      toast({
        title: 'Errore',
        description: 'Impossibile avviare la pubblicazione.',
        variant: 'destructive',
      });
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
            <Badge className={`${badgeClass} border-0 text-xs`}>
              {article.category}
            </Badge>
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
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
            {article.title}
          </h3>
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
            {new Date(article.publishedAt).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        )}
      </div>

      {/* Platform statuses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLATFORMS.map((platform) => {
          const status = platformStatuses[platform.key] || 'pending';
          const Icon = platform.icon;
          return (
            <div
              key={platform.key}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
            >
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

      {/* Publish all button */}
      {!allPublished && !hasFailed && pendingPlatforms.length > 0 && (
        <Button
          size="sm"
          onClick={handlePublishAll}
          disabled={isLoading}
          className="w-full gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Pubblica su tutte le piattaforme
        </Button>
      )}
      {!allPublished && hasFailed && pendingPlatforms.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handlePublishAll}
          disabled={isLoading}
          className="w-full gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Riprova pubblicazione fallita
        </Button>
      )}
      {allPublished && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pubblicato su tutte le piattaforme
        </div>
      )}
    </motion.div>
  );
}

export default function PublishingPanel() {
  const { pendingArticles, setArticles } = useNexusStore();
  const [approvedArticles, setApprovedArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function loadArticles() {
      try {
        const data = await fetchApprovedArticles();
        setApprovedArticles(Array.isArray(data) ? data : []);
      } catch {
        // Silently fail
      }
    }
    loadArticles();
  }, [setArticles]);

  const allArticles = [...approvedArticles];

  if (allArticles.length === 0) {
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
        {allArticles.length} articol{allArticles.length !== 1 ? 'i' : 'o'} pront{allArticles.length !== 1 ? 'i' : 'o'} per la pubblicazione.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {allArticles.map((article) => (
          <PublishingCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}