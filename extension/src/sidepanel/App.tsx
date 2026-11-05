import { useState } from 'react';
import type { ExtractedPaper, PaperSummary, UsageInfo } from '@shared/types';
import { ApiCallError, summarizePaper } from '@/lib/api';
import { openPaymentPage } from '@/lib/billing';
import { IS_BACKEND_CONFIGURED, IS_PAYMENTS_CONFIGURED, MAX_CHARS } from '@/lib/config';
import { requestActivePaper } from '@/lib/messages';
import { AuthGate } from './components/AuthGate';
import { ChatPanel } from './components/ChatPanel';
import { Spinner } from './components/Spinner';
import { SummaryView } from './components/SummaryView';
import { UsageBadge } from './components/UsageBadge';
import { useSession } from './hooks/useSession';
import { usePaidStatus } from './hooks/usePaidStatus';

type Phase = 'idle' | 'extracting' | 'summarizing';

export default function App() {
  const { session, loading: sessionLoading, configured } = useSession();
  const paid = usePaidStatus();

  const [phase, setPhase] = useState<Phase>('idle');
  const [paper, setPaper] = useState<ExtractedPaper | null>(null);
  const [summary, setSummary] = useState<PaperSummary | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [model, setModel] = useState<string>();
  const [error, setError] = useState('');
  const [quotaHit, setQuotaHit] = useState(false);

  async function handleSummarize() {
    setError('');
    setQuotaHit(false);
    setSummary(null);
    setPhase('extracting');
    try {
      const extracted = await requestActivePaper();
      setPaper(extracted);
      setPhase('summarizing');
      const res = await summarizePaper({
        paper: {
          title: extracted.title,
          authors: extracted.authors,
          text: extracted.text.slice(0, MAX_CHARS),
          url: extracted.url,
          source: extracted.source,
        },
      });
      setSummary(res.summary);
      setUsage(res.usage);
      setModel(res.model);
    } catch (err) {
      if (err instanceof ApiCallError && err.code === 'QUOTA_EXCEEDED') {
        setQuotaHit(true);
      } else if (err instanceof ApiCallError && err.code === 'UNAUTHENTICATED') {
        setError('Please sign in to summarize papers.');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
          P
        </div>
        <div className="font-semibold text-slate-900">PaperLens</div>
        <div className="ml-auto flex items-center gap-2">
          <UsageBadge usage={usage} isPaid={paid.isPaid} />
          <button
            className="btn btn-ghost px-2"
            title="Settings"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            {'\u2699'}
          </button>
        </div>
      </header>

      {!configured && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Backend not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>, then rebuild to enable
          summaries.
        </div>
      )}

      <main className="scroll-area flex-1 pb-6">
        {configured && sessionLoading ? (
          <div className="p-4">
            <Spinner label="Loading..." />
          </div>
        ) : configured && !session ? (
          <AuthGate />
        ) : (
          <>
            <div className="p-4">
              <button className="btn btn-primary w-full" onClick={handleSummarize} disabled={busy}>
                {phase === 'extracting' ? (
                  <Spinner label="Reading page..." />
                ) : phase === 'summarizing' ? (
                  <Spinner label="Summarizing..." />
                ) : (
                  'Summarize this page'
                )}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">
                Works on arXiv, PubMed, bioRxiv, journal pages and PDFs.
              </p>
            </div>

            {quotaHit && (
              <div className="card mx-4 text-center">
                <p className="text-sm text-slate-700">
                  You&apos;ve used your free summaries for this month.
                </p>
                {IS_PAYMENTS_CONFIGURED ? (
                  <button className="btn btn-primary mt-2" onClick={openPaymentPage}>
                    Upgrade to Pro
                  </button>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Pro (unlimited + chat) is coming soon.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mx-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {summary && paper && (
              <>
                <SummaryView paper={paper} summary={summary} model={model} />
                <ChatPanel
                  paper={paper}
                  summary={summary}
                  isPaid={paid.isPaid}
                  onUpgrade={openPaymentPage}
                />
              </>
            )}

            {!summary && !busy && !error && !quotaHit && (
              <div className="mx-4 mt-6 text-center text-sm text-slate-400">
                Open a paper or PDF, then click <span className="font-medium">Summarize</span>.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
