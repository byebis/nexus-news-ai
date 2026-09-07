import { supabase } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { resolveArticleImage } from '@/lib/article-image';

export const maxDuration = 120;

/**
 * POST /api/images/backfill  (admin only)
 * Finds published/approved articles without a cover image and resolves one
 * via the full chain (original page og:image -> Openverse -> Wikimedia -> AI).
 * Body: { limit?: number }  — default 8 per call.
 */
export async function POST(request: Request) {
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

  let limit = 8;
  try {
    const body = await request.json();
    if (body?.limit) limit = Math.min(Math.max(parseInt(body.limit, 10) || 8, 1), 15);
  } catch { /* empty body is fine */ }

  const { data: missing, error } = await supabase
    .from('articles')
    .select('id, title, summary, category, source_name, source_url')
    .or('image_url.is.null,image_url.eq.')
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return Response.json({ error: 'Query articoli fallita' }, { status: 500 });
  }
  if (!missing || missing.length === 0) {
    return Response.json({ updated: 0, remainingHint: 'nessun articolo senza immagine' });
  }

  const results: Array<{ id: string; title: string; origin?: string; credit?: string; error?: string }> = [];
  for (const a of missing) {
    try {
      const img = await resolveArticleImage({
        title: a.title,
        summary: a.summary || '',
        category: a.category || '',
        sourceName: a.source_name || '',
        pageUrl: a.source_url || '',
      });
      if (img) {
        const { error: upErr } = await supabase
          .from('articles')
          .update({ image_url: img.url, image_credit: img.credit, image_credit_url: img.creditUrl })
          .eq('id', a.id);
        if (upErr) {
          results.push({ id: a.id, title: a.title.slice(0, 60), error: `update: ${upErr.message.slice(0, 120)}` });
        } else {
          results.push({ id: a.id, title: a.title.slice(0, 60), origin: img.origin, credit: img.credit });
        }
      } else {
        results.push({ id: a.id, title: a.title.slice(0, 60), error: 'nessuna immagine trovata' });
      }
    } catch (e: unknown) {
      results.push({ id: a.id, title: a.title.slice(0, 60), error: e instanceof Error ? e.message.slice(0, 120) : 'errore' });
    }
  }

  return Response.json({ updated: results.filter((r) => !r.error).length, processed: missing.length, results });
}
