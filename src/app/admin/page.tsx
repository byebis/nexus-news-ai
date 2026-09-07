import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AdminPanel from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Pannello di Amministrazione',
  description: 'Area riservata alla redazione di Nexus News AI.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Minimal editorial header for the newsroom area */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
            aria-label="Nexus News AI — Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg">
              <span className="text-white text-base font-black">N</span>
            </div>
            <span className="text-base font-bold tracking-tight">NEXUS NEWS AI</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Torna al magazine</span>
            <span className="sm:hidden">Magazine</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AdminPanel />
        </div>
      </main>

      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          Nexus News AI — Redazione AI · accesso riservato
        </p>
      </footer>
    </div>
  );
}
