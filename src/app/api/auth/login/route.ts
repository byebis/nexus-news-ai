import { supabase, toCamelCase } from '@/lib/supabase';
import { verifyPassword, createSessionToken, sessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Email e password obbligatorie' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const user = toCamelCase(data) as {
      id: string; email: string; name: string; role: string; active: boolean; passwordHash: string;
    };

    if (!user.active) {
      return Response.json({ error: 'Account disattivato. Contatta un amministratore.' }, { status: 403 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return Response.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

    // Audit log (agente di sistema Redazione)
    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'auth_login',
      detail: `${user.name} (${user.email}) ha effettuato il login come ${user.role}`,
      status: 'success',
    });

    const token = await createSessionToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'editor',
    });

    return Response.json({
      user: { uid: user.id, email: user.email, name: user.name, role: user.role },
    }, { headers: { 'Set-Cookie': sessionCookie(token) } });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return Response.json({ error: 'Errore durante il login' }, { status: 500 });
  }
}
