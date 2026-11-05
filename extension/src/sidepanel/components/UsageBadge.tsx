import type { UsageInfo } from '@shared/types';

export function UsageBadge({ usage, isPaid }: { usage: UsageInfo | null; isPaid: boolean }) {
  if (isPaid) return <span className="chip bg-brand-100 text-brand-700">Pro</span>;
  if (!usage) return null;
  const left = usage.limit == null ? '\u221e' : Math.max(0, usage.limit - usage.used);
  return <span className="chip bg-slate-100 text-slate-600">{left} free left</span>;
}
