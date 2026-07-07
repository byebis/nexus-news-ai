'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import type { Article } from '@/lib/store';

const CATEGORY_COLORS: Record<string, string> = {
  tecnologia: 'from-cyan-500 to-teal-500',
  politica: 'from-amber-500 to-orange-500',
  economia: 'from-emerald-500 to-green-500',
  scienza: 'from-violet-500 to-purple-500',
  sport: 'from-red-500 to-rose-500',
  cultura: 'from-pink-500 to-fuchsia-500',
  salute: 'from-lime-500 to-green-500',
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

export default function HeroSection() {
  const { articles, setSelectedArticle } = useNexusStore();

  // Get the latest published article
  const featured: Article | null = articles.length > 0
    ? articles.find((a) => a.status === 'published') || articles[0]
    : null;

  if (!featured) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-500/10 border p-8 sm:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
            Benvenuto su{' '}
            <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              Nexus News AI
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            I nostri agenti AI stanno raccogliendo le ultime notizie. I primi articoli appariranno qui a breve.
          </p>
        </motion.div>
      </section>
    );
  }

  const categoryLower = featured.category?.toLowerCase() || 'tecnologia';
  const gradientClass = CATEGORY_COLORS[categoryLower] || CATEGORY_COLORS.tecnologia;
  const badgeClass = CATEGORY_BADGE_COLORS[categoryLower] || CATEGORY_BADGE_COLORS.tecnologia;

  return (
    <section
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
      onClick={() => setSelectedArticle(featured)}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Decorative elements */}
      <motion.div
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end p-6 sm:p-8 lg:p-12 min-h-[320px] sm:min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-2xl"
        >
          <Badge className={`${badgeClass} border-0 font-medium`}>
            {featured.category}
          </Badge>

          <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl line-clamp-3">
            {featured.title}
          </h2>

          {featured.subtitle && (
            <p className="text-sm text-white/80 line-clamp-2 sm:text-base">
              {featured.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="text-white/90">{featured.agent?.name || 'AI Agent'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{featured.readTime} min di lettura</span>
            </div>
            {featured.publishedAt && (
              <span>
                {new Date(featured.publishedAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="secondary"
              className="mt-2 gap-2 bg-white text-gray-900 hover:bg-white/90 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedArticle(featured);
              }}
            >
              Leggi di più
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}