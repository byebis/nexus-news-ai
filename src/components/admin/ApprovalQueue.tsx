'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, ShieldCheck, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNexusStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import type { Article } from '@/lib/store';

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  tecnologia: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  politica: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  economia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  scienza: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  sport: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cultura: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  salute: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
};

function getQualityColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function ApprovalCard({ article }: { article: Article }) {
  const { loadingApprove, setLoadingApprove, setPendingArticles } = useNexusStore();
  const isLoading = loadingApprove === article.id;

  const categoryLower = article.category?.toLowerCase() || 'tecnologia';
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;
  const qualityColor = getQualityColor(article.qualityScore);

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoadingApprove(article.id);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, action }),
      });
      if (res.ok) {
        toast({
          title: action === 'approve' ? 'Articolo approvato' : 'Articolo rifiutato',
          description: `"${article.title}" è stato ${action === 'approve' ? 'approvato' : 'rifiutato'}.`,
        });
        // Remove from pending list
        setPendingArticles(
          useNexusStore.getState().pendingArticles.filter((a) => a.id !== article.id)
        );
      } else {
        toast({
          title: 'Errore',
          description: 'Impossibile completare l\'azione.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Errore',
        description: 'Errore di connessione.',
        variant: 'destructive',
      });
    } finally {
      setLoadingApprove(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border bg-card p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className={`${badgeClass} border-0 text-xs`}>
              {article.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {article.agent?.name || 'AI Agent'}
            </div>
          </div>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
            {article.title}
          </h3>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
        {article.summary}
      </p>

      {/* Quality bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Qualità</span>
          <span className="font-medium">{article.qualityScore}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${qualityColor} transition-all`} style={{ width: `${article.qualityScore}%` }} />
        </div>
      </div>

      {/* Source */}
      {article.sourceUrl && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors truncate"
          >
            {article.sourceName || article.sourceUrl}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          size="sm"
          onClick={() => handleAction('approve')}
          disabled={isLoading}
          className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Check className="h-3.5 w-3.5" />
          Approva
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction('reject')}
          disabled={isLoading}
          className="flex-1 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Rifiuta
        </Button>
      </div>
    </motion.div>
  );
}

export default function ApprovalQueue() {
  const { pendingArticles, settings } = useNexusStore();
  const isAutonomous = settings?.mode === 'fully_autonomous';

  return (
    <div className="space-y-4">
      {isAutonomous && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">
            Modalità completamente autonoma — gli articoli vengono approvati automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {pendingArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Coda vuota</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Non ci sono articoli in attesa di approvazione.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pendingArticles.map((article) => (
              <ApprovalCard key={article.id} article={article} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}