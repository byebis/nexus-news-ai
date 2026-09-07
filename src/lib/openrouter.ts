// OpenRouter API Client with Model Fallback
// Compatible with Cloudflare Workers (uses fetch only)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models - same chain for all phases, fallback order
// Updated Sep 2026: previous free models (llama-4-scout, gemma-3-27b, nemotron-70b,
// deepseek-v3-0324) were REMOVED from OpenRouter free tier (HTTP 404)
export const MODELS = [
  'google/gemma-4-31b-it:free',
  'minimax/minimax-m2.7:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-26b-a4b-it:free',
  'openrouter/free',
] as const;

export type Phase =
  | 'collect'
  | 'evaluate'
  | 'rewrite'
  | 'digest'
  | 'translate'
  | 'ask'
  | 'copilot'
  | 'wire';

// Same chain for every phase
export const MODEL_CHAINS: Record<Phase, readonly string[]> = {
  collect: [...MODELS],
  evaluate: [...MODELS],
  rewrite: [...MODELS],
  digest: [...MODELS],
  translate: [...MODELS],
  ask: [...MODELS],
  copilot: [...MODELS],
  wire: [...MODELS],
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  model: string;
  content: string;
  phase: Phase;
  tokensUsed: number;
}

interface FallbackResult {
  success: boolean;
  response?: OpenRouterResponse;
  errors: Array<{ model: string; error: string }>;
}

async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  timeoutMs = 45000
): Promise<{ content: string; tokensUsed: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nexus-news-ai.pages.dev',
        'X-Title': 'Nexus News AI',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 8192,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json() as any;
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!content) throw new Error('Empty response from model');

    return { content, tokensUsed };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Try calling OpenRouter with a chain of models.
 * Returns the first successful response, or a failure result with all errors.
 */
export async function chatWithFallback(
  messages: ChatMessage[],
  phase: Phase,
  apiKey: string,
  customChain?: string[]
): Promise<FallbackResult> {
  const chain = customChain || [...MODEL_CHAINS[phase]];
  const errors: FallbackResult['errors'] = [];

  for (const model of chain) {
    try {
      const { content, tokensUsed } = await callOpenRouter(model, messages, apiKey);
      return {
        success: true,
        response: {
          model,
          content,
          phase,
          tokensUsed,
        },
        errors,
      };
    } catch (err: any) {
      errors.push({
        model,
        error: err.message || String(err),
      });
      console.error(`[OpenRouter] ${model} failed:`, err.message);
    }
  }

  return { success: false, errors };
}

/**
 * Quick health check - tests if the API key works with the first available model
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; model?: string; error?: string }> {
  const models = [...MODEL_CHAINS.collect];
  for (const model of models) {
    try {
      const { content } = await callOpenRouter(model, [
        { role: 'user', content: 'Rispondi solo con OK' }
      ], apiKey, 10000);
      if (content) return { valid: true, model };
    } catch {
      continue;
    }
  }
  return { valid: false, error: 'Nessun modello raggiungibile' };
}

// Extract JSON from a response that may contain markdown code blocks
export function extractJSON(text: string): string {
  // Strip reasoning-model think blocks (e.g. <think>...</think>) and common prose prefixes
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '');
  // Try to extract from ```json ... ``` block
  const jsonBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock?.[1]) return jsonBlock[1].trim();
  // Try array first (collect phase returns arrays)
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return cleaned.slice(firstBracket, lastBracket + 1);
  }
  // Try to find first { ... } block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
}
