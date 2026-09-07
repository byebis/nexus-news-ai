'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  Loader2,
  UserPlus,
  ShieldCheck,
  PenLine,
  Power,
  RefreshCw,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNexusStore, type ManagedUser } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  editor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Amministratore',
  editor: 'Editore',
};

export default function UsersPanel() {
  const { currentUser } = useNexusStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [busy, setBusy] = useState(false);

  // Form creazione
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
  const [newPassword, setNewPassword] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      // silenzioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Creazione fallita', variant: 'destructive' });
        return;
      }
      toast({ title: 'Utente creato', description: `${data.user.email} (${ROLE_LABEL[data.user.role]})` });
      setCreateOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('editor');
      loadUsers();
    } finally {
      setBusy(false);
    }
  };

  const handlePatch = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Operazione fallita', variant: 'destructive' });
        return false;
      }
      toast({ title: okMsg });
      loadUsers();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (u: ManagedUser) => {
    await handlePatch(u.uid, { active: !u.active }, u.active ? 'Utente disattivato' : 'Utente riattivato');
  };

  const handleChangeRole = async (u: ManagedUser) => {
    const newRole = u.role === 'admin' ? 'editor' : 'admin';
    await handlePatch(u.uid, { role: newRole }, `Ruolo cambiato in ${ROLE_LABEL[newRole]}`);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    const ok = await handlePatch(resetTarget.uid, { password: resetPassword }, 'Password aggiornata');
    if (ok) {
      setResetTarget(null);
      setResetPassword('');
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Eliminare definitivamente l'utente ${u.email}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${u.uid}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Errore', description: data.error || 'Eliminazione fallita', variant: 'destructive' });
        return;
      }
      toast({ title: 'Utente eliminato', description: u.email });
      loadUsers();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <UsersIcon className="h-4 w-4" /> Gestione Utenti
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Amministratori: accesso completo · Editori: redazione, approvazione e pubblicazione.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Ricarica
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Nuovo Utente
          </Button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="divide-y">
          {users.map((u) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{u.name || '—'}</span>
                  <Badge className={`${ROLE_BADGE[u.role]} border-0 text-xs gap-1`}>
                    {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                    {ROLE_LABEL[u.role]}
                  </Badge>
                  {!u.active && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0 text-xs">
                      Disattivato
                    </Badge>
                  )}
                  {u.uid === currentUser?.uid && (
                    <Badge variant="outline" className="text-xs">Tu</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {u.email}
                  {u.lastLoginAt && ` · ultimo accesso ${new Date(u.lastLoginAt).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Cambia ruolo"
                  disabled={busy || u.uid === currentUser?.uid}
                  onClick={() => handleChangeRole(u)}
                  className="gap-1.5"
                >
                  {u.role === 'admin' ? <PenLine className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Ruolo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Reset password"
                  disabled={busy}
                  onClick={() => setResetTarget(u)}
                  className="gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Password</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={u.active ? 'Disattiva' : 'Riattiva'}
                  disabled={busy || u.uid === currentUser?.uid}
                  onClick={() => handleToggleActive(u)}
                  className="gap-1.5"
                >
                  <Power className={`h-3.5 w-3.5 ${u.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  <span className="hidden sm:inline">{u.active ? 'Attivo' : 'Off'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Elimina"
                  disabled={busy || u.uid === currentUser?.uid}
                  onClick={() => handleDelete(u)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </motion.div>
          ))}
          {users.length === 0 && !loading && (
            <p className="p-8 text-center text-sm text-muted-foreground">Nessun utente trovato.</p>
          )}
        </div>
      </div>

      {/* Dialog creazione utente */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Nuovo Utente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">Email</Label>
              <Input id="nu-email" type="email" placeholder="nome@nexusnews.ai" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">Nome</Label>
              <Input id="nu-name" placeholder="Nome in redazione" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-pass">Password (min 8 caratteri)</Label>
              <Input id="nu-pass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ruolo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newRole === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewRole('admin')}
                  className="gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Amministratore
                </Button>
                <Button
                  type="button"
                  variant={newRole === 'editor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewRole('editor')}
                  className="gap-1.5"
                >
                  <PenLine className="h-3.5 w-3.5" /> Editore
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>Annulla</Button>
            <Button onClick={handleCreate} disabled={busy || !newEmail || !newPassword} className="gap-1.5">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Crea Utente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reset password */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Nuova password
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Per <strong>{resetTarget?.email}</strong>. Minimo 8 caratteri.
          </p>
          <Input
            type="password"
            placeholder="••••••••"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={busy}>Annulla</Button>
            <Button onClick={handleResetPassword} disabled={busy || resetPassword.length < 8} className="gap-1.5">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Aggiorna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
