# PaperLens cost model & scaling

## Who pays whom

- **Users pay you** for Pro via ExtPay/Stripe. "Pro" only unlocks features (unlimited
  summaries + chat) inside the extension.
- **You pay the LLM provider** (currently Groq) based on your *total* API usage, through one
  server-side key. Users never have their own key.

These are independent: there is no LLM plan tied to individual subscribers.

## Groq: free tier vs pay-as-you-go

- **Free tier** has rate limits (requests/min, tokens/min) and is intended for development.
  Fine for you + testers; real traffic will hit `429` errors.
- **Pay-as-you-go** (add a card at console.groq.com) raises limits and charges per token
  (pennies). Switch to this before promoting the extension to real users.

## Unit economics (approximate)

- One full-paper summary: well under **$0.01** in tokens.
- A Pro user doing ~150 summaries/month: ~**$1** in tokens.
- Charging **$5/month** => you keep ~**$4** (≈80-90% margin).
- Free users are capped (5/month), so they cost at most a few cents.

## Provider independence

The backend is provider-agnostic. To switch providers or move Groq to paid, change only these
Supabase secrets - no code change:

- `LLM_API_KEY`
- `LLM_BASE_URL` (e.g. `https://api.openai.com/v1`, `https://api.groq.com/openai/v1`,
  Gemini's OpenAI-compatible endpoint, OpenRouter, etc.)
- `LLM_MODEL_FREE` / `LLM_MODEL_PRO`

Use `LLM_MODEL_FREE` (cheap/fast) for free users and `LLM_MODEL_PRO` (higher quality) for Pro.

## Pre-launch checklist for costs

1. Add a payment method to Groq (pay-as-you-go) so you aren't rate-limited.
2. Confirm the configured models still exist (provider lineups change).
3. Keep the free monthly limit (`FREE_MONTHLY_LIMIT`) sane to cap free-tier token spend.
