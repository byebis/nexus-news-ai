'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sun, Moon, Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNexusStore } from '@/lib/store';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode, settings } = useNexusStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = settings?.siteName || 'NEXUS NEWS AI';
  const tagline = settings?.siteTagline || 'Il futuro dell\'informazione, guidato dall\'intelligenza artificiale';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo area */}
        <div className="flex items-center gap-3">
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
        </div>

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
            AI Attivo
          </motion.div>

          <Button
            variant={viewMode === 'admin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'admin' ? 'magazine' : 'admin')}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {viewMode === 'admin' ? 'Magazine' : 'Admin'}
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
                AI Attivo
              </div>
              <Button
                variant={viewMode === 'admin' ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setViewMode(viewMode === 'admin' ? 'magazine' : 'admin');
                  setMobileMenuOpen(false);
                }}
              >
                <Shield className="h-4 w-4" />
                {viewMode === 'admin' ? 'Vista Magazine' : 'Pannello Admin'}
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
                {theme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}