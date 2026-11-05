import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SERVICE_ROLE_KEY, SUPABASE_URL } from './env.ts';

// Service-role client: bypasses RLS. Only ever used server-side in edge functions.
export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
