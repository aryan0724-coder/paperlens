import type { ExtractedPaper, PaperSummary } from '@shared/types';

/** Render a structured summary as copy-pasteable Markdown (with citation header). */
export function summaryToMarkdown(
  paper: Pick<ExtractedPaper, 'title' | 'authors' | 'url'>,
  s: PaperSummary,
): string {
  const authors = paper.authors.length ? paper.authors.join(', ') : 'Unknown authors';
  const lines: string[] = [];
  lines.push(`# ${paper.title || 'Untitled paper'}`);
  lines.push('');
  lines.push(`*${authors}*`);
  if (paper.url) lines.push(`<${paper.url}>`);
  lines.push('');
  lines.push('## TL;DR');
  lines.push(s.tldr || '-');
  lines.push('');
  lines.push('## Key findings');
  lines.push(...(s.keyFindings.length ? s.keyFindings.map((f) => `- ${f}`) : ['- -']));
  lines.push('');
  lines.push('## Methods');
  lines.push(s.methods || '-');
  lines.push('');
  lines.push('## Contributions');
  lines.push(...(s.contributions.length ? s.contributions.map((c) => `- ${c}`) : ['- -']));
  lines.push('');
  lines.push('## Limitations');
  lines.push(s.limitations || '-');
  lines.push('');
  lines.push('---');
  lines.push('_Summarized with PaperLens_');
  return lines.join('\n');
}

/** A simple BibTeX-ish citation stub (best effort from extracted metadata). */
export function toCitation(paper: Pick<ExtractedPaper, 'title' | 'authors' | 'url'>): string {
  const key = (paper.authors[0]?.split(' ').pop() || 'paper').toLowerCase().replace(/\W/g, '');
  const year = new Date().getFullYear();
  return [
    `@misc{${key}${year},`,
    `  title  = {${paper.title}},`,
    `  author = {${paper.authors.join(' and ')}},`,
    `  year   = {${year}},`,
    `  url    = {${paper.url}}`,
    '}',
  ].join('\n');
}
