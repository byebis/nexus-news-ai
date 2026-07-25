import { fetchArticles } from '@/lib/api';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const articles = await fetchArticles({ category, status, limit });
    return Response.json(articles);
  } catch (error) {
    console.error('GET /api/articles error:', error);
    return Response.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articleId = generateId();
    const { error } = await supabase.from('articles').insert({
      id: articleId,
      title: body.title,
      subtitle: body.subtitle || '',
      content: body.content,
      summary: body.summary || '',
      category: body.category,
      agent_id: body.agentId,
      source_name: body.sourceName || '',
      source_url: body.sourceUrl || '',
      image_url: body.imageUrl || '',
      quality_score: body.qualityScore || 0,
      read_time: body.readTime || 3,
      status: body.status || 'draft',
    });
    if (error) throw error;
    return Response.json({ success: true, id: articleId });
  } catch (error) {
    console.error('POST /api/articles error:', error);
    return Response.json({ error: 'Failed to create article' }, { status: 500 });
  }
}