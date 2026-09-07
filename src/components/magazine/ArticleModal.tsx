'use client';

import { motion } from 'framer-motion';
import {
  ExternalLink,
  Clock,
  User,
  Calendar,
  Globe,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNexusStore } from '@/lib/store';
import { useT, useLang, useCategoryName, pickTitle, pickSubtitle, LDate } from '@/lib/i18n';
import { ArticleImage } from '@/components/magazine/ArticleImage';

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  tecnologia: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  politica: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  economia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  scienza: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  sport: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cultura: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  salute: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  blog: <Globe className="h-4 w-4" />,
  twitter: <MessageSquare className="h-4 w-4" />,
  facebook: <MessageSquare className="h-4 w-4" />,
  linkedin: <MessageSquare className="h-4 w-4" />,
  instagram: <MessageSquare className="h-4 w-4" />,
};

const PLATFORM_LABELS: Record<string, string> = {
  blog: 'Blog',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
};

export default function ArticleModal() {
  const { selectedArticle, setSelectedArticle, articles } = useNexusStore();
  const t = useT();
  const { lang } = useLang();
  const categoryName = useCategoryName();

  if (!selectedArticle) return null;

  const related = articles
    .filter((a) => a.id !== selectedArticle.id && a.category === selectedArticle.category)
    .slice(0, 2);

  const categoryLower = selectedArticle.category?.toLowerCase() || 'tecnologia';
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;

  const paragraphs = selectedArticle.content?.split('\n').filter(Boolean) || [];

  return (
    <Dialog
      open={!!selectedArticle}
      onOpenChange={(open) => {
        if (!open) setSelectedArticle(null);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${badgeClass} border-0 text-xs`}>
              {categoryName(selectedArticle.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t('qualityLabel')} {selectedArticle.qualityScore}%
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl leading-tight">
            {pickTitle(lang, selectedArticle)}
          </DialogTitle>
          {selectedArticle.subtitle && (
            <DialogDescription className="text-sm mt-1">
              {pickSubtitle(lang, selectedArticle)}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Meta info bar */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 text-xs text-muted-foreground border-b">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{selectedArticle.agent?.name || 'AI Agent'}</span>
            {selectedArticle.agent?.category && (
              <span>· {selectedArticle.agent.category}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{selectedArticle.readTime} {t('minReadLong')}</span>
          </div>
          {selectedArticle.publishedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                <LDate date={selectedArticle.publishedAt} />
              </span>
            </div>
          )}
        </div>

        {/* Article content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="prose prose-sm dark:prose-invert max-w-none space-y-4"
          >
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </motion.div>

          {/* Full page CTA */}
          <Separator className="my-4" />
          {selectedArticle.titleEn && (
            <p className="mb-2 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              EN · {selectedArticle.titleEn}
            </p>
          )}
          <a
            href={`/articolo/${selectedArticle.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            {t('openFullPage')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Related articles (same category, from the magazine) */}
          {related.length > 0 && (
            <>
              <Separator className="my-4" />
              <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('relatedFrom', { cat: categoryName(selectedArticle.category) })}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <button
                      key={r.id}
                      onClick={() => setSelectedArticle(r)}
                      className="group flex items-stretch gap-2.5 rounded-xl border p-2 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                        <ArticleImage
                          imageUrl={r.imageUrl}
                          imageCredit={r.imageCredit}
                          imageCreditUrl={r.imageCreditUrl}
                          category={r.category}
                          seed={r.id}
                          alt={r.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-primary">
                          {pickTitle(lang, r)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {r.agent?.name || 'AI Agent'} · {r.readTime} min
                        </p>
                      </div>
                    </button>
                ))}
              </div>
            </>
          )}

          {/* Source */}
          {selectedArticle.sourceUrl && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('source')}</span>
                <a
                  href={selectedArticle.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors"
                >
                  {selectedArticle.sourceName || selectedArticle.sourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}

          {/* Publishing status */}
          {selectedArticle.publishLogs && selectedArticle.publishLogs.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t('publishingStatus')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedArticle.publishLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {PLATFORM_ICONS[log.platform] || <Globe className="h-4 w-4" />}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {PLATFORM_LABELS[log.platform] || log.platform}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {log.status === 'published' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">{t('published')}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-red-600 dark:text-red-400">{t('failed')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}