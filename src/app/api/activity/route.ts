import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.activityLog.findMany({
      include: {
        agent: { select: { id: true, name: true, avatar: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return Response.json(logs);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { agentId, action, detail, status } = await request.json();
    const log = await db.activityLog.create({
      data: {
        agentId,
        action,
        detail: detail || '',
        status: status || 'info',
      },
      include: {
        agent: { select: { id: true, name: true, avatar: true, category: true } },
      },
    });
    return Response.json(log);
  } catch (error) {
    return Response.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}