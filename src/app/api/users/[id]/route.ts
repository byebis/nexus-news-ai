import { supabase } from '@/lib/supabase';
import { hashPassword, requireRole } from '@/lib/auth';

const PUBLIC_FIELDS = 'id, email, name, role, active, last_login_at, created_at';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (body.role !== undefined) {
      if (!['admin', 'editor'].includes(body.role)) {
        return Response.json({ error: 'Ruolo non valido' }, { status: 400 });
      }
      updates.role = body.role;
    }
    if (body.active !== undefined) updates.active = !!body.active;
    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 8) {
        return Response.json({ error: 'La password deve avere almeno 8 caratteri' }, { status: 400 });
      }
      updates.password_hash = await hashPassword(body.password);
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Nessuna modifica fornita' }, { status: 400 });
    }

    // Protezione auto-lock: l'admin non può disattivare se stesso o degradare l'ultimo admin
    if (updates.active === false && id === guard.user.uid) {
      return Response.json({ error: 'Non puoi disattivare il tuo stesso account' }, { status: 400 });
    }
    if ((updates.role === 'editor' || updates.active === false) && id === guard.user.uid) {
      const { count, error: cntErr } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('active', true);
      if (!cntErr && (count || 0) <= 1) {
        return Response.json({ error: 'Deve rimanere almeno un amministratore attivo' }, { status: 400 });
      }
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select(PUBLIC_FIELDS)
      .single();

    if (error || !updated) {
      return Response.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'user_updated',
      detail: `${guard.user.name} ha aggiornato l'utente ${updated.email}: ${Object.keys(updates).join(', ')}`,
      status: 'info',
    });

    return Response.json({ user: toCamel(updated) });
  } catch (err) {
    console.error('PATCH /api/users/[id] error:', err);
    return Response.json({ error: 'Errore aggiornamento utente' }, { status: 500 });
  }
}

function toCamel(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

// DELETE utente (admin)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  const { id } = await params;
  if (id === guard.user.uid) {
    return Response.json({ error: 'Non puoi eliminare il tuo stesso account' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('email, role')
    .eq('id', id)
    .single();
  if (!existing) {
    return Response.json({ error: 'Utente non trovato' }, { status: 404 });
  }
  if (existing.role === 'admin') {
    const { count, error: cntErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('active', true);
    if (!cntErr && (count || 0) <= 1) {
      return Response.json({ error: 'Deve rimanere almeno un amministratore attivo' }, { status: 400 });
    }
  }

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) {
    return Response.json({ error: 'Eliminazione fallita' }, { status: 500 });
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'sys-redazione',
    action: 'user_deleted',
    detail: `${guard.user.name} ha eliminato l'utente ${existing.email}`,
    status: 'warning',
  });

  return Response.json({ success: true });
}
