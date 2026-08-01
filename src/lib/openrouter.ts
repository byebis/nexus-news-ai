// OpenRouter API Client with Model Fallback
// Compatible with Cloudflare Workers (uses fetch only)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models - same chain for all phases, fallback order
export const MODELS = [
  'inclusionai/ling-3.0-flash:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
] as const;

export type Phase = 'collect' | 'evaluate' | 'rewrite';

// Same chain for every phase
export const MODEL_CHAINS: Record<Phase, readonly string[]> = {
  collect: [...MODELS],
  evaluate: [...MODELS],
  rewrite: [...MODELS],
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
  timeoutMs = 15000
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
        max_tokens: 4096,
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
  // Try to extract from ```json ... ``` block
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock?.[1]) return jsonBlock[1].trim();
  // Try to find first { ... } block
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}
