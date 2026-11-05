import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { GUMROAD_ACCESS_TOKEN } from '../_shared/env.ts';
import { admin } from '../_shared/supabaseAdmin.ts';

// Gumroad posts application/x-www-form-urlencoded "pings" / resource-subscription
// events. We read the user id (passed as a custom checkout query param, which
// Gumroad forwards as url_params[user_id]) and re-verify the sale via Gumroad's
// API before granting access.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);

  const form = new URLSearchParams(await req.text());
  const get = (k: string) => form.get(k) ?? undefined;

  const userId = form.get('url_params[user_id]') ?? form.get('user_id') ?? undefined;
  const saleId = get('sale_id');
  if (!userId) return json({ ok: true, note: 'no user_id in payload; ignored' });

  // Event flags present on refund / cancellation / ended events.
  const refunded = get('refunded') === 'true';
  const disputed = get('disputed') === 'true';
  const ended =
    get('ended') === 'true' ||
    Boolean(get('subscription_ended_at')) ||
    get('resource_name') === 'subscription_ended';

  // 'cancelled' means "won't renew" but access continues until the period ends,
  // so we keep Pro on until an actual 'ended' event.
  let isPro = !(refunded || disputed || ended);

  // Authenticity check: re-fetch the sale from Gumroad.
  if (saleId && GUMROAD_ACCESS_TOKEN) {
    try {
      const res = await fetch(
        `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}?access_token=${encodeURIComponent(GUMROAD_ACCESS_TOKEN)}`,
      );
      const data = await res.json();
      if (!data?.success) return errorResponse('Could not verify sale with Gumroad.', 401);
      const sale = data.sale ?? {};
      if (sale.refunded || sale.disputed || sale.chargebacked) isPro = false;
    } catch {
      // Network issue verifying -> fall back to the parsed flags above.
    }
  }

  const status = refunded ? 'refunded' : ended ? 'ended' : isPro ? 'active' : 'inactive';
  const { error } = await admin.rpc('set_pro', {
    p_user: userId,
    p_is_pro: isPro,
    p_status: status,
  });
  if (error) return errorResponse(`DB update failed: ${error.message}`, 500);

  return json({ ok: true, userId, isPro, status });
});
