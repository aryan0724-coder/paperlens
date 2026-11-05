import { LLM_API_KEY, LLM_BASE_URL } from './env.ts';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Minimal OpenAI-compatible chat completion. Works with OpenAI and any provider
 * exposing the /chat/completions shape (set LLM_BASE_URL + LLM_MODEL_*).
 */
export async function chatCompletion(messages: LLMMessage[], opts: LLMOptions): Promise<string> {
  if (!LLM_API_KEY) throw new Error('LLM_API_KEY is not configured on the server.');

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 1200,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upstream LLM error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}
