import { getUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { LLM_MODEL_PRO } from '../_shared/env.ts';
import { chatCompletion, type LLMMessage } from '../_shared/llm.ts';
import { getUsage, isPro } from '../_shared/quota.ts';
import type { ChatRequest, ChatResponse } from '../_shared/types.ts';

const SYSTEM_PROMPT = `You are a helpful research assistant for academic papers. Use the PAPER TEXT and the
STRUCTURED SUMMARY (if provided) to answer the user's question. Prefer facts grounded in the paper text, and you
may build on the summary for context and follow-up questions. Be concise and precise, and cite section names or
quotes when useful. If the specific detail asked for isn't in the provided text (for example only the abstract was
extracted), say what is known from the abstract/summary and suggest opening the full PDF for more depth rather than
refusing outright.`;

function summaryContext(summary: ChatRequest['summary']): string | null {
  if (!summary) return null;
  return [
    'STRUCTURED SUMMARY (already shown to the user):',
    `TL;DR: ${summary.tldr}`,
    `Key findings: ${(summary.keyFindings || []).join('; ')}`,
    `Methods: ${summary.methods}`,
    `Contributions: ${(summary.contributions || []).join('; ')}`,
    `Limitations: ${summary.limitations}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405, 'BAD_REQUEST');

  const user = await getUser(req);
  if (!user) return errorResponse('Please sign in.', 401, 'UNAUTHENTICATED');

  // Chat is a Pro-only feature.
  if (!(await isPro(user.id))) {
    return errorResponse('Chat with paper is a Pro feature.', 403, 'QUOTA_EXCEEDED');
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400, 'BAD_REQUEST');
  }
  if (!body?.paperText || !body?.question?.trim()) {
    return errorResponse('Missing paper text or question.', 400, 'BAD_REQUEST');
  }

  const sumCtx = summaryContext(body.summary);
  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `PAPER TEXT:\n${body.paperText}` },
    ...(sumCtx ? [{ role: 'system', content: sumCtx } as LLMMessage] : []),
    ...(body.history ?? []).map((m) => ({ role: m.role, content: m.content } as LLMMessage)),
    { role: 'user', content: body.question },
  ];

  let answer: string;
  try {
    answer = await chatCompletion(messages, { model: LLM_MODEL_PRO, maxTokens: 800 });
  } catch (e) {
    return errorResponse(`Chat failed: ${(e as Error).message}`, 502, 'UPSTREAM_ERROR');
  }

  const resp: ChatResponse = { answer, usage: await getUsage(user.id) };
  return json(resp);
});
