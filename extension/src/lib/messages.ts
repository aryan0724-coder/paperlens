// Message protocol shared across extension contexts
// (side panel <-> background <-> content script / offscreen).
import type { ExtractedPaper } from '@shared/types';

export const MSG = {
  GET_ACTIVE_PAPER: 'GET_ACTIVE_PAPER',
  EXTRACT_DOM: 'EXTRACT_DOM',
  PARSE_PDF: 'PARSE_PDF',
} as const;

export interface GetActivePaperMsg {
  type: typeof MSG.GET_ACTIVE_PAPER;
}
export interface ExtractDomMsg {
  type: typeof MSG.EXTRACT_DOM;
}
export interface ParsePdfMsg {
  type: typeof MSG.PARSE_PDF;
  url: string;
  buffer: ArrayBuffer;
}

export type PaperResult = { ok: true; paper: ExtractedPaper } | { ok: false; error: string };

/** Ask the background worker to extract the paper from the active tab. */
export async function requestActivePaper(): Promise<ExtractedPaper> {
  const res = (await chrome.runtime.sendMessage({ type: MSG.GET_ACTIVE_PAPER })) as
    | PaperResult
    | undefined;
  if (!res) throw new Error('No response from background worker.');
  if (!res.ok) throw new Error(res.error);
  return res.paper;
}
