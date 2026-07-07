'use client';

import { useEffect } from 'react';
import { useNexusStore } from '@/lib/store';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import HeroSection from '@/components/magazine/HeroSection';
import CategoryBar from '@/components/magazine/CategoryBar';
import ArticleGrid from '@/components/magazine/ArticleGrid';
import ArticleModal from '@/components/magazine/ArticleModal';
import AdminPanel from '@/components/admin/AdminPanel';

export default function Home() {
  const { viewMode, settings, setSettings } = useNexusStore();

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch {
        // Silently fail
      }
    }
    fetchSettings();
  }, [setSettings]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        {viewMode === 'magazine' ? (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <HeroSection />
            <CategoryBar />
            <ArticleGrid />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <AdminPanel />
          </div>
        )}
      </main>

      <ArticleModal />
      <Footer />
    </div>
  );
}