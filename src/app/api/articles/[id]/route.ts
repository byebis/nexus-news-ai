import { fetchArticleById } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await fetchArticleById(id);
    if (!article) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(article);
  } catch (error) {
    console.error('GET /api/articles/[id] error:', error);
    return Response.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert camelCase to snake_case for Supabase
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
    if (body.content !== undefined) updates.content = body.content;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.category !== undefined) updates.category = body.category;
    if (body.status !== undefined) updates.status = body.status;
    if (body.qualityScore !== undefined) updates.quality_score = body.qualityScore;
    if (body.readTime !== undefined) updates.read_time = body.readTime;
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_log(*)')
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    console.error('PUT /api/articles/[id] error:', error);
    return Response.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error);
    return Response.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}