import { LEMONSQUEEZY_CHECKOUT_URL } from './config';
import { getSupabase } from './supabase';

// Pro status is the source of truth in the backend (`profiles.is_pro`), set by
// the Lemon Squeezy webhook. The extension reads its own row via RLS, and opens
// the Lemon Squeezy hosted checkout to upgrade. No Stripe/ExtPay involved.

export interface PaidStatus {
  isPaid: boolean;
  status: string | null;
  email?: string;
}

export async function getPaidStatus(): Promise<PaidStatus> {
  const s = getSupabase();
  if (!s) return { isPaid: false, status: null };
  const { data } = await s.from('profiles').select('is_pro, extpay_status').maybeSingle();
  const isPaid = Boolean(data?.is_pro);
  return { isPaid, status: isPaid ? 'active' : null };
}

/** Opens the Lemon Squeezy checkout, tagged with the user's id + email so the
 *  webhook can match the purchase back to this account. */
export async function openPaymentPage(): Promise<void> {
  if (!LEMONSQUEEZY_CHECKOUT_URL) {
    console.warn('VITE_LS_CHECKOUT_URL not configured.');
    return;
  }
  const s = getSupabase();
  let email: string | undefined;
  let userId: string | undefined;
  if (s) {
    const { data } = await s.auth.getUser();
    email = data.user?.email ?? undefined;
    userId = data.user?.id;
  }
  const url = new URL(LEMONSQUEEZY_CHECKOUT_URL);
  if (email) url.searchParams.set('checkout[email]', email);
  if (userId) url.searchParams.set('checkout[custom][user_id]', userId);
  await chrome.tabs.create({ url: url.toString() });
}
