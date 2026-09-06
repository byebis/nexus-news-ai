import { collectNews, fetchAgents, fetchSettings } from '@/lib/api';

export interface CollectAllResult {
  success: boolean;
  ran: number;
  created: number;
  skippedAll?: string;
  results: Array<{ agent: string; ok: boolean; created?: number; error?: string; skipped?: boolean }>;
  timestamp: string;
}

/**
 * Runs all ACTIVE agents sequentially (shared by /api/collect-all and /api/cron).
 */
export async function runAllAgents(options?: { force?: boolean }): Promise<CollectAllResult | { skipped: true; reason: string }> {
  if (!options?.force) {
    const settings = await fetchSettings();
    if (settings && (settings as { autoCollect?: boolean }).autoCollect === false) {
      return { skipped: true, reason: 'autoCollect disabilitato nelle impostazioni' };
    }
  }

  const agents = await fetchAgents();
  const active = agents.filter((a) => a.status === 'active');

  const results: CollectAllResult['results'] = [];
  for (const agent of active) {
    try {
      const res = await collectNews(agent.id);
      results.push({ agent: agent.name, ok: true, created: res.created ?? 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ agent: agent.name, ok: false, skipped: msg.startsWith('LOCK:'), error: msg.slice(0, 160) });
    }
  }

  return {
    success: true,
    ran: results.length,
    created: results.reduce((s, r) => s + (r.created || 0), 0),
    results,
    timestamp: new Date().toISOString(),
  };
}

export function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured -> open (matches project zero-config philosophy)
  const url = new URL(request.url);
  return request.headers.get('x-cron-secret') === secret || url.searchParams.get('secret') === secret;
}
