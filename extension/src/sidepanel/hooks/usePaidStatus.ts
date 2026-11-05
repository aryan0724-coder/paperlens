import { useEffect, useState } from 'react';
import { syncSubscription } from '@/lib/api';
import { getPaidStatus, onPaid, type PaidStatus } from '@/lib/billing';
import { IS_BACKEND_CONFIGURED } from '@/lib/config';

export function usePaidStatus() {
  const [status, setStatus] = useState<PaidStatus>({ isPaid: false, status: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const s = await getPaidStatus();
      if (mounted) setStatus(s);
      // Keep the backend's is_pro flag in sync with ExtPay (best effort).
      if (s.isPaid && IS_BACKEND_CONFIGURED) {
        syncSubscription(true, s.status).catch(() => {});
      }
    };
    refresh().finally(() => {
      if (mounted) setLoading(false);
    });
    onPaid(() => refresh());
    return () => {
      mounted = false;
    };
  }, []);

  return { ...status, loading };
}
