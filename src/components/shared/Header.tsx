'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  Languages,
  Search,
  Home,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';
import { useT, useLang } from '@/lib/i18n';
import { CATEGORY_DEFS, CATEGORY_META } from '@/lib/categories';
import SearchOverlay from '@/components/magazine/SearchOverlay';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { settings, searchOpen, setSearchOpen, setSelectedCategory } = useNexusStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const t = useT();
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const goToBookmarks = () => {
    setSelectedCategory('bookmarks');
    setMobileMenuOpen(false);
    if (pathname !== '/') router.push('/');
  };

  const isAdminArea = pathname?.startsWith('/admin') || pathname === '/login';

  // Data odierna (solo client, evita mismatch di hydratazione)
  useEffect(() => {
    const locale = lang === 'en' ? 'en-GB' : 'it-IT';
    setToday(
      new Date().toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, [lang]);

  // Press "/" anywhere to open search (unless typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable) return;
      e.preventDefault();
      useNexusStore.getState().setSearchOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Chiudi il menu a ogni cambio pagina
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const siteName = settings?.siteName || 'NEXUS NEWS AI';
  const tagline = settings?.siteTagline
    || (lang === 'en'
      ? 'The future of news, powered by artificial intelligence'
      : 'Il futuro dell\'informazione, guidato dall\'intelligenza artificiale');

  const LangToggle = ({ full = false }: { full?: boolean }) => (
    <button
      onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
      aria-label={lang === 'it' ? 'Switch to English' : 'Passa all\'italiano'}
      className={
        full
          ? 'flex w-full items-center justify-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted'
          : 'flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted'
      }
    >
      <Languages className={full ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span className={lang === 'it' ? 'opacity-40' : ''}>IT</span>
      <span className="opacity-40">/</span>
      <span className={lang === 'en' ? 'opacity-40' : ''}>EN</span>
    </button>
  );

  const AiBadge = ({ full = false }: { full?: boolean }) =>
    full ? (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t('aiActive')}
      </div>
    ) : (
      <motion.div
        className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t('aiActive')}
      </motion.div>
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      {/* ——— Riga 1: brand + azioni ——— */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo area — click torna alla homepage */}
        <Link
          href="/"
          aria-label={`${siteName} — Home`}
          onClick={() => setSelectedCategory('all')}
          className="flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-none">
              {siteName}
            </h1>
            {/* Data odierna, come i grandi quotidiani */}
            <p className="hidden text-[11px] text-muted-foreground capitalize sm:block">
              {today ?? tagline}
            </p>
          </div>
        </Link>

        {/* Desktop actions */}
        <nav className="hidden items-center gap-2 sm:flex" aria-label="Azioni">
          {!isAdminArea && <AiBadge />}
          <LangToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label={t('searchOpenTitle')}
          >
            <Search className="h-4 w-4" />
          </Button>

          {isAdminArea ? (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/">
                <Zap className="h-4 w-4" />
                {t('magazineBtn')}
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/admin">
                <Shield className="h-4 w-4" />
                {t('adminBtn')}
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle tema"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* ——— Riga 2: nav sezioni (desktop, stile NYT/Repubblica) ——— */}
      {!isAdminArea && (
        <nav
          className="hidden border-t bg-background/60 sm:block"
          aria-label={t('menuSections')}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 scrollbar-none">
            <Link
              href="/"
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              {t('menuHome')}
            </Link>
            {CATEGORY_DEFS.map((cat) => {
              const href = `/categoria/${cat.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-sm">{CATEGORY_META[cat.name]?.emoji}</span>
                  {t(cat.labelKey)}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ——— Menu mobile: sezioni complete, come un vero magazine ——— */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t sm:hidden"
          >
            <div className="flex max-h-[calc(100vh-4rem)] flex-col gap-1.5 overflow-y-auto p-4">
              {today && (
                <p className="mb-1 text-xs capitalize text-muted-foreground">{today}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('aiActive')}
              </div>

              {/* SEZIONI */}
              <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('menuSections')}
              </p>
              <Link
                href="/"
                className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5">
                  <Home className="h-4 w-4" />
                  {t('menuHome')}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              {CATEGORY_DEFS.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{CATEGORY_META[cat.name]?.emoji}</span>
                    {t(cat.labelKey)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
              <button
                onClick={goToBookmarks}
                className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5">
                  <Bookmark className="h-4 w-4" />
                  {t('catBookmarks')}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* SERVIZI */}
              <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('menuServices')}
              </p>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSearchOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Search className="h-4 w-4" />
                {t('searchOpenTitle')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                asChild
              >
                <Link href="/admin">
                  <Shield className="h-4 w-4" />
                  {t('accessoRedazione')}
                </Link>
              </Button>
              <LangToggle full />
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setMobileMenuOpen(false);
                }}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced search overlay (mounted here so it's available on every page) */}
      <SearchOverlay />
    </header>
  );
}
