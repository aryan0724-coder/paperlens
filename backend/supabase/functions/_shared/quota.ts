import { admin } from './supabaseAdmin.ts';
import { FREE_MONTHLY_LIMIT } from './env.ts';
import type { UsageInfo } from './types.ts';

export interface ConsumeResult extends UsageInfo {
  allowed: boolean;
}

/** Atomically enforce the monthly free limit and increment usage. */
export async function consumeSummary(userId: string): Promise<ConsumeResult> {
  const { data, error } = await admin.rpc('consume_summary', {
    p_user: userId,
    p_free_limit: FREE_MONTHLY_LIMIT,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  const isPro = Boolean(row.is_pro);
  return {
    allowed: Boolean(row.allowed),
    used: Number(row.used),
    isPro,
    limit: isPro ? null : FREE_MONTHLY_LIMIT,
    resetsOn: String(row.resets_on),
  };
}

export async function getUsage(userId: string): Promise<UsageInfo> {
  const { data } = await admin
    .from('profiles')
    .select('is_pro, summary_count')
    .eq('id', userId)
    .maybeSingle();
  const isPro = Boolean(data?.is_pro);
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1, 1);
  return {
    used: Number(data?.summary_count ?? 0),
    limit: isPro ? null : FREE_MONTHLY_LIMIT,
    isPro,
    resetsOn: nextReset.toISOString().slice(0, 10),
  };
}

export async function isPro(userId: string): Promise<boolean> {
  const { data } = await admin
    .from('profiles')
    .select('is_pro')
    .eq('id', userId)
    .maybeSingle();
  return Boolean(data?.is_pro);
}
