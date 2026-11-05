import { getUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { LLM_MODEL_PRO } from '../_shared/env.ts';
import { chatCompletion, type LLMMessage } from '../_shared/llm.ts';
import { getUsage, isPro } from '../_shared/quota.ts';
import type { ChatRequest, ChatResponse } from '../_shared/types.ts';

const SYSTEM_PROMPT = `You are a helpful research assistant. Answer the user's questions about the paper
using ONLY the provided paper text. If the answer isn't in the text, say so plainly. Be concise and precise,
and cite section names or quotes when useful.`;

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

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `PAPER TEXT:\n${body.paperText}` },
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
