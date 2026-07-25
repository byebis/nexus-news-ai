import { collectNews } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return Response.json({ error: 'agentId required' }, { status: 400 });
    }

    const result = await collectNews(agentId);
    return Response.json(result);
  } catch (error) {
    console.error('POST /api/collect error:', error);
    return Response.json({ error: 'Failed to collect news' }, { status: 500 });
  }
}
