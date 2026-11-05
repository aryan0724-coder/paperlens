# PaperLens

A Manifest V3 Chrome extension that summarizes research papers and academic PDFs in-context
(arXiv, PubMed, bioRxiv, journal pages, and raw PDFs), backed by a small hosted AI proxy and a
free-quota + Pro-subscription model.

## Monorepo layout

```
PaperLens/
├─ extension/   # MV3 extension: Vite + CRXJS + React + TypeScript + Tailwind
├─ backend/     # Supabase (Auth + Postgres + Edge Functions): /summarize, /chat, quota
└─ shared/      # TypeScript API-contract types shared across client + docs
```

## Quick start (extension)

```bash
cd extension
npm install
cp .env.example .env     # fill in SUPABASE + backend values (optional for UI demo)
npm run dev              # dev build with HMR -> load extension/dist as unpacked
# or
npm run build            # production build -> extension/dist
```

Then open `chrome://extensions`, enable Developer mode, and "Load unpacked" -> select
`extension/dist`.

## Backend

See [backend/README.md](backend/README.md) for Supabase setup, the SQL migration, the edge
functions, and the environment variables (LLM key, ExtPay key).

## Monetization

- Free: limited summaries/month (enforced server-side).
- Pro: fair-use unlimited, better model, chat-with-paper, multi-paper synthesis, export.
- Payments via [ExtPay](https://github.com/Glench/ExtPay) (Stripe under the hood). The Chrome Web
  Store's own payments API is deprecated and is not used.

## Git identity note

This repo is initialized with a repo-local **personal** git identity (not any company account).
Before pushing, set your real personal GitHub email:

```bash
git config user.email "you@personal-example.com"
git config user.name  "Your Name"
```

Nothing is pushed to any remote until you configure one with your personal credentials.
