import { useRef, useState } from 'react';
import type { ChatMessage, ExtractedPaper, PaperSummary } from '@shared/types';
import { chatWithPaper } from '@/lib/api';
import { MAX_CHARS } from '@/lib/config';
import { Markdown } from './Markdown';
import { Spinner } from './Spinner';

export function ChatPanel({
  paper,
  summary,
  isPaid,
  onUpgrade,
}: {
  paper: ExtractedPaper;
  summary: PaperSummary | null;
  isPaid: boolean;
  onUpgrade: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  }

  if (!isPaid) {
    return (
      <div className="card mx-4 mt-3 text-center">
        <p className="text-sm text-slate-600">Chat with this paper is a Pro feature.</p>
        <button className="btn btn-primary mt-2" onClick={onUpgrade}>
          Upgrade to Pro
        </button>
      </div>
    );
  }

  async function submitMessage() {
    const question = input.trim();
    if (!question || busy) return;
    setInput('');
    setError('');
    if (taRef.current) taRef.current.style.height = 'auto';
    const next = [...messages, { role: 'user' as const, content: question }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await chatWithPaper({
        paperText: paper.text.slice(0, MAX_CHARS),
        question,
        history: messages,
        summary: summary ?? undefined,
      });
      setMessages([...next, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitMessage();
  }

  return (
    <div className="card mx-4 mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Chat with this paper
      </h3>
      <div className="mt-2 space-y-2">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div
              key={i}
              className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="mr-auto max-w-full break-words rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"
            >
              <Markdown>{m.content}</Markdown>
            </div>
          ),
        )}
        {busy && <Spinner label="Thinking..." />}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="mt-2 flex items-end gap-2">
        <textarea
          ref={taRef}
          rows={1}
          className="input max-h-36 resize-none leading-relaxed"
          placeholder="Ask about methods, results...  (Shift+Enter for a new line)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoGrow(e.target);
          }}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />
        <button className="btn btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
