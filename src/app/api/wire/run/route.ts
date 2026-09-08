import { requireRole } from '@/lib/auth';
import { getWireEnabled, hasRecentRun } from '@/lib/wire-store';
import { runNexusWire } from '@/lib/wire-engine';

export const maxDuration = 300;

/**
 * POST /api/wire/run — avvia la Redazione Collettiva (admin only)
 * Body: { topic: string }
 * Pipeline: selezione 3-5 fonti → dossier → bozza → 2 revisioni → editor finale
 * → articolo in coda di approvazione + commenti agenti in bacheca.
 */
export async function POST(request: Request) {
  try {
    const guard = await requireRole(request, ['admin']);
    if (guard.error) return guard.error;

    const enabled = await getWireEnabled();
    if (!enabled) {
      return Response.json({ error: 'Nexus Wire è disattivato dalle impostazioni.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    if (topic.length < 3 || topic.length > 120) {
      return Response.json({ error: 'Argomento non valido (3-120 caratteri).' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return Response.json({ error: 'Motore AI non configurato (OPENROUTER_API_KEY)' }, { status: 503 });
    }

    if (await hasRecentRun(4)) {
      return Response.json(
        { error: 'Una redazione collettiva è già in corso o è appena terminata. Riprova tra qualche minuto.' },
        { status: 429 }
      );
    }

    const result = await runNexusWire(topic, apiKey);
    return Response.json(result);
  } catch (error) {
    console.error('POST /api/wire/run error:', error);
    const message = error instanceof Error ? error.message : 'Redazione collettiva fallita';
    return Response.json({ error: message }, { status: 500 });
  }
}
