'use client';

import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useT } from '@/lib/i18n';

interface BookmarkButtonProps {
  articleId: string;
  className?: string;
  floating?: boolean; // stile overlay per le card
}

export default function BookmarkButton({ articleId, className, floating }: BookmarkButtonProps) {
  const { ids, toggle, hydrate } = useBookmarks();
  const t = useT();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const saved = ids.includes(articleId);

  if (floating) {
    return (
      <button
        aria-label={saved ? t('removeSaved') : t('saveForLater')}
        onClick={(e) => {
          e.stopPropagation();
          toggle(articleId);
        }}
        className={cn(
          'absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all',
          saved
            ? 'bg-amber-400/90 text-white shadow-md'
            : 'bg-black/35 text-white/90 hover:bg-black/55',
          className
        )}
      >
        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
      </button>
    );
  }

  return (
    <button
      aria-label={saved ? t('removeSaved') : t('saveForLater')}
      onClick={() => toggle(articleId)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        saved
          ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
    >
      <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-amber-500 text-amber-500')} />
      {saved ? t('saved') : t('save')}
    </button>
  );
}
