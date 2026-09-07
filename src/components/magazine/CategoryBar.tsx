'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useT } from '@/lib/i18n';

interface CategoryItem {
  name: string;
  labelKey: string;
  emoji: string;
}

const CATEGORIES: CategoryItem[] = [
  { name: 'all', labelKey: 'catAll', emoji: '📰' },
  { name: 'Tecnologia', labelKey: 'catTechnology', emoji: '💻' },
  { name: 'Politica', labelKey: 'catPolitics', emoji: '🏛️' },
  { name: 'Economia', labelKey: 'catEconomy', emoji: '📈' },
  { name: 'Scienza', labelKey: 'catScience', emoji: '🔬' },
  { name: 'Sport', labelKey: 'catSport', emoji: '⚽' },
  { name: 'Cultura', labelKey: 'catCulture', emoji: '🎭' },
  { name: 'Salute', labelKey: 'catHealth', emoji: '🏥' },
  { name: 'bookmarks', labelKey: 'catBookmarks', emoji: '🔖' },
];

export default function CategoryBar() {
  const { selectedCategory, setSelectedCategory, setArticles } = useNexusStore();
  const t = useT();
  const hydrate = useBookmarks((s) => s.hydrate);

  const handleCategoryClick = useCallback(
    async (catName: string) => {
      setSelectedCategory(catName);
      hydrate();

      try {
        if (catName === 'bookmarks') {
          // Filtra gli articoli pubblicati sui salvati in locale
          const data = await fetchArticles({ status: 'published', limit: 50 });
          const saved = new Set(useBookmarks.getState().ids);
          setArticles(data.filter((a) => saved.has(a.id)));
          return;
        }

        const data = await fetchArticles({
          status: 'published',
          limit: 20,
          category: catName !== 'all' ? catName : undefined,
        });
        setArticles(data);
      } catch {
        // Silently fail - articles will remain unchanged
      }
    },
    [setSelectedCategory, setArticles, hydrate]
  );

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex gap-2 px-1 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.name;
          return (
            <motion.button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                transition-colors whitespace-nowrap border
                ${
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <span className="text-base">{cat.emoji}</span>
              <span>{t(cat.labelKey)}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}