import { translateArticle } from '@/lib/api';

export const maxDuration = 60;

/** GET: return cached EN translation if present (no LLM call). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { fetchArticleById } = await import('@/lib/api');
    const article = await fetchArticleById(id);
    if (!article || article.status === 'pending_approval' || article.status === 'rejected') {
      return Response.json({ error: 'Articolo non trovato' }, { status: 404 });
    }
    if (article.contentEn) {
      return Response.json({
        titleEn: article.titleEn,
        subtitleEn: article.subtitleEn,
        summaryEn: article.summaryEn,
        contentEn: article.contentEn,
        cached: true,
      });
    }
    return Response.json({ cached: false });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Errore lettura traduzione' },
      { status: 500 }
    );
  }
}

/** POST: generate (or return cached) EN translation via LLM. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const result = await translateArticle(id);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Errore traduzione' },
      { status: 500 }
    );
  }
}
