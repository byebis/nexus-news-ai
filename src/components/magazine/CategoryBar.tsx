'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNexusStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { useBookmarks } from '@/hooks/useBookmarks';
import { CATEGORY_DEFS, CATEGORY_META } from '@/lib/categories';

/**
 * Barra categorie della homepage: link REALI alle pagine sezione
 * (/categoria/[slug]), come in un vero magazine.
 * "Da leggere" resta un filtro locale in-page.
 */
export default function CategoryBar() {
  const router = useRouter();
  const { selectedCategory, setSelectedCategory } = useNexusStore();
  const t = useT();
  const hydrate = useBookmarks((s) => s.hydrate);

  const handleBookmarksClick = () => {
    setSelectedCategory('bookmarks');
    hydrate();
    // Il filtro "Da leggere" vive nella homepage: torna lì con navigazione client-side
    if (window.location.pathname !== '/') router.push('/');
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex gap-2 px-1 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
        {CATEGORY_DEFS.map((cat) => (
          <motion.div key={cat.slug} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={`/categoria/${cat.slug}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap border bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            >
              <span className="text-base">{CATEGORY_META[cat.name]?.emoji}</span>
              <span>{t(cat.labelKey)}</span>
            </Link>
          </motion.div>
        ))}
        <motion.button
          onClick={handleBookmarksClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`
            flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
            transition-colors whitespace-nowrap border
            ${
              selectedCategory === 'bookmarks'
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
            }
          `}
        >
          <span className="text-base">🔖</span>
          <span>{t('catBookmarks')}</span>
        </motion.button>
      </div>
    </div>
  );
}
