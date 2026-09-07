'use client';

import { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNexusStore } from '@/lib/store';

/**
 * Tab "Profilo" — info account + cambio password (tutti i ruoli).
 */
export default function ProfilePanel() {
  const { currentUser } = useNexusStore();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Cambio password fallito',
          description: data.error || 'Errore inatteso',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Password aggiornata ✓',
        description: 'Usa la nuova password al prossimo accesso.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: 'Cambio password fallito',
        description: 'Errore di rete, riprova.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info account */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Il tuo account
        </h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-muted-foreground">Nome</span>
            <span className="font-medium">{currentUser?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{currentUser?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-muted-foreground">Ruolo</span>
            <Badge variant="secondary" className="capitalize">
              {currentUser?.role || '—'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Cambio password */}
      <div className="rounded-xl border p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold mb-1">
          <KeyRound className="h-4 w-4 text-orange-500" />
          Cambia password
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Minimo 8 caratteri, con almeno una lettera e un numero.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-current">Password attuale</Label>
            <Input
              id="pf-current"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-new">Nuova password</Label>
            <Input
              id="pf-new"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {tooShort && (
              <p className="text-xs text-destructive">Almeno 8 caratteri.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-confirm">Conferma nuova password</Label>
            <Input
              id="pf-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {mismatch && (
              <p className="text-xs text-destructive">Le password non coincidono.</p>
            )}
          </div>

          <Button onClick={submit} disabled={!canSubmit} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {saving ? 'Aggiorno…' : 'Aggiorna password'}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-sky-500" />
        <p>
          Il cambio password è registrato nel log attività della redazione. Se dimentichi la
          password, un amministratore può reimpostartela dal tab Utenti.
        </p>
      </div>
    </div>
  );
}
