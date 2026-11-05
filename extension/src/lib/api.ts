import type {
  ApiError,
  ChatRequest,
  ChatResponse,
  SummarizeRequest,
  SummarizeResponse,
} from '@shared/types';
import { BACKEND_URL, SUPABASE_ANON_KEY } from './config';
import { getSupabase } from './supabase';

export class ApiCallError extends Error {
  code?: ApiError['code'];
  status: number;
  constructor(message: string, status: number, code?: ApiError['code']) {
    super(message);
    this.name = 'ApiCallError';
    this.status = status;
    this.code = code;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const s = getSupabase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (s) {
    const { data } = await s.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!BACKEND_URL) {
    throw new ApiCallError(
      'Backend not configured. Set VITE_SUPABASE_URL (and optionally VITE_BACKEND_URL) in .env.',
      0,
      'INTERNAL',
    );
  }
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiCallError(`Network error reaching backend: ${(e as Error).message}`, 0, 'INTERNAL');
  }
  const data = (await res.json().catch(() => ({}))) as T & Partial<ApiError>;
  if (!res.ok) {
    throw new ApiCallError(
      (data as ApiError).error || `Request failed (${res.status})`,
      res.status,
      (data as ApiError).code,
    );
  }
  return data as T;
}

export const summarizePaper = (req: SummarizeRequest): Promise<SummarizeResponse> =>
  post<SummarizeResponse>('summarize', req);

export const chatWithPaper = (req: ChatRequest): Promise<ChatResponse> =>
  post<ChatResponse>('chat', req);

/** Tell the backend about the ExtPay paid status so it can set `is_pro`. */
export const syncSubscription = (
  paid: boolean,
  status?: string | null,
): Promise<{ isPro: boolean }> => post<{ isPro: boolean }>('sync-subscription', { paid, status });
