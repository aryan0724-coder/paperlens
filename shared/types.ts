/**
 * Shared API-contract types for PaperLens.
 *
 * These describe the data exchanged between the extension client and the backend
 * (summarize / chat) as well as the structured-summary shape rendered in the UI.
 * The Deno backend keeps a mirror of the relevant types in
 * `backend/supabase/functions/_shared/types.ts` (Deno can't import across the repo
 * root at deploy time), so keep the two in sync.
 */

export type PaperSource = 'arxiv' | 'pubmed' | 'biorxiv' | 'pdf' | 'generic';

/** Result of extracting a paper from a page or a PDF. */
export interface ExtractedPaper {
  title: string;
  authors: string[];
  abstract?: string;
  /** Full extracted plain text (may be truncated before sending to the backend). */
  text: string;
  source: PaperSource;
  url: string;
  wordCount: number;
}

/** A structured, model-generated summary of a paper. */
export interface PaperSummary {
  /** One or two sentence plain-language takeaway. */
  tldr: string;
  keyFindings: string[];
  methods: string;
  limitations: string;
  contributions: string[];
}

/** Per-user usage snapshot returned with each successful call. */
export interface UsageInfo {
  used: number;
  /** null => unlimited (Pro / fair-use). */
  limit: number | null;
  isPro: boolean;
  /** ISO date when the free monthly counter resets. */
  resetsOn: string;
}

export interface SummarizeRequest {
  paper: Pick<ExtractedPaper, 'title' | 'authors' | 'text' | 'url' | 'source'>;
}

export interface SummarizeResponse {
  summary: PaperSummary;
  usage: UsageInfo;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  paperText: string;
  question: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  usage: UsageInfo;
}

export interface ApiError {
  error: string;
  code?: 'QUOTA_EXCEEDED' | 'UNAUTHENTICATED' | 'BAD_REQUEST' | 'UPSTREAM_ERROR' | 'INTERNAL';
}
