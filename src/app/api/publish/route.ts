import { publishArticle } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { articleId, platforms } = await request.json();

    if (!articleId || !platforms || !Array.isArray(platforms)) {
      return Response.json({ error: 'articleId and platforms array required' }, { status: 400 });
    }

    const article = await publishArticle(articleId, platforms);
    return Response.json(article);
  } catch (error) {
    console.error('POST /api/publish error:', error);
    return Response.json({ error: 'Failed to publish' }, { status: 500 });
  }
}