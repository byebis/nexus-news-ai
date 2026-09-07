import { publishArticle } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  // Admin ed Editor possono pubblicare
  const guard = await requireRole(request, ['admin', 'editor']);
  if (guard.error) return guard.error;

  try {
    const { articleId, platforms } = await request.json();

    if (!articleId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return Response.json({ error: 'articleId e almeno una piattaforma richiesti' }, { status: 400 });
    }

    const { article, results } = await publishArticle(articleId, platforms);
    return Response.json({ article, results });
  } catch (error) {
    console.error('POST /api/publish error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to publish' }, { status: 500 });
  }
}
