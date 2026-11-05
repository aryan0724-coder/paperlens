import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange } from '@/lib/auth';
import { IS_BACKEND_CONFIGURED } from '@/lib/config';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(IS_BACKEND_CONFIGURED);

  useEffect(() => {
    if (!IS_BACKEND_CONFIGURED) {
      setLoading(false);
      return;
    }
    let mounted = true;
    getSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });
    const off = onAuthChange((s) => mounted && setSession(s));
    return () => {
      mounted = false;
      off();
    };
  }, []);

  return { session, loading, configured: IS_BACKEND_CONFIGURED };
}
