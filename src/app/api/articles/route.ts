import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') where.category = category;
    if (status) where.status = status;

    const articles = await db.article.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, avatar: true, category: true } },
        publishLogs: true,
        approvalLog: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return Response.json(articles);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const article = await db.article.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || '',
        content: body.content,
        summary: body.summary || '',
        category: body.category,
        agentId: body.agentId,
        sourceName: body.sourceName || '',
        sourceUrl: body.sourceUrl || '',
        imageUrl: body.imageUrl || '',
        status: body.status || 'draft',
        qualityScore: body.qualityScore || 0,
        readTime: body.readTime || 3,
      },
      include: {
        agent: true,
      },
    });
    return Response.json(article);
  } catch (error) {
    return Response.json({ error: 'Failed to create article' }, { status: 500 });
  }
}