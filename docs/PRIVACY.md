# PaperLens Privacy Policy

_Last updated: 2026-11-05_

PaperLens helps you summarize research papers and academic PDFs. This policy explains what
data the extension handles and why.

## What we process

- **Account email**: used only to sign you in (one-time email codes via Supabase Auth) and to
  associate your subscription. We do not send marketing email.
- **Page / PDF content you summarize**: when you click "Summarize" (or ask a chat question), the
  extracted text of the current paper is sent to our backend and forwarded to our AI provider to
  generate the summary/answer. We do not store the full paper text after the response is produced.
- **Usage counters**: we store a per-month count of summaries to enforce free-tier limits and your
  plan status (free/Pro).
- **Payment data**: handled by ExtPay/Stripe. We never see or store your card details.

## What we do NOT do

- We do not sell or share your data with advertisers.
- We do not track your browsing history. The extension only reads a page's content when you
  explicitly trigger a summary on that page.
- We do not run on pages outside the supported paper hosts unless you invoke it there.

## Data retention

- Account and usage records persist while your account is active. Email us to delete your account
  and associated records.

## Third parties

- **Supabase** (authentication + database hosting).
- **AI model provider** (text summarization/chat).
- **ExtPay / Stripe** (subscription billing).

## Contact

Questions or deletion requests: support@paperlens.app
