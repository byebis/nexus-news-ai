import { supabase, toCamelCase, generateId } from '@/lib/supabase';
import { hashPassword, requireRole } from '@/lib/auth';

const PUBLIC_FIELDS = 'id, email, name, role, active, last_login_at, created_at';

export async function GET(request: Request) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  const { data, error } = await supabase
    .from('users')
    .select(PUBLIC_FIELDS)
    .order('created_at', { ascending: true });
  if (error) {
    return Response.json({ error: 'Impossibile caricare gli utenti' }, { status: 500 });
  }
  return Response.json({ users: (data || []).map((u) => toCamelCase(u)) });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  try {
    const { email, password, name, role } = await request.json();
    if (!email || !password || !role) {
      return Response.json({ error: 'Email, password e ruolo obbligatori' }, { status: 400 });
    }
    if (!['admin', 'editor'].includes(role)) {
      return Response.json({ error: 'Ruolo non valido (admin o editor)' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return Response.json({ error: 'La password deve avere almeno 8 caratteri' }, { status: 400 });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    if (existing) {
      return Response.json({ error: 'Esiste già un utente con questa email' }, { status: 409 });
    }

    const passwordHash = await hashPassword(String(password));
    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({
        id: generateId(),
        email: normalizedEmail,
        password_hash: passwordHash,
        name: String(name || normalizedEmail.split('@')[0]),
        role,
        active: true,
      })
      .select(PUBLIC_FIELDS)
      .single();

    if (insertError) {
      return Response.json({ error: 'Creazione utente fallita' }, { status: 500 });
    }

    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'user_created',
      detail: `${guard.user.name} ha creato l'utente ${created.email} (${created.role})`,
      status: 'success',
    });

    return Response.json({ user: toCamelCase(created) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/users error:', err);
    return Response.json({ error: 'Errore nella creazione utente' }, { status: 500 });
  }
}
