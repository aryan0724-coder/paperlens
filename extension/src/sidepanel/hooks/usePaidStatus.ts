import { useEffect, useState } from 'react';
import { getPaidStatus, type PaidStatus } from '@/lib/billing';

export function usePaidStatus() {
  const [status, setStatus] = useState<PaidStatus>({ isPaid: false, status: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const refresh = () =>
      getPaidStatus().then((s) => {
        if (mounted) setStatus(s);
      });
    refresh().finally(() => {
      if (mounted) setLoading(false);
    });
    // The Lemon Squeezy webhook updates is_pro server-side after checkout (which
    // happens in another tab), so re-check when the panel regains focus and on a
    // light interval.
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(refresh, 15000);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(id);
    };
  }, []);

  return { ...status, loading };
}
