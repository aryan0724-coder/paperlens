import type { ExtractedPaper, PaperSource } from '@shared/types';

export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function sourceFromUrl(url: string): PaperSource {
  const h = safeHost(url);
  if (h.includes('arxiv.org')) return 'arxiv';
  if (h.includes('pubmed') || h.includes('ncbi.nlm.nih.gov')) return 'pubmed';
  if (h.includes('biorxiv.org') || h.includes('medrxiv.org')) return 'biorxiv';
  return 'generic';
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function metaContent(doc: Document, selectors: string[]): string {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const c = el?.getAttribute('content')?.trim();
    if (c) return c;
  }
  return '';
}

function metaContentAll(doc: Document, selector: string): string[] {
  return Array.from(doc.querySelectorAll(selector))
    .map((el) => el.getAttribute('content')?.trim() || '')
    .filter(Boolean);
}

function cleanText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(doc: Document): string {
  return (
    metaContent(doc, ['meta[name="citation_title"]', 'meta[property="og:title"]']) ||
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.title.trim()
  );
}

function extractAuthors(doc: Document): string[] {
  const fromMeta = metaContentAll(doc, 'meta[name="citation_author"]');
  if (fromMeta.length) return dedupe(fromMeta);
  const fromDc = metaContentAll(doc, 'meta[name="dc.creator"], meta[name="DC.creator"]');
  if (fromDc.length) return dedupe(fromDc);
  return [];
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

/** Pick the densest likely "article" container, else fall back to body text. */
function extractBody(doc: Document): string {
  const candidates = [
    'article',
    '[role="main"] article',
    'main article',
    '.article-body',
    '.article__body',
    '#article-body',
    '.abstract-content',
    '.c-article-body',
    '#content-inner',
    'main',
    '[role="main"]',
  ];
  let best = '';
  for (const sel of candidates) {
    const el = doc.querySelector(sel) as HTMLElement | null;
    const txt = el?.innerText?.trim() || '';
    if (txt.length > best.length) best = txt;
  }
  if (best.length < 400) {
    best = (doc.body?.innerText || '').trim();
  }
  return best;
}

/** Extract a paper's metadata and text from a rendered document. */
export function extractFromDocument(doc: Document, url: string): ExtractedPaper {
  const source = sourceFromUrl(url);
  const title = extractTitle(doc);
  const authors = extractAuthors(doc);
  const abstract =
    metaContent(doc, ['meta[name="citation_abstract"]', 'meta[name="description"]']) ||
    doc.querySelector('.abstract, #abstract, blockquote.abstract')?.textContent?.trim() ||
    '';

  let body = extractBody(doc);

  // arXiv abstract pages: the abstract block is the primary content.
  if (source === 'arxiv' && body.length < 800 && abstract) {
    body = abstract;
  }

  const text = cleanText([abstract && `Abstract: ${abstract}`, body].filter(Boolean).join('\n\n'));

  if (countWords(text) < 40) {
    throw new Error(
      'Could not find enough article text on this page. Open the paper abstract/full text or the PDF.',
    );
  }

  return {
    title: title || 'Untitled',
    authors,
    abstract: abstract || undefined,
    text,
    source,
    url,
    wordCount: countWords(text),
  };
}
