'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNexusStore } from '@/lib/store';
import { fetchArticles } from '@/lib/api';

interface CategoryItem {
  name: string;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryItem[] = [
  { name: 'all', label: 'Tutti', emoji: '📰' },
  { name: 'Tecnologia', label: 'Tecnologia', emoji: '💻' },
  { name: 'Politica', label: 'Politica', emoji: '🏛️' },
  { name: 'Economia', label: 'Economia', emoji: '📈' },
  { name: 'Scienza', label: 'Scienza', emoji: '🔬' },
  { name: 'Sport', label: 'Sport', emoji: '⚽' },
  { name: 'Cultura', label: 'Cultura', emoji: '🎭' },
  { name: 'Salute', label: 'Salute', emoji: '🏥' },
];

export default function CategoryBar() {
  const { selectedCategory, setSelectedCategory, setArticles } = useNexusStore();

  const handleCategoryClick = useCallback(
    async (catName: string) => {
      setSelectedCategory(catName);

      try {
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
    [setSelectedCategory, setArticles]
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
              <span>{cat.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}