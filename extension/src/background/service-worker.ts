import ExtPay from 'extpay';
import { EXTPAY_ID } from '@/lib/config';
import { MSG, type PaperResult } from '@/lib/messages';

// ExtPay must run in the background to process payments / sync status.
const extpay = ExtPay(EXTPAY_ID);
extpay.startBackground();

// Open the side panel when the toolbar icon is clicked.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((e) => console.warn('setPanelBehavior failed', e));
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== MSG.GET_ACTIVE_PAPER) return false;
  getActivePaper()
    .then(sendResponse)
    .catch((e: unknown) =>
      sendResponse({ ok: false, error: (e as Error).message } satisfies PaperResult),
    );
  return true; // async response
});

async function getActivePaper(): Promise<PaperResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return { ok: false, error: 'No active tab found.' };
  const url = tab.url;

  if (!/^https?:/i.test(url)) {
    return { ok: false, error: 'Open a paper page (arXiv, PubMed, a journal) or a PDF, then retry.' };
  }

  if (isPdfUrl(url)) return extractPdf(url);

  // Try the declared content script first; fall back to on-demand injection.
  try {
    return (await chrome.tabs.sendMessage(tab.id, { type: MSG.EXTRACT_DOM })) as PaperResult;
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content-script.ts'],
      });
      return (await chrome.tabs.sendMessage(tab.id, { type: MSG.EXTRACT_DOM })) as PaperResult;
    } catch {
      return {
        ok: false,
        error: 'This page type is not supported yet. Open an arXiv/PubMed/journal page or a PDF.',
      };
    }
  }
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
