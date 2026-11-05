import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

/** Sign in with email + password. */
export async function signIn(email: string, password: string): Promise<Session | null> {
  const s = getSupabase();
  if (!s) throw new Error('Backend not configured.');
  const { data, error } = await s.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.session;
}

/** Create an account with email + password (auto-confirmed on this project). */
export async function signUp(email: string, password: string): Promise<Session | null> {
  const s = getSupabase();
  if (!s) throw new Error('Backend not configured.');
  const { data, error } = await s.auth.signUp({ email: email.trim(), password });
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
