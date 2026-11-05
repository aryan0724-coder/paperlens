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
#    Example uses Groq (free, OpenAI-compatible).
supabase secrets set \
  LLM_API_KEY=gsk_your_groq_key \
  LLM_BASE_URL=https://api.groq.com/openai/v1 \
  LLM_MODEL_FREE=openai/gpt-oss-120b \
  LLM_MODEL_PRO=openai/gpt-oss-120b \
  FREE_MONTHLY_LIMIT=5 \
  EXTPAY_ID=paperlens

# 3) Deploy the functions
supabase functions deploy summarize
supabase functions deploy chat
supabase functions deploy sync-subscription
```

## Auth configuration

The extension uses **email + password** auth (works fully inside the side panel). On the free
tier with the default email provider, email templates can't be customized, so this project
enables **auto-confirm** (`mailer_autoconfirm = true`) to skip the email round-trip:

```bash
# via the Management API (PAT), or the dashboard: Authentication -> Settings -> "Confirm email" off
```

For production, add a custom SMTP provider (Resend/Brevo/SendGrid) and re-enable email
confirmation for verified sign-ups.

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
