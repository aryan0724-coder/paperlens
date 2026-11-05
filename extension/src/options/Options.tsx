import { signOut } from '@/lib/auth';
import { openPaymentPage } from '@/lib/billing';
import { IS_BACKEND_CONFIGURED, PRIVACY_URL, SUPPORT_EMAIL } from '@/lib/config';
import { useSession } from '@/sidepanel/hooks/useSession';
import { usePaidStatus } from '@/sidepanel/hooks/usePaidStatus';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{children}</span>
    </div>
  );
}

export function Options() {
  const { session, loading } = useSession();
  const paid = usePaidStatus();

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-base font-bold text-white">
          P
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">PaperLens settings</h1>
          <p className="text-xs text-slate-400">Research paper summarizer</p>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Account</h2>
        {!IS_BACKEND_CONFIGURED ? (
          <p className="text-sm text-amber-700">
            Backend not configured yet. Add Supabase env vars and rebuild.
          </p>
        ) : loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : session ? (
          <>
            <Row label="Signed in as">{session.user.email}</Row>
            <Row label="Plan">
              {paid.isPaid ? (
                <span className="chip bg-brand-100 text-brand-700">Pro</span>
              ) : (
                <span className="chip bg-slate-100 text-slate-600">Free</span>
              )}
            </Row>
            <div className="mt-4 flex gap-2">
              {!paid.isPaid && (
                <button className="btn btn-primary" onClick={openPaymentPage}>
                  Upgrade to Pro
                </button>
              )}
              <button className="btn btn-outline" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Open the side panel to sign in with your email.
          </p>
        )}
      </section>

      <section className="card mt-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Pro includes</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Fair-use unlimited summaries</li>
          <li>Higher-quality model</li>
          <li>Chat with any paper</li>
          <li>Markdown &amp; citation export</li>
        </ul>
      </section>

      <section className="card mt-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">About</h2>
        <Row label="Privacy policy">
          <a className="text-brand-600 hover:underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
            View
          </a>
        </Row>
        <Row label="Support">
          <a className="text-brand-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </Row>
      </section>
    </div>
  );
}
