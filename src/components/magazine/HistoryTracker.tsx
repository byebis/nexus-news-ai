'use client';

import { useEffect } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';

interface Props {
  articleId: string;
  title: string;
  imageUrl: string;
  category: string;
}

/**
 * HistoryTracker — registra la lettura nella cronologia locale
 * ("Continua a leggere" in homepage). Silenzioso, nessuna rete.
 */
export default function HistoryTracker({ articleId, title, imageUrl, category }: Props) {
  const pushHistory = usePersonalization((s) => s.pushHistory);

  useEffect(() => {
    // attende un attimo: solo letture vere, non passaggi fulminei
    const timer = setTimeout(() => {
      pushHistory({ id: articleId, title, imageUrl, category });
    }, 2500);
    return () => clearTimeout(timer);
  }, [articleId, title, imageUrl, category, pushHistory]);

  return null;
}
