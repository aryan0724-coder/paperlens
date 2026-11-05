import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { ANON_KEY, SUPABASE_URL } from './env.ts';

export interface AuthedUser {
  id: string;
  email?: string;
}

/** Resolve the authenticated user from the request's Bearer token, or null. */
export async function getUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}
