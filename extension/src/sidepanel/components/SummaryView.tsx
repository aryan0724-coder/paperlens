import { useState } from 'react';
import type { ExtractedPaper, PaperSummary } from '@shared/types';
import { summaryToMarkdown, toCitation } from '@/lib/format';
import { Markdown } from './Markdown';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function SummaryView({
  paper,
  summary,
  model,
}: {
  paper: ExtractedPaper;
  summary: PaperSummary;
  model?: string;
}) {
  const [copied, setCopied] = useState<'md' | 'cite' | null>(null);

  async function copy(kind: 'md' | 'cite') {
    const text =
      kind === 'md' ? summaryToMarkdown(paper, summary) : toCitation(paper);
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="card mx-4">
      <h2 className="text-sm font-semibold leading-snug text-slate-900">{paper.title}</h2>
      {paper.authors.length > 0 && (
        <p className="mt-0.5 text-xs text-slate-500">{paper.authors.slice(0, 8).join(', ')}</p>
      )}

      <Section title="TL;DR">
        <Markdown inline>{summary.tldr}</Markdown>
      </Section>

      <Section title="Key findings">
        <ul className="list-disc space-y-1 pl-4">
          {summary.keyFindings.map((f, i) => (
            <li key={i}>
              <Markdown inline>{f}</Markdown>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Methods">
        <Markdown inline>{summary.methods}</Markdown>
      </Section>

      <Section title="Contributions">
        <ul className="list-disc space-y-1 pl-4">
          {summary.contributions.map((c, i) => (
            <li key={i}>
              <Markdown inline>{c}</Markdown>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Limitations">
        <Markdown inline>{summary.limitations}</Markdown>
      </Section>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button className="btn btn-outline" onClick={() => copy('md')}>
          {copied === 'md' ? 'Copied!' : 'Copy Markdown'}
        </button>
        <button className="btn btn-outline" onClick={() => copy('cite')}>
          {copied === 'cite' ? 'Copied!' : 'Copy citation'}
        </button>
        {model && <span className="ml-auto text-[10px] text-slate-400">{model}</span>}
      </div>
    </div>
  );
}
