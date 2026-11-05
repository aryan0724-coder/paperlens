import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { LEMONSQUEEZY_WEBHOOK_SECRET } from '../_shared/env.ts';
import { admin } from '../_shared/supabaseAdmin.ts';

// Subscription statuses that should grant Pro access.
// 'cancelled' still has access until the period ends; 'subscription_expired'
// (status 'expired') turns it off.
const PRO_STATUSES = new Set(['active', 'on_trial', 'past_due', 'cancelled']);

async function verifySignature(raw: string, signature: string): Promise<boolean> {
  if (!LEMONSQUEEZY_WEBHOOK_SECRET || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LEMONSQUEEZY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);

  const raw = await req.text();
  const signature = (req.headers.get('X-Signature') ?? '').trim();
  if (!(await verifySignature(raw, signature))) {
    return errorResponse('Invalid webhook signature.', 401);
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { attributes?: { status?: string } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return errorResponse('Invalid JSON.', 400);
  }

  const eventName = payload.meta?.event_name ?? '';
  const userId = payload.meta?.custom_data?.user_id;
  const status = payload.data?.attributes?.status;

  if (!userId) return json({ ok: true, note: 'no user_id in custom_data; ignored' });

  let isPro = false;
  if (eventName.startsWith('subscription_')) {
    isPro = status ? PRO_STATUSES.has(status) : false;
  } else if (eventName === 'order_created') {
    isPro = status === 'paid';
  }

  const { error } = await admin.rpc('set_pro', {
    p_user: userId,
    p_is_pro: isPro,
    p_status: status ?? eventName ?? null,
  });
  if (error) return errorResponse(`DB update failed: ${error.message}`, 500);

  return json({ ok: true, userId, event: eventName, isPro });
});
