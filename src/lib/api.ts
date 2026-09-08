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
  image_credit: string;
  image_credit_url: string;
  status: string;
  quality_score: number;
  read_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  agent?: { id: string; name: string; avatar: string; category: string };
  publish_logs?: PublishLogRow[];
  approval_logs?: ApprovalLogRow[] | null;
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
    approvalLog: Array.isArray(r.approvalLogs) && r.approvalLogs.length > 0
      ? (toCamelCase(r.approvalLogs[0] as Record<string, unknown>) as any)
      : null,
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

export async function fetchArticles({ category, status, limit, agentId }: {
  category?: string;
  status?: string;
  limit?: number;
  agentId?: string;
}): Promise<import('@/lib/store').Article[]> {
  let query = supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_logs(*)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (category && category !== 'all') query = query.eq('category', category);
  if (agentId) query = query.eq('agent_id', agentId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) console.error('fetchArticles error:', error);
  if (!data) return [];
  return data.map(toArticle);
}

export async function fetchArticleById(id: string): Promise<import('@/lib/store').Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_logs(*)')
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

  const newStatus = (action === 'approve' || action === 'approved') ? 'approved' : 'rejected';
  await supabase
    .from('articles')
    .update({ status: newStatus })
    .eq('id', articleId);

  const { data: updated } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_logs(*)')
    .eq('id', articleId)
    .single();

  if (!updated) throw new Error('Article not found after approval');
  return toArticle(updated);
}

// ============================================
// Pubblicazione multi-canale REALE
// blog = sito stesso (sempre reale) | telegram = Bot API reale | webhook = automazione reale
// twitter/linkedin/instagram/facebook = via relay webhook configurato, altrimenti skip onesto
// ============================================

export interface PublishResult {
  platform: string;
  status: 'published' | 'failed' | 'skipped';
  detail: string;
  postUrl?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexus-news-ai.pages.dev';

function buildTelegramText(article: { id: string; title: string; summary: string; category: string }): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const summary = esc(article.summary || '').slice(0, 600);
  const category = esc(article.category || 'news').toLowerCase().replace(/\s+/g, '');
  return `📰 <b>${esc(article.title)}</b>\n\n${summary}\n\n🔗 ${SITE_URL}/articolo/\u200b${article.id}\n#${category} #NexusNewsAI`;
}

async function publishToChannel(
  platform: string,
  article: { id: string; title: string; summary: string; category: string; content: string; sourceName: string },
  channels: Map<string, { enabled: boolean; config: Record<string, string> }>
): Promise<PublishResult> {
  const articleUrl = `${SITE_URL}/articolo/${article.id}`;
  const ch = channels.get(platform);

  if (platform === 'blog') {
    return { platform, status: 'published', detail: 'Pubblicato sul blog Nexus', postUrl: articleUrl };
  }

  if (!ch || !ch.enabled) {
    return {
      platform,
      status: 'skipped',
      detail: 'Canale non configurato: attivalo e inserisci le credenziali in Impostazioni → Canali.',
    };
  }

  const timeout = (ms: number) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    return { signal: c.signal, clear: () => clearTimeout(t) };
  };

  try {
    if (platform === 'telegram') {
      const token = ch.config.bot_token?.trim();
      const chatId = ch.config.chat_id?.trim();
      if (!token || !chatId) {
        return { platform, status: 'skipped', detail: 'Canale non configurato: mancano bot_token o chat_id.' };
      }
      const t = timeout(12_000);
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildTelegramText(article),
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
        signal: t.signal,
      });
      t.clear();
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        return { platform, status: 'published', detail: 'Inviato su Telegram', postUrl: data.result?.message_id ? `https://t.me/c/${chatId.replace('-100', '')}/${data.result.message_id}` : undefined };
      }
      return { platform, status: 'failed', detail: `Telegram: ${data?.description || `HTTP ${res.status}`}` };
    }

    // webhook globale o relay per-social
    let url = '';
    if (platform === 'webhook') {
      url = ch.config.url?.trim() || '';
    } else {
      url = ch.config.relay_webhook?.trim() || '';
      if (!url) {
        // fallback: relay globale attivo
        const globalWebhook = channels.get('webhook');
        if (globalWebhook?.enabled && globalWebhook.config.url?.trim()) {
          url = globalWebhook.config.url.trim();
        } else {
          return {
            platform,
            status: 'skipped',
            detail: 'Canale non configurato: serve un relay webhook (Make/Zapier/n8n) oppure il webhook globale.',
          };
        }
      }
    }
    if (!url || !/^https?:\/\//.test(url)) {
      return { platform, status: 'skipped', detail: 'Canale non configurato: URL webhook mancante o non valido.' };
    }

    const t = timeout(12_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ch.config.secret ? { 'X-Nexus-Secret': ch.config.secret } : {}),
      },
      body: JSON.stringify({
        type: 'article_published',
        channel: platform,
        article: {
          id: article.id,
          title: article.title,
          summary: article.summary,
          url: articleUrl,
          category: article.category,
          source: article.sourceName,
          excerpt: article.content?.slice(0, 500) || '',
        },
        timestamp: new Date().toISOString(),
      }),
      signal: t.signal,
    });
    t.clear();
    if (res.ok) {
      return { platform, status: 'published', detail: `Inviato via webhook (HTTP ${res.status})` };
    }
    return { platform, status: 'failed', detail: `Webhook ha risposto HTTP ${res.status}` };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return { platform, status: 'failed', detail: isTimeout ? 'Timeout di connessione (12s)' : `Errore di rete: ${err instanceof Error ? err.message : 'sconosciuto'}` };
  }
}

export async function publishArticle(articleId: string, platforms: string[]) {
  const { data: articleRow } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();
  if (!articleRow) throw new Error('Articolo non trovato');

  const { data: channelRows } = await supabase.from('channel_configs').select('*');
  const channels = new Map<string, { enabled: boolean; config: Record<string, string> }>();
  for (const row of channelRows || []) {
    channels.set(row.channel, { enabled: !!row.enabled, config: (row.config as Record<string, string>) || {} });
  }

  // Stato attuale per-platform (per evitare doppioni)
  const { data: existingLogs } = await supabase
    .from('publish_logs')
    .select('platform, status')
    .eq('article_id', articleId);
  const lastStatus = new Map<string, string>();
  for (const log of existingLogs || []) {
    lastStatus.set((log as { platform: string }).platform, (log as { status: string }).status);
  }

  const validPlatforms = ['blog', 'telegram', 'webhook', 'twitter', 'linkedin', 'instagram', 'facebook'];
  const results: PublishResult[] = [];

  for (const platform of platforms) {
    if (!validPlatforms.includes(platform)) continue;
    if (lastStatus.get(platform) === 'published') {
      results.push({ platform, status: 'skipped', detail: 'Già pubblicato su questo canale in precedenza.' });
      continue;
    }
    const result = await publishToChannel(platform, articleRow, channels);
    results.push(result);

    await supabase.from('publish_logs').insert({
      article_id: articleId,
      platform,
      status: result.status === 'published' ? 'published' : result.status === 'skipped' ? 'skipped' : 'failed',
      post_id: result.status === 'published' ? `post_${Date.now()}_${platform}` : '',
      post_url: result.postUrl || '',
      error: result.status === 'published' ? '' : result.detail,
      published_at: result.status === 'published' ? new Date().toISOString() : null,
    });
  }

  const anyPublished = results.some((r) => r.status === 'published');
  if (anyPublished && articleRow.status !== 'published') {
    await supabase
      .from('articles')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', articleId);
    await supabase.from('activity_logs').insert({
      agent_id: 'sys-redazione',
      action: 'publishing',
      detail: `Articolo "${articleRow.title}" pubblicato su: ${results.filter((r) => r.status === 'published').map((r) => r.platform).join(', ')}`,
      status: 'success',
    });
  }

  const { data: updated } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category), publish_logs(*), approval_logs(*)')
    .eq('id', articleId)
    .single();

  if (!updated) throw new Error('Article not found after publish');
  return { article: toArticle(updated), results };
}

export async function collectNews(agentId: string) {
  // Get agent info
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (!agent) throw new Error('Agent not found');

  // Run lock: prevent double-click / parallel runs of the same agent
  if (agent.last_run) {
    const elapsed = Date.now() - new Date(agent.last_run).getTime();
    if (elapsed < 90_000) {
      throw new Error('LOCK: questo agente è già in esecuzione o ha appena finito. Riprova tra meno di un minuto.');
    }
  }

  // Get settings
  const { data: settingsRaw } = await supabase
    .from('settings')
    .select('*')
    .single();
  const settings = toCamelCase(settingsRaw || {}) as any;
  const isFullyAutonomous = settings?.mode === 'fully_autonomous';
  const autoPublishOn = !!settings?.autoPublish;
  const AUTOPILOT_THRESHOLD = 80;

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

  const createdArticles: Array<Record<string, unknown>> = [];
  for (const article of result.articles) {
    const articleId = generateId();

    // AUTOPILOTA: se auto_publish è attivo e la qualità è sufficiente,
    // l'articolo va direttamente pubblicato senza passare dalla coda.
    let initialStatus = 'pending_approval';
    let publishedAt: string | null = null;
    let approvalNote = '';

    if (autoPublishOn && article.qualityScore >= AUTOPILOT_THRESHOLD) {
      initialStatus = 'published';
      publishedAt = new Date().toISOString();
      approvalNote = `Autopilota: qualità ${article.qualityScore} ≥ ${AUTOPILOT_THRESHOLD} → pubblicato automaticamente`;
    } else if (isFullyAutonomous) {
      initialStatus = 'approved';
      approvalNote = 'Approvazione automatica - modalita completamente autonoma';
    }

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
      image_url: article.imageUrl || '',
      image_credit: article.imageCredit || '',
      image_credit_url: article.imageCreditUrl || '',
      quality_score: article.qualityScore,
      read_time: article.readTime,
      status: initialStatus,
      published_at: publishedAt,
    });

    if (error) continue;

    if (approvalNote) {
      await supabase.from('approval_logs').insert({
        article_id: articleId,
        reviewer_action: 'approved',
        reviewer_note: approvalNote,
        reviewed_at: new Date().toISOString(),
      });
    }

    if (initialStatus === 'published') {
      // Registra pubblicazione automatica sulla piattaforma blog
      await supabase.from('publish_logs').insert({
        article_id: articleId,
        platform: 'blog',
        status: 'published',
        post_id: `auto_${Date.now()}`,
        post_url: '',
        error: '',
        published_at: publishedAt,
      });
      await supabase.from('activity_logs').insert({
        agent_id: agent.id,
        action: 'publishing',
        detail: `Autopilota: "${article.title}" pubblicato (qualità ${article.qualityScore})`,
        status: 'success',
      });
    }

    createdArticles.push({
      ...article,
      id: articleId,
      status: initialStatus,
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

// ============================================
// Views / Trending (via activity_logs action='view')
// ============================================

export async function registerView(articleId: string) {
  // Recupera l'agente dell'articolo (agent_id è NOT NULL su activity_logs)
  const { data: article } = await supabase
    .from('articles')
    .select('agent_id')
    .eq('id', articleId)
    .single();
  if (!article?.agent_id) throw new Error('Article not found for view');

  const { error } = await supabase.from('activity_logs').insert({
    agent_id: article.agent_id,
    action: 'view',
    detail: articleId,
    status: 'success',
  });
  if (error) throw new Error('Failed to register view');
  return { success: true };
}

export async function getArticleViews(articleId: string): Promise<number> {
  const { count, error } = await supabase
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'view')
    .eq('detail', articleId);
  if (error) return 0;
  return count || 0;
}

/** Letture totali aggregate su un set di articoli (Level 13 — pagine autore) */
export async function getTotalViewsForArticles(articleIds: string[]): Promise<number> {
  if (!articleIds.length) return 0;
  const { count, error } = await supabase
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'view')
    .in('detail', articleIds);
  if (error) return 0;
  return count || 0;
}

export interface TrendingItem {
  article: import('@/lib/store').Article;
  views: number;
}

export async function fetchTrendingArticles(limit = 5): Promise<TrendingItem[]> {
  // Prendi gli ultimi eventi di lettura e aggrega in memoria
  const { data: viewLogs, error } = await supabase
    .from('activity_logs')
    .select('detail')
    .eq('action', 'view')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error || !viewLogs) return [];

  const counts = new Map<string, number>();
  for (const row of viewLogs) {
    const id = (row as { detail: string }).detail;
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    .map(([id]) => id);
  if (topIds.length === 0) return [];

  const { data: articles } = await supabase
    .from('articles')
    .select('*, agent:agents(id, name, avatar, category)')
    .eq('status', 'published')
    .in('id', topIds);
  if (!articles) return [];

  return articles
    .map(row => ({
      article: toArticle(row),
      views: counts.get((row as { id: string }).id) || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
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

const SETTINGS_FIELD_MAP: Record<string, string> = {
  // accetta sia camelCase (UI client) che snake_case (route server)
  mode: 'mode',
  autoCollect: 'auto_collect',
  auto_collect: 'auto_collect',
  autoEvaluate: 'auto_evaluate',
  auto_evaluate: 'auto_evaluate',
  autoRewrite: 'auto_rewrite',
  auto_rewrite: 'auto_rewrite',
  autoPublish: 'auto_publish',
  auto_publish: 'auto_publish',
  collectInterval: 'collect_interval',
  collect_interval: 'collect_interval',
  maxArticlesPerDay: 'max_articles_per_day',
  max_articles_per_day: 'max_articles_per_day',
  socialPlatforms: 'social_platforms',
  social_platforms: 'social_platforms',
  siteName: 'site_name',
  site_name: 'site_name',
  siteTagline: 'site_tagline',
  site_tagline: 'site_tagline',
};

export async function updateSettings(settingsData: Record<string, unknown>) {
  // Converti camelCase (UI) -> snake_case (Supabase)
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settingsData)) {
    const col = SETTINGS_FIELD_MAP[key];
    if (col) mapped[col] = value;
  }

  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .single();

  let result;
  if (existing) {
    const { data: updated, error } = await supabase
      .from('settings')
      .update(mapped)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from('settings')
      .insert(mapped)
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

// ============================================
// LEVEL UP 5 — TRANSLATIONS (EN edition)
// ============================================

export interface TranslationResult {
  titleEn: string | null;
  subtitleEn: string | null;
  summaryEn: string | null;
  contentEn: string | null;
  cached: boolean;
}

/** Translate an article to English via LLM; cached in DB forever. */
export async function translateArticle(articleId: string): Promise<TranslationResult> {
  const { data: row } = await supabase
    .from('articles')
    .select('id, title, subtitle, summary, content, title_en, subtitle_en, summary_en, content_en, status')
    .eq('id', articleId)
    .single();

  if (!row) throw new Error('Articolo non trovato');
  if (row.status === 'pending_approval' || row.status === 'rejected') {
    throw new Error('Articolo non pubblicabile');
  }

  // Cached?
  if (row.content_en) {
    return {
      titleEn: row.title_en || null,
      subtitleEn: row.subtitle_en || null,
      summaryEn: row.summary_en || null,
      contentEn: row.content_en,
      cached: true,
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('API key OpenRouter non configurata');
  }

  const prompt = `Translate this Italian news article into English for an international audience.
Keep the journalistic tone, the agent's voice and all facts. Do not add new facts.

- TITLE: ${row.title}
- SUBTITLE: ${row.subtitle || ''}
- SUMMARY: ${row.summary}
- CONTENT:
${(row.content || '').slice(0, 6000)}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "English title",
  "subtitle": "English subtitle (empty string if none)",
  "summary": "English summary",
  "content": "Full English article, same paragraphs separated by \\n\\n"
}

Do NOT include markdown, comments or text outside the JSON.`;

  const { chatWithFallback } = await import('@/lib/openrouter');
  const { repairParse } = await import('@/lib/ai-engine');
  const result = await chatWithFallback([{ role: 'user', content: prompt }], 'translate', apiKey);
  if (!result.success || !result.response) {
    throw new Error(
      'Traduzione fallita: tutti i modelli hanno risposto errore. ' +
      result.errors.map((e) => `${e.model}: ${e.error.slice(0, 80)}`).join(' | ')
    );
  }

  const parsed = repairParse(result.response.content) as Record<string, string> | null;
  if (!parsed || !parsed.title || !parsed.content) {
    throw new Error('Risposta traduzione non valida dal modello ' + result.response.model);
  }

  const now = new Date().toISOString();
  await supabase
    .from('articles')
    .update({
      title_en: parsed.title,
      subtitle_en: parsed.subtitle || '',
      summary_en: parsed.summary || '',
      content_en: parsed.content,
      translated_at: now,
    })
    .eq('id', articleId);

  return {
    titleEn: parsed.title,
    subtitleEn: parsed.subtitle || '',
    summaryEn: parsed.summary || '',
    contentEn: parsed.content,
    cached: false,
  };
}

// ============================================
// LEVEL UP 5 — WEEKLY DIGESTS (newsroom threads)
// ============================================

function getWeekStartISO(offsetWeeks = 0): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday + offsetWeeks * 7);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function fetchWeeklyDigests(weekStart?: string) {
  let query = supabase
    .from('weekly_digests')
    .select('*, agent:agents(id, name, avatar, category)')
    .order('created_at', { ascending: false });
  if (weekStart) query = query.eq('week_start', weekStart);
  const { data, error } = await query;
  if (error) console.error('fetchWeeklyDigests error:', error);
  return (data || []).map((r) => toCamelCase(r)) as unknown as import('@/lib/store').WeeklyDigest[];
}

export interface DigestAgentRow {
  id: string;
  name: string;
  avatar: string;
  category: string;
  weekCount: number;
}

export async function fetchDigestAgents(): Promise<DigestAgentRow[]> {
  const weekStart = getWeekStartISO();
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, avatar, category')
    .neq('id', 'sys-redazione')
    .order('created_at', { ascending: true });

  const { data: counts, error } = await supabase
    .from('articles')
    .select('agent_id, id')
    .eq('status', 'published')
    .gte('published_at', `${weekStart}T00:00:00Z`);
  if (error) console.error('fetchDigestAgents count error:', error);

  const perAgent = new Map<string, number>();
  for (const a of counts || []) {
    perAgent.set((a as { agent_id: string }).agent_id, (perAgent.get((a as { agent_id: string }).agent_id) || 0) + 1);
  }

  return (agents || []).map((a) => ({
    id: (a as { id: string }).id,
    name: (a as { name: string }).name,
    avatar: (a as { avatar: string }).avatar,
    category: (a as { category: string }).category,
    weekCount: perAgent.get((a as { id: string }).id) || 0,
  }));
}

/** Generate (or regenerate) the weekly thread digest for one agent. */
export async function generateWeeklyDigest(agentId: string) {
  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, avatar, category, personality')
    .eq('id', agentId)
    .single();
  if (!agent) throw new Error('Agente non trovato');

  const weekStart = getWeekStartISO();
  const { data: articles } = await supabase
    .from('articles')
    .select('title, summary, category, quality_score, published_at')
    .eq('agent_id', agentId)
    .eq('status', 'published')
    .gte('published_at', `${weekStart}T00:00:00Z`)
    .order('published_at', { ascending: true });

  if (!articles || articles.length === 0) {
    throw new Error(`Nessun articolo pubblicato questa settimana per ${agent.name}. Genera prima qualche articolo.`);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('API key OpenRouter non configurata');
  }

  const list = articles
    .map((a, i) => `${i + 1}. ${(a as { title: string }).title} — ${(a as { summary: string }).summary?.slice(0, 200)}`)
    .join('\n');

  const prompt = `Sei ${agent.name}, giornalista AI di Nexus News AI specializzato in ${agent.category}. Personalità: "${agent.personality}".

Questa settimana hai pubblicato ${articles.length} articoli. Ecco i titoli e i riassunti:

${list}

Il tuo compito: scrivi un THREAD EDITORIALE di fine settimana (stile thread social: da 4 a 6 post brevi e incisivi, ognuno max 280 caratteri) che riassuma la tua settimana: apertura d'impatto, i temi chiave, un'osservazione originale, chiusura con invito a leggere gli articoli.

Rispondi ESATTAMENTE in questo formato a righe, senza markdown e senza il simbolo # :
TITLE: titolo del thread (max 80 caratteri, es. La settimana di ${agent.name}: ...)
POST: primo post
POST: secondo post
POST: terzo post
POST: quarto post

Ogni riga POST inizia con "POST: ". Nessun altro testo fuori dalle righe TITLE/POST.`;

  const { chatWithFallback } = await import('@/lib/openrouter');
  const { repairParse } = await import('@/lib/ai-engine');
  const result = await chatWithFallback([{ role: 'user', content: prompt }], 'digest', apiKey);
  if (!result.success || !result.response) {
    throw new Error(
      'Generazione digest fallita: ' +
      result.errors.map((e) => `${e.model}: ${e.error.slice(0, 80)}`).join(' | ')
    );
  }

  const raw = result.response.content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Parse line-based TITLE:/POST: format (robust), fallback to JSON repairParse
  let title = '';
  let posts: string[] = [];
  const titleMatch = raw.match(/^\s*TITLE\s*:\s*(.+)$/im);
  if (titleMatch) {
    title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
    const postRegex = /^\s*POST\s*\d*\s*:\s*(.+)$/gim;
    let m: RegExpExecArray | null;
    while ((m = postRegex.exec(raw)) !== null) {
      const p = m[1].trim();
      if (p && p.length > 3) posts.push(p);
    }
  }
  if (!title || posts.length === 0) {
    const parsed = repairParse(raw) as { title?: string; posts?: string[]; content?: string } | null;
    if (parsed?.title) title = parsed.title;
    if (Array.isArray(parsed?.posts) && parsed.posts.length > 0) {
      posts = parsed.posts.filter((p) => typeof p === 'string' && p.length > 3);
    } else if (parsed?.content && typeof parsed.content === 'string') {
      posts = parsed.content.split(/\n\n+/).filter((p) => p.trim().length > 3);
    }
  }
  if (!title || posts.length === 0) {
    throw new Error('Risposta digest non valida dal modello ' + result.response.model);
  }

  const content = posts.join('\n\n');
  const agentTag = agentId.split('-').pop() || agentId; // last UUID segment (unique across agents)
  const id = `dig_${agentTag.slice(0, 12)}_${weekStart}`;

  // Upsert (unique on agent_id + week_start)
  const { error } = await supabase
    .from('weekly_digests')
    .upsert(
      {
        id,
        agent_id: agentId,
        week_start: weekStart,
        title,
        content,
        article_count: articles.length,
      },
      { onConflict: 'agent_id,week_start' }
    );
  if (error) throw new Error('Salvataggio digest fallito: ' + error.message);

  await supabase.from('activity_logs').insert({
    agent_id: agentId,
    action: 'digest',
    detail: `Digest settimanale generato: "${title}" (${articles.length} articoli, ${posts.length} post)`,
    status: 'success',
  });

  const digest = {
    id,
    agentId,
    weekStart,
    title,
    content,
    articleCount: articles.length,
    sentChannels: '',
    createdAt: new Date().toISOString(),
    agent,
  };
  return digest;
}

/** Send a weekly digest to Telegram as a multi-message thread. */
export async function sendDigestTelegram(digestId: string) {
  const { data: digest } = await supabase
    .from('weekly_digests')
    .select('*')
    .eq('id', digestId)
    .single();
  if (!digest) throw new Error('Digest non trovato');

  const { data: ch } = await supabase
    .from('channel_configs')
    .select('*')
    .eq('channel', 'telegram')
    .single();

  const cfg = (ch?.config as Record<string, string>) || {};
  if (!ch?.enabled || !cfg.bot_token || !cfg.chat_id) {
    throw new Error('Canale Telegram non configurato: attivalo in Impostazioni → Canali con bot_token e chat_id.');
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const posts = String(digest.content || '').split(/\n\n+/).filter(Boolean);
  const messages: string[] = [
    `🧵 <b>${esc(digest.title)}</b>\n\n<i>Il Digest della Redazione · Nexus News AI</i>`,
    ...posts.map((p, i) => `${i + 1}/${posts.length}\n\n${esc(p)}`),
    `📡 Segui il magazine: ${SITE_URL}`,
  ];

  let sent = 0;
  for (const text of messages) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cfg.chat_id,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(`Telegram: ${data?.description || `HTTP ${res.status}`} (inviati ${sent}/${messages.length})`);
      }
      sent++;
    } finally {
      clearTimeout(timeout);
    }
  }

  const channels = String(digest.sent_channels || '').split(',').filter(Boolean);
  if (!channels.includes('telegram')) channels.push('telegram');
  await supabase
    .from('weekly_digests')
    .update({ sent_channels: channels.join(',') })
    .eq('id', digestId);

  await supabase.from('activity_logs').insert({
    agent_id: digest.agent_id,
    action: 'digest',
    detail: `Digest "${digest.title}" inviato su Telegram (${messages.length} messaggi)`,
    status: 'success',
  });

  return { sent: messages.length };
}
