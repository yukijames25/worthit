import { Crown, Lock } from 'lucide-react';

interface Props {
  title: string;
  body: string;
  onUpgrade: () => void;
  className?: string;
}

/** Pro 専用機能の場所に出すインラインのペイウォール。 */
export function PaywallCard({ title, body, onUpgrade, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className={[
        'tap-shrink w-full text-left rounded-2xl p-4 border-2 border-dashed',
        'border-amber-300 dark:border-amber-400/60',
        'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-[0.6875rem] font-bold uppercase tracking-wider">
        <Lock size={11} />
        Pro 機能
      </div>
      <div className="mt-1 text-[0.9375rem] font-semibold text-ink-900 dark:text-night-100">
        {title}
      </div>
      <div className="mt-0.5 text-[0.75rem] text-ink-600 dark:text-night-300 leading-relaxed">
        {body}
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-[0.75rem] font-bold text-orange-600 dark:text-amber-300">
        <Crown size={12} strokeWidth={2.6} />
        アップグレードする →
      </div>
    </button>
  );
}
