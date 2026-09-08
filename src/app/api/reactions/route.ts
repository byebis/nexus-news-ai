// ============================================
// Level 13 — Reazioni rapide dei lettori
// Storage: activity_logs con convenzione (action='reaction',
// detail='<articleId>|<emoji>') — stesso pattern delle views,
// zero tabelle nuove, zero costi.
// ============================================

import { supabase } from '@/lib/supabase';
import { AGENT_REACTIONS, isAgentReaction } from '@/lib/agent-slug';

const ACTION = 'reaction';

async function fetchCounts(articleId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const r of AGENT_REACTIONS) counts[r] = 0;
  const { data, error } = await supabase
    .from('activity_logs')
    .select('detail')
    .eq('action', ACTION)
    .like('detail', `${articleId}|%`)
    .limit(5000);
  if (!error && data) {
    for (const row of data) {
      const reaction = String(row.detail || '').split('|')[1];
      if (reaction && reaction in counts) counts[reaction] += 1;
    }
  }
  return counts;
}

function withTotal(counts: Record<string, number>) {
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = (searchParams.get('articleId') || '').trim();
  if (!articleId) {
    return Response.json({ error: 'articleId required' }, { status: 400 });
  }
  try {
    const counts = await fetchCounts(articleId);
    return Response.json(withTotal(counts));
  } catch (error) {
    console.error('GET /api/reactions error:', error);
    return Response.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const articleId = String(body?.articleId || '').trim();
    const reaction = body?.reaction;
    if (!articleId || !isAgentReaction(reaction)) {
      return Response.json({ error: 'articleId and a valid reaction are required' }, { status: 400 });
    }

    // activity_logs.agent_id è NOT NULL: uso l'agente autore dell'articolo come anchor
    const { data: art, error: artErr } = await supabase
      .from('articles')
      .select('agent_id')
      .eq('id', articleId)
      .single();
    if (artErr || !art) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    const { error } = await supabase.from('activity_logs').insert({
      agent_id: art.agent_id,
      action: ACTION,
      detail: `${articleId}|${reaction}`,
      status: 'success',
    });
    if (error) {
      console.error('POST /api/reactions insert error:', error);
      return Response.json({ error: 'Failed to register reaction' }, { status: 500 });
    }

    const counts = await fetchCounts(articleId);
    return Response.json({ ok: true, ...withTotal(counts) });
  } catch (error) {
    console.error('POST /api/reactions error:', error);
    return Response.json({ error: 'Failed to register reaction' }, { status: 500 });
  }
}
