import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components: Components = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-900">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-900">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-900">{children}</h3>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand-600 underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-200 pl-2 text-slate-500">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-2 max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-slate-200 last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-slate-200 px-2 py-1 text-left align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>
  ),
  hr: () => <hr className="my-2 border-slate-200" />,
};

const inlineComponents: Components = {
  ...components,
  p: ({ children }) => <span>{children}</span>,
};

/** Renders model-generated Markdown as clean, aligned content. */
export function Markdown({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inline ? inlineComponents : components}>
      {children}
    </ReactMarkdown>
  );
}
