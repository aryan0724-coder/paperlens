import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { IS_BACKEND_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// Persist the Supabase session in chrome.storage.local so it survives across
// the side panel, options page, and service worker.
const chromeStorageAdapter = {
  getItem: (key: string): Promise<string | null> =>
    chrome.storage.local.get(key).then((r) => (r[key] as string | undefined) ?? null),
  setItem: (key: string, value: string): Promise<void> =>
    chrome.storage.local.set({ [key]: value }),
  removeItem: (key: string): Promise<void> => chrome.storage.local.remove(key),
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!IS_BACKEND_CONFIGURED) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: chromeStorageAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
