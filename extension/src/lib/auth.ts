import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

/** Send a one-time 6-digit login code to the user's email. */
export async function sendOtp(email: string): Promise<void> {
  const s = getSupabase();
  if (!s) throw new Error('Backend not configured.');
  const { error } = await s.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Verify the emailed code and establish a session. */
export async function verifyOtp(email: string, token: string): Promise<Session | null> {
  const s = getSupabase();
  if (!s) throw new Error('Backend not configured.');
  const { data, error } = await s.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });
  if (error) throw error;
  return data.session;
}

export async function getSession(): Promise<Session | null> {
  const s = getSupabase();
  if (!s) return null;
  const { data } = await s.auth.getSession();
  return data.session;
}

export async function signOut(): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  await s.auth.signOut();
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const s = getSupabase();
  if (!s) return () => {};
  const { data } = s.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
