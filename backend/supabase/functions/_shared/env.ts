// Environment accessors for the edge functions.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by
// the Supabase Edge runtime automatically. The rest are set with
// `supabase secrets set ...` (see backend/.env.example).

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
export const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
export const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const LLM_API_KEY = Deno.env.get('LLM_API_KEY') ?? '';
export const LLM_BASE_URL = Deno.env.get('LLM_BASE_URL') ?? 'https://api.openai.com/v1';
export const LLM_MODEL_FREE = Deno.env.get('LLM_MODEL_FREE') ?? 'gpt-4o-mini';
export const LLM_MODEL_PRO = Deno.env.get('LLM_MODEL_PRO') ?? 'gpt-4o';

export const FREE_MONTHLY_LIMIT = Number(Deno.env.get('FREE_MONTHLY_LIMIT') ?? '5');

export const EXTPAY_API_KEY = Deno.env.get('EXTPAY_API_KEY') ?? '';
export const EXTPAY_ID = Deno.env.get('EXTPAY_ID') ?? 'paperlens';

// Lemon Squeezy (Merchant of Record) webhook signing secret.
export const LEMONSQUEEZY_WEBHOOK_SECRET = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';

// Gumroad access token - used to verify incoming webhook sales via the API.
export const GUMROAD_ACCESS_TOKEN = Deno.env.get('GUMROAD_ACCESS_TOKEN') ?? '';
