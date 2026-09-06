import { runAllAgents, checkCronAuth } from '@/lib/collect-all';

export const maxDuration = 300;

/**
 * Runs all ACTIVE agents sequentially.
 * Auth: if CRON_SECRET env is set, requests must include header "x-cron-secret" or ?secret=.
 */
async function handle(request: Request) {
  if (!checkCronAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const force = new URL(request.url).searchParams.get('force') === '1';
  const result = await runAllAgents({ force });
  return Response.json(result);
}

export async function POST(request: Request) {
  try {
    return Response.json(await handle(request));
  } catch (error) {
    console.error('POST /api/collect-all error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    return Response.json(await handle(request));
  } catch (error) {
    console.error('GET /api/collect-all error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
