import { supabase, generateId, transformRows, toCamelCase } from '@/lib/supabase';
import { processWithAI } from '@/lib/ai-engine';

// ============================================
// Types
// ============================================

export interface AgentRow {
  id: string;
  name: string;
  avatar: string;
  category: string;
  description: string;
  status: string;
  personality: string;
  last_run: string | null;
  created_at: string;
  updated_at: string;
  articles?: Array<{ count: number }>;
  activity_logs?: Array<{ count: number }>;
}

export interface ArticleRow {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  category: string;
  agent_id: string;
  source_name: string;
  source_url: string;
  image_url: string;
  status: string;
  quality_score: number;
  read_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  agent?: { id: string; name: string; avatar: string; category: string };
  publish_logs?: PublishLogRow[];
  approval_log?: ApprovalLogRow | null;
}

export interface PublishLogRow {
  id: string;
  article_id: string;
  platform: string;
  status: string;
   post_id: string;
  post_url: string;
  error: string;
  published_at: string | null;
  created_at: string;
}

export interface ApprovalLogRow {
  id: string;
  article_id: string;
  reviewer_action: string;
  reviewer_note: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  agent_id: string;
  action: string;
  detail: string;
  status: string;
  created_at: string;
  agent?: { id: string; name: string; avatar: string; category: string };
}

export interface SettingsRow {
  id: string;
  mode: string;
  auto_collect: boolean;
  auto_evaluate: boolean;
  auto_rewrite: boolean;
  auto_publish: boolean;
  collect_interval: number;
  max_articles_per_day: number;
  social_platforms: string;
  site_name: string;
  site_tagline: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Transform helpers
// ============================================

function toAgent(row: AgentRow): import('@/lib/store').Agent {
  const r = toCamelCase(row) as any;
  return {
    ...r,
    _count: {
      articles: r.articles?.[0]?.count || 0,
      activityLogs: r.activityLogs?.[0]?.count || 0,
    },
  };
}

function toArticle(row: ArticleRow): import('@/lib/store').Article {
  const r = toCamelCase(row) as any;
  return {
    ...r,
    agent: r.agent || { id: '', name: 'AI Agent', avatar: '', category: '' },
    publishLogs: Array.isArray(r.publishLogs) ? transformRows(r.publishLogs) : [],
    approvalLog: r.approvalLog ? toCamelCase(r.approvalLog as Record<string, unknown>) as any : null,
  };
}

function toActivityLog(row: ActivityLogRow): import('@/lib/store').ActivityLog {
  const r = toCamelCase(row) as any;
  return {
    ...r,
    agent: r.agent || { id: '', name: 'AI Agent', avatar: '', category: '' },
  };
}

// ============================================
// API Functions
// ============================================

export async function fetchAgents(): Promise<import('@/lib/store').Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*, articles(count), activity_logs(count)')
    .order('created_at', { ascending: true });
  if (error) console.error('fetchAgents error:', error);
  if (!data) return [];
  return data.map(toAgent);
}

export async function fetchArticles(params: {
  category?: string;
  status?: string;
  limit?: number;
}): Promise<import('@/lib/store').Article[]> {
  let query = supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_log(*)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (category && category !== 'all') query = query.eq('category', category);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) console.error('fetchArticles error:', error);
  if (!data) return [];
  return data.map(toArticle);
}

export async function fetchArticleById(id: string): Promise<import('@/lib/store').Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_log(*)')
    .eq('id', id)
    .single();
  if (error) console.error('fetchArticleById error:', error);
  if (!data) return null;
  return toArticle(data);
}

export async function fetchPendingArticles(): Promise<import('@/lib/store').Article[]> {
  return fetchArticles({ status: 'pending_approval' });
}

export async function fetchApprovedArticles(): Promise<import('@/lib/store').Article[]> {
  const approved = await fetchArticles({ status: 'approved' });
  const published = await fetchArticles({ status: 'published', limit: 10 });
  const ids = new Set(approved.map(a => a.id));
  const newOnes = published.filter((a: import('@/lib/store').Article) => !ids.has(a.id));
  return [...approved, ...newOnes];
}

export async function updateAgent(id: string, data: { name?: string; avatar?: string; description?: string; personality?: string; status?: string }) {
  const { data: result, error } = await supabase
    .from('agents')
    .update({
      name: data.name,
      avatar: data.avatar,
      description: data.description,
      personality: data.personality,
      status: data.status,
    })
    .eq('id', id)
    .select();
  if (error) console.error('updateAgent error:', error);
  return toCamelCase(result) as any;
}

export async function approveArticle(articleId: string, action: string, note?: string) {
  // Create or update approval log
  const existing = await supabase
    .from('approval_logs')
    .select('id')
    .eq('article_id', articleId)
    .single();

  if (existing.data) {
    await supabase
      .from('approval_logs')
      .update({
        reviewer_action: action,
        reviewer_note: note || '',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', existing.data.id);
  } else {
    await supabase
      .from('approval_logs')
      .insert({
        article_id: articleId,
        reviewer_action: action,
        reviewer_note: note || '',
        reviewed_at: new Date().toISOString(),
      });
  }

  const newStatus = action === 'approved' ? 'approved' : 'rejected';
  await supabase
    .from('articles')
    .update({ status: newStatus })
    .eq('id', articleId);

  const { data: updated } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_log(*)')
    .eq('id', articleId)
    .single();

  if (!updated) throw new Error('Article not found after approval');
  return toArticle(updated);
}

export async function publishArticle(articleId: string, platforms: string[]) {
  const validPlatforms = ['blog', 'twitter', 'facebook', 'linkedin', 'instagram'];

  for (const platform of platforms) {
    if (!validPlatforms.includes(platform)) continue;
    const success = Math.random() > 0.15;
    await supabase.from('publish_logs').insert({
      article_id: articleId,
      platform,
      status: success ? 'published' : 'failed',
      post_id: `post_${Date.now()}_${platform}`,
      post_url: success ? `https://${platform}.com/post/${Date.now()}` : '',
      error: success ? '' : 'Timeout di connessione - ritentare',
      published_at: success ? new Date().toISOString() : null,
    });
  }

  const { data: logs } = await supabase
    .from('publish_logs')
    .select('status')
    .eq('article_id', articleId);

  const anyPublished = logs?.some((l: { status: string }) => l.status === 'published');

  if (anyPublished) {
    await supabase
      .from('articles')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', articleId);
  }

  const { data: updated } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_log(*)')
    .eq('id', articleId)
    .single();

  if (!updated) throw new Error('Article not found after publish');
  return toArticle(updated);
}

export async function collectNews(agentId: string) {
  // Get agent info
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (!agent) throw new Error('Agent not found');

  // Get settings
  const { data: settingsRaw } = await supabase
    .from('settings')
    .select('*')
    .single();
  const settings = toCamelCase(settingsRaw || {}) as any;
  const isFullyAutonomous = settings?.mode === 'fully_autonomous';

  // Log: collecting
  await supabase.from('activity_logs').insert({
    agent_id: agentId,
    action: 'collecting',
    detail: `Inizio raccolta notizie per la categoria ${agent.category}...`,
    status: 'info',
  });

  // Check for OpenRouter API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('API key OpenRouter non configurata. Aggiungi OPENROUTER_API_KEY nelle variabili d\'ambiente.');
  }

  // Real AI pipeline
  const result = await processWithAI(agent.category, agent.name, agent.personality, apiKey);

  // Log: AI processing complete
  const modelInfo = result.modelsUsed.map(m => `${m.phase}: ${m.model}`).join(', ');
  await supabase.from('activity_logs').insert({
    agent_id: agentId,
    action: 'evaluating',
    detail: `AI: raccolti ${result.collected}, valutati ${result.evaluated}, riscritti ${result.rewritten}` +
      (modelInfo ? ` | Modelli: ${modelInfo}` : ''),
    status: result.errors.length === 0 ? 'success' : 'warning',
  });

  if (result.errors.length > 0) {
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'error',
      detail: `Errori AI: ${result.errors.slice(0, 3).join('; ')}`,
      status: 'error',
    });
  }

  const createdArticles = [];
  for (const article of result.articles) {
    const articleId = generateId();
    const initialStatus = isFullyAutonomous ? 'approved' : 'pending_approval';

    const { error } = await supabase.from('articles').insert({
      id: articleId,
      title: article.title,
      subtitle: article.subtitle,
      content: article.content,
      summary: article.summary,
      category: article.category,
      agent_id: agent.id,
      source_name: article.sourceName,
      source_url: article.sourceUrl,
      quality_score: article.qualityScore,
      read_time: article.readTime,
      status: initialStatus,
    });

    if (error) continue;

    if (isFullyAutonomous) {
      await supabase.from('approval_logs').insert({
        article_id: articleId,
        reviewer_action: 'approved',
        reviewer_note: 'Approvazione automatica - modalita completamente autonoma',
        reviewed_at: new Date().toISOString(),
      });
    }

    createdArticles.push({
      ...article,
      id: articleId,
    });
  }

  // Log: rewriting complete
  await supabase.from('activity_logs').insert({
    agent_id: agentId,
    action: 'rewriting',
    detail: `${result.rewritten} articoli riscritti e pronti per la pubblicazione`,
    status: 'success',
  });

  // Update agent last run
  await supabase
    .from('agents')
    .update({ last_run: new Date().toISOString() })
    .eq('id', agentId);

  return {
    success: result.success,
    collected: result.collected,
    evaluated: result.evaluated,
    created: result.rewritten,
    articles: createdArticles,
    mode: isFullyAutonomous ? 'fully_autonomous' : 'semi_autonomous',
    modelsUsed: result.modelsUsed,
  };
}

export async function fetchActivityLogs(): Promise<import('@/lib/store').ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, agent:agents(id, name, avatar, category)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) console.error('fetchActivityLogs error:', error);
  if (!data) return [];
  return data.map(toActivityLog);
}

export async function fetchSettings(): Promise<import('@/lib/store').Settings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
  if (error) console.error('fetchSettings error:', error);
  if (!data) return null;
  return toCamelCase(data) as any;
}

export async function updateSettings(settingsData: Record<string, unknown>) {
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .single();

  let result;
  if (existing) {
    const { data: updated, error } = await supabase
      .from('settings')
      .update(settingsData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from('settings')
      .insert(settingsData)
      .select()
      .single();
    if (error) throw error;
    result = inserted;
  }

  return toCamelCase(result) as any;
}

export async function createActivityLog(agentId: string, action: string, detail: string, status: string) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({ agent_id: agentId, action, detail, status })
    .select('*, agent:agents(id, name, avatar, category)')
    .single();
  if (error) console.error('createActivityLog error:', error);
  return toActivityLog(data);
}
