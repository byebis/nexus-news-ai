import { requireRole } from '@/lib/auth';
import { sendDigestTelegram } from '@/lib/api';

export const maxDuration = 60;

/** POST (admin+editor): send a weekly digest to Telegram as a thread. */
export async function POST(request: Request) {
  const guard = await requireRole(request, ['admin', 'editor']);
  if (guard.error) return guard.error;

  try {
    const body = await request.json().catch(() => ({}));
    const digestId = body?.digestId;
    if (!digestId) {
      return Response.json({ error: 'digestId obbligatorio' }, { status: 400 });
    }
    const result = await sendDigestTelegram(digestId);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Errore invio Telegram' },
      { status: 500 }
    );
  }
}
