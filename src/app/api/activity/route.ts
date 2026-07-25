import { fetchActivityLogs, createActivityLog } from '@/lib/api';

export async function GET() {
  try {
    const logs = await fetchActivityLogs();
    return Response.json(logs);
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return Response.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { agentId, action, detail, status } = await request.json();
    const log = await createActivityLog(agentId, action, detail, status);
    return Response.json(log);
  } catch (error) {
    console.error('POST /api/activity error:', error);
    return Response.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}