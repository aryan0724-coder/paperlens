import { useState } from 'react';
import type { ChatMessage, ExtractedPaper } from '@shared/types';
import { chatWithPaper } from '@/lib/api';
import { MAX_CHARS } from '@/lib/config';
import { Spinner } from './Spinner';

export function ChatPanel({
  paper,
  isPaid,
  onUpgrade,
}: {
  paper: ExtractedPaper;
  isPaid: boolean;
  onUpgrade: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput('');
    setError('');
    const next = [...messages, { role: 'user' as const, content: question }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await chatWithPaper({
        paperText: paper.text.slice(0, MAX_CHARS),
        question,
        history: messages,
      });
      setMessages([...next, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-4 mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Chat with this paper
      </h3>
      <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto w-fit max-w-[85%] rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white'
                : 'mr-auto w-fit max-w-[85%] rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700'
            }
          >
            {m.content}
          </div>
        ))}
        {busy && <Spinner label="Thinking..." />}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input
          className="input"
          placeholder="Ask about methods, results..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button className="btn btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
