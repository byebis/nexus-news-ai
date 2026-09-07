import { supabase } from '@/lib/supabase';
import { clearSessionCookie, getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (user) {
    try {
      await supabase.from('activity_logs').insert({
        agent_id: 'sys-redazione',
        action: 'auth_logout',
        detail: `${user.name} (${user.email}) ha effettuato il logout`,
        status: 'info',
      });
    } catch {
      // non bloccare il logout se l'audit fallisce
    }
  }
  return Response.json({ success: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
