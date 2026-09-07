// ============================================
// Nexus Wire — persistence layer (Level 12)
// Redazione Collettiva: run + commenti agenti.
//
// Storage: usa `activity_logs` con convenzioni strutturate
// (action='wire_run' con detail JSON / action='wire_comment'
// con detail JSON / action='wire_setting' per il toggle admin).
// Incapsulato qui: se in futuro si migrano tabelle dedicate
// (wire_runs / agent_comments) basta sostituire questo file.
// ============================================

import { supabase } from '@/lib/supabase';

export interface WireSource {
  title: string;
  source: string;
  url: string;
}

export interface WireStep {
  agentName: string;
  role: string; // ricercatore | redattore | revisore | editor
  kind: 'research' | 'draft' | 'review' | 'final';
  score?: number;
  model?: string;
  summary: string; // breve testo esibibile
  at: string;
}

export interface WireRunData {
  topic: string;
  status: 'running' | 'completed' | 'failed';
  sources: WireSource[];
  steps: WireStep[];
  agentsInvolved: { id: string; name: string; role: string }[];
  articleId?: string;
  reviewScore?: number;
  error?: string;
}

export interface WireRunRow {
  id: string;
  agentId: string;
  status: string; // info=running | success=completed | error=failed
  data: WireRunData;
  createdAt: string;
}

export interface WireCommentRow {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentCategory: string;
  kind: 'research' | 'draft' | 'review' | 'final';
  role: string;
  text: string;
  score?: number;
  createdAt: string;
}

const RUN_ACTION = 'wire_run';
const COMMENT_ACTION = 'wire_comment';
const SETTING_ACTION = 'wire_setting';

function parseJSON(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ---------- Toggle admin ----------

export async function getWireEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('activity_logs')
      .select('detail')
      .eq('action', SETTING_ACTION)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return true; // default: attivo
    return data[0].detail === 'on';
  } catch {
    return true;
  }
}

export async function setWireEnabled(on: boolean, anchorAgentId: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    agent_id: anchorAgentId,
    action: SETTING_ACTION,
    detail: on ? 'on' : 'off',
    status: 'info',
  });
  if (error) throw error;
}

// ---------- Run lock ----------

export async function hasRecentRun(minutes = 4): Promise<boolean> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { data } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('action', RUN_ACTION)
    .neq('status', 'error') // un run fallito non blocca la redazione
    .gte('created_at', since)
    .limit(1);
  return !!data && data.length > 0;
}

// ---------- Runs ----------

export async function insertWireRun(runId: string, data: WireRunData, anchorAgentId: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    id: runId,
    agent_id: anchorAgentId,
    action: RUN_ACTION,
    detail: JSON.stringify(data),
    status: data.status === 'completed' ? 'success' : data.status === 'failed' ? 'error' : 'info',
  });
  if (error) throw error;
}

export async function updateWireRun(runId: string, data: WireRunData): Promise<void> {
  const { error } = await supabase
    .from('activity_logs')
    .update({
      detail: JSON.stringify(data),
      status: data.status === 'completed' ? 'success' : data.status === 'failed' ? 'error' : 'info',
    })
    .eq('id', runId);
  if (error) throw error;
}

export function mapRunRow(row: Record<string, unknown>): WireRunRow {
  const agent = row.agent as { id: string; name: string; avatar: string; category: string } | undefined;
  return {
    id: String(row.id),
    agentId: String(row.agent_id || agent?.id || ''),
    status: String(row.status || 'info'),
    data: parseJSON(row.detail as string) as unknown as WireRunData,
    createdAt: String(row.created_at),
  };
}

export async function fetchWireRuns(limit = 30): Promise<WireRunRow[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, agent_id, action, detail, status, created_at, agent:agents(id, name, avatar, category)')
    .eq('action', RUN_ACTION)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((r) => mapRunRow(r as Record<string, unknown>));
}

export async function fetchRunByArticle(articleId: string): Promise<WireRunRow | null> {
  // activity_logs non ha colonna article_id: cerco nei run recenti con matching lato app
  const runs = await fetchWireRuns(60);
  return runs.find((r) => r.data?.articleId === articleId) || null;
}

// ---------- Comments (bacheca stile Moltbook) ----------

export async function insertWireComments(
  rows: {
    id: string;
    runId: string;
    agentId: string;
    agentName: string;
    kind: 'research' | 'draft' | 'review' | 'final';
    role: string;
    text: string;
    score?: number;
  }[]
): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.map((c) => ({
    id: c.id,
    agent_id: c.agentId,
    action: COMMENT_ACTION,
    detail: JSON.stringify({
      runId: c.runId,
      text: c.text,
      kind: c.kind,
      role: c.role,
      agentName: c.agentName,
      score: c.score,
    }),
    status: c.kind === 'review' ? 'info' : 'success',
  }));
  const { error } = await supabase.from('activity_logs').insert(payload);
  if (error) throw error;
}

export async function fetchWireComments(limit = 50): Promise<WireCommentRow[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, agent_id, detail, created_at, agent:agents(id, name, avatar, category)')
    .eq('action', COMMENT_ACTION)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((row) => {
    const d = parseJSON(row.detail as string);
    const agent = row.agent as { id: string; name: string; avatar: string; category: string } | null | undefined;
    return {
      id: String(row.id),
      runId: String(d.runId || ''),
      agentId: String(row.agent_id || agent?.id || ''),
      agentName: String(agent?.name || d.agentName || 'Agente AI'),
      agentAvatar: String(agent?.avatar || ''),
      agentCategory: String(agent?.category || ''),
      kind: (d.kind as WireCommentRow['kind']) || 'comment',
      role: String(d.role || ''),
      text: String(d.text || ''),
      score: typeof d.score === 'number' ? d.score : undefined,
      createdAt: String(row.created_at),
    };
  });
}
