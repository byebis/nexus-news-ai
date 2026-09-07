import { fetchTrendingArticles } from '@/lib/api';

export async function GET() {
  try {
    const items = await fetchTrendingArticles(5);
    return Response.json({
      items: items.map(({ article, views }) => ({
        id: article.id,
        title: article.title,
        category: article.category,
        agent: article.agent,
        views,
      })),
    });
  } catch (error) {
    console.error('GET /api/views/trending error:', error);
    return Response.json({ items: [] });
  }
}
