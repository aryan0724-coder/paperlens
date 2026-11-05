import { extractFromDocument } from '@/lib/extract-dom';
import { MSG, type PaperResult } from '@/lib/messages';

// Runs on supported paper hosts. Extracts the paper on demand from the
// background worker (triggered when the user clicks "Summarize").
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== MSG.EXTRACT_DOM) return false;
  try {
    const paper = extractFromDocument(document, location.href);
    sendResponse({ ok: true, paper } satisfies PaperResult);
  } catch (e) {
    sendResponse({ ok: false, error: (e as Error).message } satisfies PaperResult);
  }
  return true;
});
