'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useT } from '@/lib/i18n';

/**
 * SWRegister — Level 8: registra il service worker (lettura offline)
 * e mostra un badge discreto quando la connessione cade.
 */
export default function SWRegister() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Offline indicator
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    // Service worker (solo produzione, stessa origine)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silenzioso: la PWA offline è un enhancement
      });
    }

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[70] flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur">
      <WifiOff className="h-3.5 w-3.5 text-amber-500" />
      {t('offlineBadge')}
    </div>
  );
}
