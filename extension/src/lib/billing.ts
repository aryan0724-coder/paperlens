import ExtPay from 'extpay';
import { EXTPAY_ID } from './config';

// A single ExtPay instance per context. In the service worker we also call
// `startBackground()` (see background/service-worker.ts). ExtPay transparently
// coordinates between contexts via the background page.
const extpay = ExtPay(EXTPAY_ID);

export interface PaidStatus {
  isPaid: boolean;
  status: 'active' | 'past_due' | 'canceled' | null;
  email?: string;
}

export async function getPaidStatus(): Promise<PaidStatus> {
  try {
    const user = await extpay.getUser();
    return {
      isPaid: Boolean(user.paid),
      status: user.subscriptionStatus ?? null,
      email: user.email ?? undefined,
    };
  } catch {
    // ExtPay not reachable (e.g. not configured yet) -> treat as free.
    return { isPaid: false, status: null };
  }
}

export function openPaymentPage(): void {
  extpay.openPaymentPage();
}

export function onPaid(cb: () => void): void {
  try {
    extpay.onPaid.addListener(() => cb());
  } catch {
    /* no-op if ExtPay unavailable */
  }
}
