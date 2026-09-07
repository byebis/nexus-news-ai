import { requireRole } from '@/lib/auth';
import {
  fetchWeeklyDigests,
  fetchDigestAgents,
  generateWeeklyDigest,
} from '@/lib/api';

export const maxDuration = 120;

/** GET (public): digests of the current week + agent weekly counts. */
export async function GET() {
  try {
    const [digests, agents] = await Promise.all([fetchWeeklyDigests(), fetchDigestAgents()]);
    return Response.json({ digests, agents });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Errore caricamento digest' },
      { status: 500 }
    );
  }
}

/** POST (admin+editor): generate digest for one agent or all. */
export async function POST(request: Request) {
  const guard = await requireRole(request, ['admin', 'editor']);
  if (guard.error) return guard.error;

  try {
    const body = await request.json().catch(() => ({}));
    const agentId = body?.agentId;

    if (agentId && agentId !== 'all') {
      const digest = await generateWeeklyDigest(agentId);
      return Response.json({ digests: [digest] });
    }

    // All agents with at least one published article this week
    const agents = await fetchDigestAgents();
    const withArticles = agents.filter((a) => a.weekCount > 0);
    if (withArticles.length === 0) {
      return Response.json({ error: 'Nessun agente ha articoli pubblicati questa settimana' }, { status: 400 });
    }

    const digests: unknown[] = [];
    const failed: string[] = [];
    for (const a of withArticles) {
      try {
        digests.push(await generateWeeklyDigest(a.id));
      } catch (e) {
        failed.push(`${a.name}: ${e instanceof Error ? e.message : 'errore'}`);
      }
    }

    return Response.json({ digests, failed });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Errore generazione digest' },
      { status: 500 }
    );
  }
}
