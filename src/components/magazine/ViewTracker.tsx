'use client';

import { useEffect } from 'react';

/** Registra una lettura per articolo, 1 volta per sessione browser */
export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (!articleId) return;
    const key = `nexus_view_${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage non disponibile: conta comunque la lettura
    }
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
      keepalive: true,
    }).catch(() => {
      // silenzioso
    });
  }, [articleId]);

  return null;
}
