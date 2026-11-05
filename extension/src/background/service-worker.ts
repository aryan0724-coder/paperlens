import ExtPay from 'extpay';
import type { ExtractedPaper } from '@shared/types';
import { EXTPAY_ID } from '@/lib/config';
import { MSG, type PaperResult } from '@/lib/messages';

// ExtPay must run in the background to process payments / sync status.
const extpay = ExtPay(EXTPAY_ID);
extpay.startBackground();

// Broadcast to the UI when a payment/login completes.
try {
  extpay.onPaid.addListener(() => {
    chrome.runtime.sendMessage({ type: MSG.EXTPAY_PAID }).catch(() => {});
  });
} catch {
  /* onPaid needs the extensionpay.com content script; ignore if unavailable */
}

// Open the side panel when the toolbar icon is clicked.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e) => console.warn('setPanelBehavior failed', e));
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg?.type) {
    case MSG.GET_ACTIVE_PAPER:
      getActivePaper()
        .then(sendResponse)
        .catch((e: unknown) =>
          sendResponse({ ok: false, error: (e as Error).message } satisfies PaperResult),
        );
      return true;
    // ExtPay network calls run here (service worker) so host_permissions cleanly
    // bypass CORS - calling them from the side panel page does not.
    case MSG.EXTPAY_GET_USER:
      extpay
        .getUser()
        .then((u) =>
          sendResponse({
            ok: true,
            paid: Boolean(u.paid),
            status: u.subscriptionStatus ?? null,
            email: u.email ?? null,
          }),
        )
        .catch((e: unknown) => sendResponse({ ok: false, error: (e as Error).message }));
      return true;
    case MSG.EXTPAY_OPEN_PAYMENT:
      try {
        extpay.openPaymentPage();
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: (e as Error).message });
      }
      return true;
    default:
      return false;
  }
});

async function getActivePaper(): Promise<PaperResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return { ok: false, error: 'No active tab found.' };
  const url = tab.url;

  if (!/^https?:/i.test(url)) {
    return { ok: false, error: 'Open a paper page (arXiv, PubMed, a journal) or a PDF, then retry.' };
  }

  if (isPdfUrl(url)) return extractPdf(url);

  // arXiv abstract pages only expose the abstract; pull the full-text PDF
  // instead, enriched with the page's title/authors/abstract.
  const arxivAbs = url.match(/arxiv\.org\/abs\/([^?#]+)/i);
  if (arxivAbs) {
    const full = await extractArxivFull(tab.id, url, arxivAbs[1]);
    if (full) return full;
  }

  return extractDom(tab.id, url);
}

async function extractDom(tabId: number, url: string): Promise<PaperResult> {
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractInPage,
      args: [url],
    });
    const result = res?.result as PaperResult | undefined;
    return result ?? { ok: false, error: 'Could not read this page.' };
  } catch {
    return {
      ok: false,
      error:
        'This page can\u2019t be read here. PaperLens works on arXiv, PubMed, bioRxiv, major journals, and PDFs.',
    };
  }
}

/** For arXiv /abs/ pages: parse the full PDF, keep nice metadata from the page. */
async function extractArxivFull(
  tabId: number,
  absUrl: string,
  id: string,
): Promise<PaperResult | null> {
  const pdfRes = await extractPdf(`https://arxiv.org/pdf/${id}`);
  if (!pdfRes.ok) return null; // fall back to DOM extraction

  let dom: ExtractedPaper | null = null;
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractInPage,
      args: [absUrl],
    });
    const r = res?.result as PaperResult | undefined;
    if (r && r.ok) dom = r.paper;
  } catch {
    /* metadata enrichment is best-effort */
  }

  const paper = pdfRes.paper;
  paper.url = absUrl;
  paper.source = 'arxiv';
  if (dom) {
    if (dom.title) paper.title = dom.title;
    if (dom.authors.length) paper.authors = dom.authors;
    if (dom.abstract) paper.abstract = dom.abstract;
  }
  return { ok: true, paper };
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url) || /arxiv\.org\/pdf\//i.test(url);
}

async function extractPdf(url: string): Promise<PaperResult> {
  let buffer: ArrayBuffer;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return { ok: false, error: `Couldn't download the PDF (HTTP ${resp.status}).` };
    buffer = await resp.arrayBuffer();
  } catch (e) {
    return { ok: false, error: `Couldn't download the PDF: ${(e as Error).message}` };
  }
  await ensureOffscreen();
  return (await chrome.runtime.sendMessage({ type: MSG.PARSE_PDF, url, buffer })) as PaperResult;
}

let creating: Promise<void> | null = null;
async function ensureOffscreen(): Promise<void> {
  if (creating) {
    await creating;
    return;
  }
  creating = chrome.offscreen
    .createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: 'Parse PDF files with pdf.js to extract their text.',
    })
    .catch((e: unknown) => {
      // "Only a single offscreen document may be created" => already exists, fine.
      if (!/single offscreen/i.test((e as Error).message)) throw e;
    });
  await creating;
  creating = null;
}

/**
 * Runs in the target page (via executeScript). Must be fully self-contained:
 * no imports or references to module-scope variables.
 */
function extractInPage(
  pageUrl: string,
): { ok: true; paper: Record<string, unknown> } | { ok: false; error: string } {
  let host = '';
  try {
    host = new URL(pageUrl).host;
  } catch {
    host = '';
  }
  const source =
    host.indexOf('arxiv.org') >= 0
      ? 'arxiv'
      : host.indexOf('pubmed') >= 0 || host.indexOf('ncbi.nlm.nih.gov') >= 0
        ? 'pubmed'
        : host.indexOf('biorxiv.org') >= 0 || host.indexOf('medrxiv.org') >= 0
          ? 'biorxiv'
          : 'generic';

  const meta = (selectors: string[]): string => {
    for (const s of selectors) {
      const el = document.querySelector(s);
      const c = el && el.getAttribute('content');
      if (c && c.trim()) return c.trim();
    }
    return '';
  };
  const metaAll = (selector: string): string[] =>
    Array.from(document.querySelectorAll(selector))
      .map((el) => (el.getAttribute('content') || '').trim())
      .filter(Boolean);

  const h1 = document.querySelector('h1');
  const title =
    meta(['meta[name="citation_title"]', 'meta[property="og:title"]']) ||
    (h1 && h1.textContent ? h1.textContent.trim() : '') ||
    document.title.trim();

  let authors = metaAll('meta[name="citation_author"]');
  if (!authors.length) authors = metaAll('meta[name="dc.creator"], meta[name="DC.creator"]');
  authors = Array.from(new Set(authors));

  let abstract = meta(['meta[name="citation_abstract"]', 'meta[name="description"]']);
  if (!abstract) {
    const el = document.querySelector('.abstract, #abstract, blockquote.abstract');
    abstract = el && el.textContent ? el.textContent.trim() : '';
  }

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
  let body = '';
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    const t = el && el.innerText ? el.innerText.trim() : '';
    if (t.length > body.length) body = t;
  }
  if (body.length < 400) {
    body = document.body && document.body.innerText ? document.body.innerText.trim() : '';
  }

  const text = [abstract ? 'Abstract: ' + abstract : '', body]
    .filter(Boolean)
    .join('\n\n')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const wordCount = (text.match(/\S+/g) || []).length;
  if (wordCount < 40) {
    return {
      ok: false,
      error:
        'Could not find enough article text on this page. Open the paper\u2019s abstract / full text or its PDF.',
    };
  }

  return {
    ok: true,
    paper: {
      title: title || 'Untitled',
      authors,
      abstract: abstract || undefined,
      text,
      source,
      url: pageUrl,
      wordCount,
    },
  };
}
