# PaperLens Roadmap & Notes

Captured ideas and next steps. Not committed to an order yet.

## Status (2026-11-05)
- Free version submitted to the Chrome Web Store (in review).
- Backend live on Supabase (Groq free tier). Landing + privacy pages on GitHub Pages.
- Pro payments: pivoting to Gumroad (Stripe/Lemon Squeezy blocked for India individuals).

## Payments (Gumroad) - finish this
- Create Gumroad Membership product ($5/mo), link PayPal, set Ping URL to the
  `gumroad-webhook` function, generate an access token.
- Deploy `gumroad-webhook`, set `GUMROAD_ACCESS_TOKEN`, register cancel/ended resource
  subscriptions, set `VITE_CHECKOUT_URL`, rebuild, upload store update.

## Activation (high impact)
- "No sign-up required" first use (inspired by Liner). Let a new user run 1-2 summaries
  with no account (device-id tracked, strict cap), then prompt sign-up. Reduces first-use
  friction significantly. Needs an anonymous/device-based quota path in the backend.

## Product depth - specialize in research (our moat)
Generalist copilots (Liner) and general browser agents (Sider Hand) are broad and shallow for
papers. Win by going deeper for academics:
- Related-work finder: from the current paper, pull + summarize key cited/citing works.
- Compare N papers: methods / results / limitations side by side.
- Literature-review agent: topic/question -> search arXiv/PubMed/Semantic Scholar APIs ->
  synthesized review with citations. (A "Pro+" tier.)
- Topic tracker: watch new arXiv papers on a topic -> weekly digest email.
- Note: scope "agent" features to APIs + the user's own browser - avoid Sider-style
  cloud-browser-per-task infra (expensive, kills margins, commoditized by big players).

## Hardening before scaling up
- Email verification via custom SMTP (Resend/Brevo); currently auto-confirm is on.
- Refund the monthly quota when an LLM call fails (today a failed summary still counts).
- Groq: move to pay-as-you-go before real traffic; pin/fallback the model (lineup changes).
- Broaden full-text extraction beyond arXiv (bioRxiv, more journals).

## Pricing / positioning
- Student-friendly: $5/mo (undercut Liner). Optional $40/yr.
- Market as the specialist "research paper" tool, not a general AI copilot.

## Go-to-market
- Ask every early user for a store review (ranking + trust).
- Communities: r/GradSchool, r/PhD, r/AskAcademia, r/labrats, r/MachineLearning, academic X,
  grad Discords/Slacks.
- Launch spikes: Product Hunt, Show HN, AI-tool directories.
- Content/SEO: "read papers faster", "best arXiv tools"; YouTube demo.
- Built-in loop: "Summarized with PaperLens" footer on exports (make it a link to the store).

## Competitor notes
- Liner (liner.com): AI copilot - summarize web/YouTube/PDF + highlight + research. Broad,
  established, research-leaning. Takeaways: validates the market; copy "no sign-up" activation;
  out-specialize on papers.
- Sider Hand (sider.ai): general AI browser agent (multi-site tasks via cloud browser). Heavy
  infra, broad market, lots of big competitors - not a good solo direction; borrow the "agent"
  idea only within the research niche.
