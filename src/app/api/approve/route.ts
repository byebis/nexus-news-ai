import { approveArticle } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { articleId, action, note } = await request.json();

    if (!articleId || !action) {
      return Response.json({ error: 'articleId and action required' }, { status: 400 });
    }

    const article = await approveArticle(articleId, action, note);
    return Response.json(article);
  } catch (error) {
    console.error('POST /api/approve error:', error);
    return Response.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}