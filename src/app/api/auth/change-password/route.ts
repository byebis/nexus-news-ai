import { supabase, toCamelCase } from '@/lib/supabase';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';

export const maxDuration = 30;

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Richiede sessione valida (admin o editor).
 * Verifica la password attuale, poi aggiorna l'hash nel DB.
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Password attuale e nuova password sono obbligatorie' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: 'La nuova password deve avere almeno 8 caratteri' },
        { status: 400 }
      );
    }
    if (newPassword.length > 128) {
      return Response.json({ error: 'Password troppo lunga (max 128 caratteri)' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return Response.json(
        { error: 'La nuova password deve essere diversa da quella attuale' },
        { status: 400 }
      );
    }
    // Deve contenere almeno una lettera e un numero
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return Response.json(
        { error: 'La nuova password deve contenere almeno una lettera e un numero' },
        { status: 400 }
      );
    }

    // Carica l'utente dal DB
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.uid)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const user = toCamelCase(data) as { id: string; passwordHash: string; active: boolean };
    if (!user.active) {
      return Response.json({ error: 'Account disattivato' }, { status: 403 });
    }

    // Verifica la password attuale
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      await supabase.from('activity_logs').insert({
        agent_id: 'sys-redazione',
        action: 'auth_password_change_failed',
        detail: `Tentativo cambio password con password attuale errata (${session.email})`,
        status: 'error',
      });
      return Response.json({ error: 'Password attuale non corretta' }, { status: 401 });
    }

    // Aggiorna l'hash
    const newHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', session.uid);

    if (updateError) {
      console.error('change-password update error:', updateError);
      return Response.json({ error: 'Errore durante aggiornamento password' }, { status: 500 });
    }

    // Audit log
    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'auth_password_change',
      detail: `${session.name} (${session.email}) ha cambiato la propria password`,
      status: 'success',
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('POST /api/auth/change-password error:', err);
    return Response.json({ error: 'Errore durante il cambio password' }, { status: 500 });
  }
}
