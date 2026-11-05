import { MSG } from './messages';

// All ExtPay network calls happen in the background service worker (see
// background/service-worker.ts), where host_permissions cleanly bypass CORS.
// The UI only messages the worker - it never calls ExtPay directly.

export interface PaidStatus {
  isPaid: boolean;
  status: 'active' | 'past_due' | 'canceled' | null;
  email?: string;
}

export async function getPaidStatus(): Promise<PaidStatus> {
  try {
    const res = await chrome.runtime.sendMessage({ type: MSG.EXTPAY_GET_USER });
    if (res?.ok) {
      return {
        isPaid: Boolean(res.paid),
        status: (res.status as PaidStatus['status']) ?? null,
        email: res.email ?? undefined,
      };
    }
  } catch {
    /* worker unavailable -> treat as free */
  }
  return { isPaid: false, status: null };
}

export function openPaymentPage(): void {
  chrome.runtime.sendMessage({ type: MSG.EXTPAY_OPEN_PAYMENT }).catch(() => {});
}

/** Fires when the worker broadcasts that a payment/login completed. */
export function onPaid(cb: () => void): void {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === MSG.EXTPAY_PAID) cb();
  });
}
