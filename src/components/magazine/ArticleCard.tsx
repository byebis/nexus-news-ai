'use client';

import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import BookmarkButton from '@/components/magazine/BookmarkButton';
import { ArticleImage } from '@/components/magazine/ArticleImage';
import { useT, useLang, useCategoryName, pickTitle, pickSummary } from '@/lib/i18n';
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

function getQualityLabel(score: number): string {
  if (score >= 80) return 'qExcellent';
  if (score >= 60) return 'qGood';
  return 'qFair';
}

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export default function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const t = useT();
  const { lang } = useLang();
  const categoryName = useCategoryName();
  const href = `/articolo/${article.id}`;

  const categoryLower = article.category?.toLowerCase() || 'tecnologia';
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;
  const qualityColor = getQualityColor(article.qualityScore);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Link reale su tutta la card: navigazione crawlabile (SEO + accessibilità) */}
      <Link
        href={href}
        aria-label={pickTitle(lang, article)}
        className="absolute inset-0 z-[1] rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {/* Cover: real photo when available, generative art fallback */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <ArticleImage
          imageUrl={article.imageUrl}
          imageCredit={article.imageCredit}
          imageCreditUrl={article.imageCreditUrl}
          category={article.category}
          seed={article.id}
          alt={pickTitle(lang, article)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/0" />
        {/* Category badge on image */}
        <div className="absolute left-3 top-3">
          <Badge className={`${badgeClass} border-0 text-xs font-medium`}>
            {categoryName(article.category)}
          </Badge>
        </div>
        <BookmarkButton articleId={article.id} floating />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold leading-snug line-clamp-2 text-sm sm:text-base group-hover:text-primary transition-colors">
          {pickTitle(lang, article)}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {pickSummary(lang, article)}
        </p>

        {/* Quality score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('quality')}</span>
            <span className="font-medium">{article.qualityScore}% · {t(getQualityLabel(article.qualityScore))}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${qualityColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${article.qualityScore}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{article.agent?.name || 'AI Agent'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{article.readTime} min</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}