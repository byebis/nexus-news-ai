import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Accesso Redazione',
  description: 'Area riservata alla redazione di Nexus News AI.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Minimal editorial header */}
      <header className="border-b">
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

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <LoginForm />
      </main>

      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexus News AI — Il futuro dell&apos;informazione
        </p>
      </footer>
    </div>
  );
}
