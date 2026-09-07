import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

const FIELDS =
  'id, title, subtitle, summary, title_en, subtitle_en, summary_en, category, agent_id, image_url, image_credit, image_credit_url, quality_score, read_time, published_at, created_at, agents(id, name, avatar, category)';

function buildQuery(
  opts: { q: string; category: string; agent: string; days: number; limit: number },
  order: 'recent' | 'old' | 'quality'
) {
  let query = supabase.from('articles').select(FIELDS).eq('status', 'published').limit(opts.limit);

  if (opts.q) {
    // Sanitize PostgREST or-filter special chars
    const safe = opts.q.replace(/[(),*%]/g, ' ').replace(/\s+/g, ' ').trim();
    if (safe) {
      const pattern = `*${safe}*`;
      query = query.or(`title.ilike.${pattern},summary.ilike.${pattern},content.ilike.${pattern}`);
    }
  }
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.agent) query = query.eq('agent_id', opts.agent);
  if (opts.days > 0) {
    const since = new Date(Date.now() - opts.days * 86_400_000).toISOString();
    query = query.gte('created_at', since);
  }

  if (order === 'quality') {
    query = query.order('quality_score', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: order === 'old' });
  }
  return query;
}

/**
 * GET /api/search — advanced search over PUBLISHED articles.
 * Query params:
 *   q         free text (searched in title, summary and full content)
 *   category  exact category name (optional)
 *   agent     agent id (optional)
 *   days      only articles from the last N days (optional)
 *   sort      recent | old | quality (default recent)
 *   limit     max results, default 24 (max 50)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const opts = {
    q: (url.searchParams.get('q') || '').trim().slice(0, 120),
    category: (url.searchParams.get('category') || '').trim(),
    agent: (url.searchParams.get('agent') || '').trim(),
    days: parseInt(url.searchParams.get('days') || '0', 10) || 0,
    limit: Math.min(Math.max(parseInt(url.searchParams.get('limit') || '24', 10) || 24, 1), 50),
  };
  const sortParam = url.searchParams.get('sort') || 'recent';
  const sort: 'recent' | 'old' | 'quality' =
    sortParam === 'old' || sortParam === 'quality' ? sortParam : 'recent';

  const { data, error } = await buildQuery(opts, sort);
  if (error) {
    return Response.json({ error: 'Ricerca fallita', detail: error.message }, { status: 500 });
  }

  const rows = (data || []).map((row: Record<string, unknown>) => {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
    }
    return r;
  });

  return Response.json({ results: rows, count: rows.length });
}
