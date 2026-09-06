import { runAllAgents, checkCronAuth } from '@/lib/collect-all';

export const maxDuration = 300;

/**
 * Cron endpoint for external schedulers (GitHub Actions, cron-job.org...).
 * GET/POST /api/cron?secret=XXX  (or header x-cron-secret)
 * Runs all active agents (respects autoCollect setting; use &force=1 to bypass).
 */
async function handle(request: Request) {
  if (!checkCronAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const force = new URL(request.url).searchParams.get('force') === '1';
  return Response.json(await runAllAgents({ force }));
}

export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    console.error('POST /api/cron error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    console.error('GET /api/cron error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
