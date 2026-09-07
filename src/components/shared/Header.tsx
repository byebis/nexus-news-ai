'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sun, Moon, Menu, X, Zap, Languages, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';
import { useT, useLang } from '@/lib/i18n';
import SearchOverlay from '@/components/magazine/SearchOverlay';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode, settings, searchOpen, setSearchOpen, setSelectedCategory } = useNexusStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useT();
  const { lang, setLang } = useLang();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo area — click torna alla homepage */}
        <Link
          href="/"
          aria-label={`${siteName} — Home`}
          onClick={() => {
            setViewMode('magazine');
            setSelectedCategory('all');
          }}
          className="flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-none">
              {siteName}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {tagline}
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 sm:flex">
          {/* AI Active indicator */}
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

          <LangToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label={t('searchOpenTitle')}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant={viewMode === 'admin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'admin' ? 'magazine' : 'admin')}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {viewMode === 'admin' ? t('magazineBtn') : t('adminBtn')}
          </Button>

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
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t sm:hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('aiActive')}
              </div>
              <LangToggle full />
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
                variant={viewMode === 'admin' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setViewMode(viewMode === 'admin' ? 'magazine' : 'admin');
                  setMobileMenuOpen(false);
                }}
              >
                <Shield className="h-4 w-4" />
                {viewMode === 'admin' ? t('magazineView') : t('adminPanel')}
              </Button>
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
