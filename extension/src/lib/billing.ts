import { CHECKOUT_URL } from './config';
import { getSupabase } from './supabase';

// Pro status is the source of truth in the backend (`profiles.is_pro`), set by
// the Gumroad webhook. The extension reads its own row via RLS, and opens the
// Gumroad hosted checkout to upgrade. No Stripe/ExtPay involved.

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

/** Opens the Gumroad checkout, tagged with the user's id + email so the webhook
 *  can match the purchase back to this account. */
export async function openPaymentPage(): Promise<void> {
  if (!CHECKOUT_URL) {
    console.warn('VITE_CHECKOUT_URL not configured.');
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
  const url = new URL(CHECKOUT_URL);
  // Gumroad forwards custom query params to the webhook as url_params[...].
  if (userId) url.searchParams.set('user_id', userId);
  if (email) url.searchParams.set('email', email);
  url.searchParams.set('wanted', 'true'); // open the Gumroad checkout directly
  await chrome.tabs.create({ url: url.toString() });
}
