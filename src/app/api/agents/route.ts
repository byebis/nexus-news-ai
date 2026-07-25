import { fetchAgents, updateAgent } from '@/lib/api';

export async function GET() {
  try {
    const agents = await fetchAgents();
    return Response.json(agents);
  } catch (error) {
    console.error('GET /api/agents error:', error);
    return Response.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const agent = await updateAgent(id, data);
    return Response.json(agent);
  } catch (error) {
    console.error('PUT /api/agents error:', error);
    return Response.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}
