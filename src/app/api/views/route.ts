import { registerView } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json();
    if (!articleId) {
      return Response.json({ error: 'articleId required' }, { status: 400 });
    }
    await registerView(articleId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('POST /api/views error:', error);
    return Response.json({ error: 'Failed to register view' }, { status: 500 });
  }
}
