'use client';

import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import type { Article } from '@/lib/store';

const CATEGORY_GRADIENTS: Record<string, string> = {
  tecnologia: 'from-cyan-400 to-teal-500',
  politica: 'from-amber-400 to-orange-500',
  economia: 'from-emerald-400 to-green-500',
  scienza: 'from-violet-400 to-purple-500',
  sport: 'from-red-400 to-rose-500',
  cultura: 'from-pink-400 to-fuchsia-500',
  salute: 'from-lime-400 to-green-500',
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

function getQualityColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getQualityLabel(score: number): string {
  if (score >= 80) return 'Eccellente';
  if (score >= 60) return 'Buono';
  return 'Discreto';
}

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export default function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const { setSelectedArticle } = useNexusStore();

  const categoryLower = article.category?.toLowerCase() || 'tecnologia';
  const gradientClass = CATEGORY_GRADIENTS[categoryLower] || CATEGORY_GRADIENTS.tecnologia;
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
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
      onClick={() => setSelectedArticle(article)}
    >
      {/* Image placeholder */}
      <div className={`relative h-40 sm:h-48 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute right-4 top-4 text-6xl font-black text-white/30">
            {article.category?.charAt(0) || 'N'}
          </div>
        </div>
        {/* Category badge on image */}
        <div className="absolute left-3 top-3">
          <Badge className={`${badgeClass} border-0 text-xs font-medium`}>
            {article.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold leading-snug line-clamp-2 text-sm sm:text-base group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {article.summary}
        </p>

        {/* Quality score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Qualità</span>
            <span className="font-medium">{article.qualityScore}% · {getQualityLabel(article.qualityScore)}</span>
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