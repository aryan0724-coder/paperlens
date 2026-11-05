import { useState } from 'react';
import { sendOtp, verifyOtp } from '@/lib/auth';
import { Spinner } from './Spinner';

export function AuthGate() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await sendOtp(email);
      setStep('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await verifyOtp(email, code);
      // onAuthChange in the parent swaps the view once the session lands.
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-4 mt-4">
      <h2 className="text-base font-semibold text-slate-800">Sign in to PaperLens</h2>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;ll email you a one-time code. No password needed.
      </p>

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="mt-3 space-y-2">
          <input
            type="email"
            required
            placeholder="you@university.edu"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? <Spinner label="Sending..." /> : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-3 space-y-2">
          <input
            inputMode="numeric"
            required
            placeholder="6-digit code"
            className="input tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? <Spinner label="Verifying..." /> : 'Verify & sign in'}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => setStep('email')}
            disabled={busy}
          >
            Use a different email
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
