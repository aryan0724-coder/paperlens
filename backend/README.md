# PaperLens backend (Supabase)

Auth (email OTP), Postgres (usage + Pro flag), and three Edge Functions:

- `summarize` - structured paper summary (enforces the free monthly quota).
- `chat` - chat-with-paper (Pro only).
- `sync-subscription` - flips a user's `is_pro` flag from ExtPay/Stripe status.

## Prerequisites

- A [Supabase](https://supabase.com) project.
- The [Supabase CLI](https://supabase.com/docs/guides/cli).
- An OpenAI-compatible LLM API key.

## Setup

```bash
cd backend
supabase login
supabase link --project-ref <your-project-ref>

# 1) Apply the schema (profiles, quota function, RLS, triggers)
supabase db push

# 2) Set server secrets (never shipped to the client)
supabase secrets set \
  LLM_API_KEY=sk-... \
  LLM_BASE_URL=https://api.openai.com/v1 \
  LLM_MODEL_FREE=gpt-4o-mini \
  LLM_MODEL_PRO=gpt-4o \
  FREE_MONTHLY_LIMIT=5 \
  EXTPAY_ID=paperlens

# 3) Deploy the functions
supabase functions deploy summarize
supabase functions deploy chat
supabase functions deploy sync-subscription
```

## Auth configuration

In the Supabase dashboard: Authentication -> Providers -> Email, enable **Email OTP**
(so `signInWithOtp` sends a 6-digit code rather than only a magic link - the extension
uses the code flow).

## Wiring the extension

In `extension/.env` set:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Then rebuild the extension. The functions live at
`${VITE_SUPABASE_URL}/functions/v1/{summarize,chat,sync-subscription}`.

## Cost / quota notes

- A full-paper summary with `gpt-4o-mini` is typically well under $0.01.
- The free limit is enforced atomically in Postgres (`consume_summary`), so it can't
  be bypassed by the client.
- `chat` and `sync-subscription` are authoritative server-side (Pro gating + billing).
