# Chrome Web Store listing (draft)

## Name
PaperLens - Research Paper Summarizer

## Summary (132 chars max)
One-click AI summaries of research papers & PDFs (arXiv, PubMed, journals) right in a side panel.

## Detailed description
PaperLens reads the research paper or PDF you're viewing and gives you a clear, structured summary
without leaving the page:

- TL;DR, key findings, methods, contributions, and limitations
- Works on arXiv, PubMed, bioRxiv, major journals, and raw PDFs
- Chat with the paper to dig into methods or results (Pro)
- Copy a clean Markdown summary or a citation in one click

Free to try with a monthly allowance. Upgrade to Pro for fair-use unlimited summaries, a
higher-quality model, chat-with-paper, and exports.

## Category
Productivity

## Permissions justification (for review)
- `sidePanel`: the whole UI lives in the side panel.
- `activeTab` + `scripting`: read the current paper's text only when you click Summarize.
- `storage`: store your session and settings locally.
- `offscreen`: parse PDFs with pdf.js (needs a DOM/worker context).
- `tabs`: detect the active tab's URL to know what to summarize.
- Host permissions (arXiv/PubMed/journals): extract paper content on those sites.

## Privacy
Single-purpose: summarize academic papers. Data use is described in docs/PRIVACY.md.
Hosted privacy policy URL: https://aryan0724-coder.github.io/paperlens/privacy/

## Assets needed before submission
- 128x128 store icon (replace the generated placeholder in extension/public/icons).
- 1280x800 (or 640x400) screenshots of the side panel summarizing a paper.
- Small promo tile 440x280 (optional).
