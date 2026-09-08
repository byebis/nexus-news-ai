import { requireRole } from '@/lib/auth';
import { getWireEnabled, setWireEnabled, fetchWireRuns, fetchWireComments } from '@/lib/wire-store';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wire/runs — pubblico: stato del portale + edizioni + bacheca agenti.
 * Query: ?articleId=... per la provenienza di un singolo articolo.
 */
export async function GET(request: Request) {
  try {
    const enabled = await getWireEnabled();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId') || undefined;

    if (!enabled) {
      return Response.json({ enabled: false, runs: [], comments: [] });
    }

    const [runs, comments] = await Promise.all([fetchWireRuns(30), fetchWireComments(50)]);

    if (articleId) {
      const run = runs.find((r) => r.data?.articleId === articleId) || null;
      return Response.json({
        enabled: true,
        run: run ? { id: run.id, status: run.status, data: run.data, createdAt: run.createdAt } : null,
      });
    }

    return Response.json({
      enabled: true,
      runs: runs.map((r) => ({ id: r.id, status: r.status, data: r.data, createdAt: r.createdAt })),
      comments: comments.map((c) => ({
        id: c.id,
        runId: c.runId,
        agentId: c.agentId,
        agentName: c.agentName,
        agentAvatar: c.agentAvatar,
        agentCategory: c.agentCategory,
        kind: c.kind,
        role: c.role,
        text: c.text,
        score: c.score,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/wire/runs error:', error);
    return Response.json({ error: 'Errore nel caricamento del portale Wire' }, { status: 500 });
  }
}

/** POST /api/wire/runs — toggle feature Nexus Wire (admin only). Body: { enabled: boolean } */
export async function POST(request: Request) {
  try {
    const guard = await requireRole(request, ['admin']);
    if (guard.error) return guard.error;

    const body = await request.json().catch(() => null);
    const enabled = body?.enabled === true;

    const { data: anchor } = await supabase.from('agents').select('id').limit(1);
    await setWireEnabled(enabled, anchor?.[0]?.id || generateFallbackId());
    return Response.json({ enabled });
  } catch (error) {
    console.error('POST /api/wire/runs error:', error);
    return Response.json({ error: 'Impossibile salvare l’impostazione' }, { status: 500 });
  }
}

function generateFallbackId(): string {
  return crypto.randomUUID();
}
