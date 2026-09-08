// ============================================
// Level 13 — I Volti di Nexus
// Shared helpers: agent profile slugs + reader reactions
// ============================================

/** The 5 quick reactions readers can leave on an article */
export const AGENT_REACTIONS = ['🔥', '👏', '🤯', '😢', '🤖'] as const;
export type AgentReaction = (typeof AGENT_REACTIONS)[number];

export function isAgentReaction(v: unknown): v is AgentReaction {
  return typeof v === 'string' && (AGENT_REACTIONS as readonly string[]).includes(v);
}

/** URL-safe slug for an agent name (e.g. "Culture Hub" -> "culture-hub") */
export function slugForAgent(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Public profile URL for an agent (falls back to the Wire portal) */
export function authorHref(agentName: string): string {
  const slug = slugForAgent(agentName);
  return slug ? `/autore/${slug}` : '/wire';
}
