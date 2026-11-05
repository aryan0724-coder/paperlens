import * as pdfjsLib from 'pdfjs-dist';
// Vite bundles the worker and gives us a URL served from the extension origin.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ExtractedPaper } from '@shared/types';
import { countWords } from '@/lib/extract-dom';
import { MSG, type ParsePdfMsg, type PaperResult } from '@/lib/messages';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PAGES = 40;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== MSG.PARSE_PDF) return false;
  parsePdf(msg as ParsePdfMsg)
    .then((paper) => sendResponse({ ok: true, paper } satisfies PaperResult))
    .catch((e) => sendResponse({ ok: false, error: (e as Error).message } satisfies PaperResult));
  return true;
});

async function parsePdf(msg: ParsePdfMsg): Promise<ExtractedPaper> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(msg.buffer) }).promise;
  const pages = Math.min(pdf.numPages, MAX_PAGES);
  const parts: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ('str' in it ? String((it as { str: string }).str) : ''))
      .join(' ');
    parts.push(line);
  }
  const text = parts
    .join('\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let title = '';
  let authors: string[] = [];
  try {
    const meta = await pdf.getMetadata();
    const info = meta?.info as { Title?: string; Author?: string } | undefined;
    if (info?.Title) title = info.Title.trim();
    if (info?.Author)
      authors = info.Author.split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
  } catch {
    /* metadata optional */
  }
  if (!title) title = guessTitle(text) || filenameFromUrl(msg.url);

  if (countWords(text) < 40) {
    throw new Error('This PDF has little or no extractable text (it may be a scanned image).');
  }

  return {
    title,
    authors,
    text,
    source: 'pdf',
    url: msg.url,
    wordCount: countWords(text),
  };
}

function guessTitle(text: string): string {
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 8 && l.length < 180);
  return firstLine || '';
}

function filenameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname.split('/').filter(Boolean).pop() || 'document.pdf';
    return decodeURIComponent(p);
  } catch {
    return 'document.pdf';
  }
}
