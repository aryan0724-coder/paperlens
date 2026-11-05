// Mirror of /shared/types.ts for the Deno edge runtime (kept in sync manually).

export type PaperSource = 'arxiv' | 'pubmed' | 'biorxiv' | 'pdf' | 'generic';

export interface PaperSummary {
  tldr: string;
  keyFindings: string[];
  methods: string;
  limitations: string;
  contributions: string[];
}

export interface UsageInfo {
  used: number;
  limit: number | null;
  isPro: boolean;
  resetsOn: string;
}

export interface SummarizeRequest {
  paper: {
    title: string;
    authors: string[];
    text: string;
    url: string;
    source: PaperSource;
  };
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
