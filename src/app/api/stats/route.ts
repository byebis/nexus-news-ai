import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [articlesRes, agentsRes, logsRes] = await Promise.all([
      supabase.from('articles').select('id, status, category, quality_score, created_at, published_at, agent_id'),
      supabase.from('agents').select('id, name, category, status, last_run'),
      supabase.from('activity_logs').select('id, status, action, created_at').gte('created_at', since7d),
    ]);

    const articles = (articlesRes.data || []) as Array<Record<string, unknown>>;
    const agents = (agentsRes.data || []) as Array<Record<string, unknown>>;
    const logs = (logsRes.data || []) as Array<Record<string, unknown>>;

    const byStatus: Record<string, number> = { published: 0, approved: 0, pending_approval: 0, rejected: 0 };
    const byCategory: Record<string, number> = {};
    const scoreList: number[] = [];
    const scoreByAgent: Record<string, number[]> = {};
    let published7d = 0;

    for (const a of articles) {
      const status = String(a.status || 'unknown');
      byStatus[status] = (byStatus[status] || 0) + 1;
      const cat = String(a.category || 'Altro');
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      const q = Number(a.quality_score);
      if (!isNaN(q)) {
        scoreList.push(q);
        const ag = String(a.agent_id || 'none');
        (scoreByAgent[ag] = scoreByAgent[ag] || []).push(q);
      }
      const ts = String(a.published_at || '');
      if (ts && new Date(ts).getTime() > Date.now() - 7 * 24 * 3600 * 1000) published7d++;
    }

    const agentStats = agents.map((ag) => {
      const scores = scoreByAgent[String(ag.id)] || [];
      return {
        name: String(ag.name || '?'),
        category: String(ag.category || ''),
        status: String(ag.status || ''),
        lastRun: ag.last_run ? String(ag.last_run) : null,
        articles: scores.length,
        avgScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
      };
    }).sort((a, b) => b.articles - a.articles);

    // Articles per day, last 14 days
    const perDay: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 3600 * 1000);
      const key = day.toISOString().slice(0, 10);
      perDay.push({ date: key, count: 0 });
    }
    const dayMap = Object.fromEntries(perDay.map((d) => [d.date, d]));
    for (const a of articles) {
      const key = String(a.created_at || '').slice(0, 10);
      if (dayMap[key]) dayMap[key].count++;
    }

    const successLogs = logs.filter((l) => l.status === 'success').length;
    const errorLogs = logs.filter((l) => l.status === 'error').length;

    return Response.json({
      totals: {
        articles: articles.length,
        published: byStatus.published || 0,
        approved: byStatus.approved || 0,
        pending: byStatus.pending_approval || 0,
        rejected: byStatus.rejected || 0,
        published7d,
        agents: agents.length,
        activeAgents: agents.filter((a) => a.status === 'active').length,
        avgQuality: scoreList.length ? Math.round(scoreList.reduce((s, v) => s + v, 0) / scoreList.length) : 0,
        successRate: logs.length ? Math.round((successLogs / logs.length) * 100) : 100,
        errors7d: errorLogs,
        operations7d: logs.length,
      },
      byCategory,
      perDay,
      agents: agentStats,
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return Response.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
