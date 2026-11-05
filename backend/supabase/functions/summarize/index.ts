import { getUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { LLM_MODEL_FREE, LLM_MODEL_PRO } from '../_shared/env.ts';
import { chatCompletion } from '../_shared/llm.ts';
import { consumeSummary } from '../_shared/quota.ts';
import type { PaperSummary, SummarizeRequest, SummarizeResponse } from '../_shared/types.ts';

const SYSTEM_PROMPT = `You are an expert research assistant that explains academic papers to a technical but time-constrained reader.
Return ONLY a JSON object with exactly these keys:
- "tldr": string. One or two plain-language sentences capturing the core result.
- "keyFindings": string[] of 3-6 concise bullet points of the most important results.
- "methods": string. A short paragraph describing the approach / data / experiments.
- "contributions": string[] of 2-4 bullet points of what is novel.
- "limitations": string. A short paragraph on caveats, threats to validity, or open questions.
Be faithful to the text. Do not invent numbers. Keep each bullet under 30 words.`;

function buildUserPrompt(paper: SummarizeRequest['paper']): string {
  const authors = paper.authors?.length ? paper.authors.join(', ') : 'Unknown';
  return [
    `Title: ${paper.title || 'Untitled'}`,
    `Authors: ${authors}`,
    `Source: ${paper.source}`,
    '',
    'Paper text (may be truncated):',
    paper.text,
  ].join('\n');
}

function parseSummary(content: string): PaperSummary {
  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(content);
  } catch {
    // Model didn't return valid JSON -> degrade gracefully.
    return {
      tldr: content.slice(0, 500),
      keyFindings: [],
      methods: '',
      contributions: [],
      limitations: '',
    };
  }
  const asArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
  const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
  return {
    tldr: asString(obj.tldr),
    keyFindings: asArray(obj.keyFindings),
    methods: asString(obj.methods),
    contributions: asArray(obj.contributions),
    limitations: asString(obj.limitations),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405, 'BAD_REQUEST');

  const user = await getUser(req);
  if (!user) return errorResponse('Please sign in to summarize.', 401, 'UNAUTHENTICATED');

  let body: SummarizeRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400, 'BAD_REQUEST');
  }
  const paper = body?.paper;
  if (!paper?.text || paper.text.trim().length < 100) {
    return errorResponse('Paper text is too short to summarize.', 400, 'BAD_REQUEST');
  }

  const quota = await consumeSummary(user.id);
  if (!quota.allowed) {
    return json(
      {
        error: "You've used all your free summaries this month.",
        code: 'QUOTA_EXCEEDED',
        usage: { used: quota.used, limit: quota.limit, isPro: quota.isPro, resetsOn: quota.resetsOn },
      },
      402,
    );
  }

  const model = quota.isPro ? LLM_MODEL_PRO : LLM_MODEL_FREE;
  let content: string;
  try {
    content = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(paper) },
      ],
      { model, json: true, maxTokens: 1200 },
    );
  } catch (e) {
    return errorResponse(`Summarization failed: ${(e as Error).message}`, 502, 'UPSTREAM_ERROR');
  }

  const resp: SummarizeResponse = {
    summary: parseSummary(content),
    usage: { used: quota.used, limit: quota.limit, isPro: quota.isPro, resetsOn: quota.resetsOn },
    model,
  };
  return json(resp);
});
