import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import { Spinner } from './Spinner';

export function AuthGate() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      // onAuthChange in the parent swaps the view once the session lands.
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-4 mt-4">
      <h2 className="text-base font-semibold text-slate-800">
        {mode === 'signin' ? 'Sign in to PaperLens' : 'Create your PaperLens account'}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {mode === 'signin'
          ? 'Use your email and password.'
          : 'Pick an email and password to get started.'}
      </p>

      <form onSubmit={submit} className="mt-3 space-y-2">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@university.edu"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password (min 6 characters)"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? (
            <Spinner label="Please wait..." />
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-ghost mt-2 w-full"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError('');
        }}
        disabled={busy}
      >
        {mode === 'signin' ? 'No account? Create one' : 'Have an account? Sign in'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
