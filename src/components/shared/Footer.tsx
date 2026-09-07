'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Rss, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNexusStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const CATEGORIES = [
  { name: 'Tecnologia', labelKey: 'catTechnology' },
  { name: 'Politica', labelKey: 'catPolitics' },
  { name: 'Economia', labelKey: 'catEconomy' },
  { name: 'Scienza', labelKey: 'catScience' },
  { name: 'Sport', labelKey: 'catSport' },
  { name: 'Cultura', labelKey: 'catCulture' },
  { name: 'Salute', labelKey: 'catHealth' },
];

interface BipEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function Footer() {
  const { settings, setSelectedCategory, setViewMode } = useNexusStore();
  const t = useT();
  const siteName = settings?.siteName || 'NEXUS NEWS AI';
  const tagline = settings?.siteTagline
    || (t('heroWelcomeA') === 'Benvenuto su'
      ? 'Il futuro dell\'informazione, guidato dall\'intelligenza artificiale'
      : 'The future of news, powered by artificial intelligence');
  const currentYear = new Date().getFullYear();

  const [installEvt, setInstallEvt] = useState<BipEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BipEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              aria-label={`${siteName} — Home`}
              onClick={() => {
                setViewMode('magazine');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">{siteName}</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {tagline}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Zap className="h-3 w-3" />
                {t('poweredBy')}
              </Badge>
              <a
                href="/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-orange-400"
                aria-label="RSS feed"
              >
                <Rss className="h-3 w-3 text-orange-500" />
                RSS
              </a>
              {installEvt && (
                <button
                  onClick={install}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-sky-400"
                >
                  <Download className="h-3 w-3 text-sky-500" />
                  {t('installApp')}
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('categories')}</h3>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setViewMode('magazine');
                    }}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(cat.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('about')}</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-xs text-muted-foreground">
                  {t('footerDisclaimer')}
                </span>
              </li>
              <li>
                <span className="text-xs text-muted-foreground">
                  © {currentYear} {siteName}. {t('allRights')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-rose-500" />
            {t('poweredBy')}
          </div>
        </div>
      </div>
    </footer>
  );
}
