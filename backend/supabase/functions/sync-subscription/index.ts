import { getUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { EXTPAY_API_KEY, EXTPAY_ID } from '../_shared/env.ts';
import { admin } from '../_shared/supabaseAdmin.ts';

interface SyncBody {
  /** Client-observed paid flag from ExtPay (used only when server verification is unavailable). */
  paid?: boolean;
  status?: string | null;
  /** ExtPay's user identifier, when available, for server-side verification. */
  extpayUserId?: string;
}

/**
 * Best-effort server-side verification against ExtPay. If EXTPAY_API_KEY is set
 * we trust the ExtPay API; otherwise we fall back to the client-reported flag
 * (fine for development). For hardened production billing, prefer a Stripe
 * webhook that flips `is_pro` directly.
 */
async function verifyWithExtPay(extpayUserId?: string): Promise<boolean | null> {
  if (!EXTPAY_API_KEY || !extpayUserId) return null;
  try {
    const res = await fetch(
      `https://extensionpay.com/api/v1/${EXTPAY_ID}/user/${encodeURIComponent(extpayUserId)}`,
      { headers: { Authorization: `Bearer ${EXTPAY_API_KEY}` } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Boolean(data?.paid);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405, 'BAD_REQUEST');

  const user = await getUser(req);
  if (!user) return errorResponse('Please sign in.', 401, 'UNAUTHENTICATED');

  let body: SyncBody = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const verified = await verifyWithExtPay(body.extpayUserId);
  const isPaid = verified ?? Boolean(body.paid);

  const { error } = await admin.rpc('set_pro', {
    p_user: user.id,
    p_is_pro: isPaid,
    p_status: body.status ?? (isPaid ? 'active' : null),
  });
  if (error) return errorResponse(`Failed to update subscription: ${error.message}`, 500, 'INTERNAL');

  return json({ isPro: isPaid });
});
