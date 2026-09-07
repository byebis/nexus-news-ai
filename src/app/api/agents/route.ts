import { fetchAgents, updateAgent } from '@/lib/api';
import { requireRole } from '@/lib/auth';

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
  // Solo admin può modificare gli agenti
  const guard = await requireRole(request, ['admin']);
  if (guard.error) return guard.error;

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
