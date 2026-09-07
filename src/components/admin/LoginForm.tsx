'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Loader2, ShieldCheck, Lock, User as UserIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNexusStore, type SessionUser } from '@/lib/store';
import { useT } from '@/lib/i18n';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser } = useNexusStore();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenziali non valide');
        return;
      }
      setCurrentUser(data.user as SessionUser);
      // Redirect alla pagina admin (o a ?redirect=... se indicato)
      const target = searchParams.get('redirect') || '/admin';
      router.push(target.startsWith('/') ? target : '/admin');
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-2xl border bg-card shadow-lg p-8"
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-md">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Accesso Redazione</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('loginPageTagline')}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="flex items-center gap-1.5 text-xs">
            <UserIcon className="h-3.5 w-3.5" /> Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="nome@nexusnews.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="flex items-center gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" /> Password
          </Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Accedi
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Zap className="h-3 w-3" />
        Admin: gestione completa · Editor: redazione e pubblicazione
      </p>
    </motion.div>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
