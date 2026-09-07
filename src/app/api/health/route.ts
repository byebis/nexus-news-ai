import { supabase } from '@/lib/supabase';
import { fetchRssItems } from '@/lib/rss';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string; ms: number }> = {};

  // Supabase
  let t0 = Date.now();
  try {
    const { error } = await supabase.from('agents').select('id').limit(1);
    checks.supabase = { ok: !error, detail: error ? error.message : 'connesso', ms: Date.now() - t0 };
  } catch (e) {
    checks.supabase = { ok: false, detail: e instanceof Error ? e.message : 'errore', ms: Date.now() - t0 };
  }

  // OpenRouter key presence (not validity - no cost)
  const hasKey = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10;
  checks.openrouter = { ok: hasKey, detail: hasKey ? 'chiave configurata' : 'OPENROUTER_API_KEY mancante', ms: 0 };

  // RSS sources
  t0 = Date.now();
  try {
    const { items, errors } = await fetchRssItems('Tecnologia');
    checks.rss = { ok: items.length > 0, detail: items.length > 0 ? `${items.length} notizie disponibili` : `nessuna notizia: ${errors.join('; ')}`, ms: Date.now() - t0 };
  } catch (e) {
    checks.rss = { ok: false, detail: e instanceof Error ? e.message : 'errore RSS', ms: Date.now() - t0 };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return Response.json({ status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() }, { status: allOk ? 200 : 503 });
}
