import { db } from '@/lib/db';

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: {
        _count: { select: { articles: true, activityLogs: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return Response.json(agents);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const agent = await db.agent.update({
      where: { id },
      data: {
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        personality: data.personality,
        status: data.status,
      },
    });
    return Response.json(agent);
  } catch (error) {
    return Response.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}