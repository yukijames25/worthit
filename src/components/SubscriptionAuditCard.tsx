import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Recycle,
  Trash2,
} from 'lucide-react';
import type { Transaction } from '../types';
import type { RecurringRule } from '../hooks/useRecurring';
import {
  type AuditEntry,
  type AuditVerdict,
  buildSubscriptionAudit,
  estimatedMonthlySavings,
  groupByVerdict,
} from '../utils/subscriptionAudit';
import { useCategories } from '../context/CategoriesContext';
import { formatYen } from '../utils/format';

interface Props {
  rules: RecurringRule[];
  transactions: Transaction[];
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
  onJumpToRecurring: (ruleId: string) => void;
}

const VERDICT_META: Record<
  AuditVerdict,
  {
    title: string;
    icon: typeof CheckCircle2;
    accent: string;
    bg: string;
    border: string;
  }
> = {
  cancel: {
    title: '🚨 解約を強く推奨',
    icon: Trash2,
    accent: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50/70 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
  },
  review: {
    title: '⚠️ 見直し候補',
    icon: AlertTriangle,
    accent: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50/70 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  keep: {
    title: '✅ 価値あり (継続推奨)',
    icon: CheckCircle2,
    accent: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50/70 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
  unrated: {
    title: '🤷 まだ評価不足',
    icon: HelpCircle,
    accent: 'text-ink-500 dark:text-night-300',
    bg: 'bg-ink-50 dark:bg-night-700/40',
    border: 'border-ink-200 dark:border-night-700',
  },
};

export function SubscriptionAuditCard({
  rules,
  transactions,
  isPro,
  onUpgrade,
  onJumpToRecurring,
}: Props) {
  const audit = useMemo(
    () => buildSubscriptionAudit(rules, transactions),
    [rules, transactions],
  );
  const grouped = useMemo(() => groupByVerdict(audit), [audit]);
  const savings = useMemo(() => estimatedMonthlySavings(audit), [audit]);

  // 定期取引が 1 つも無い時はカード自体を出さない
  if (audit.length === 0) return null;

  // 全部 keep なら、それだけ褒める軽いカードに
  const hasActionable =
    grouped.cancel.length > 0 || grouped.review.length > 0;

  return (
    <div
      className={[
        'rounded-3xl p-5 shadow-ios border',
        'bg-white border-white',
        'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-xl flex items-center justify-center text-white shadow-ios bg-gradient-to-br from-fuchsia-500 to-pink-500">
          <Recycle size={14} strokeWidth={2.4} />
        </div>
        <div>
          <h2 className="text-[0.875rem] font-bold text-ink-900 dark:text-night-100 leading-tight">
            サブスク断捨離チェック
          </h2>
          <div className="text-[0.6875rem] text-ink-400 dark:text-night-400">
            直近3ヶ月の評価から再点検
          </div>
        </div>
      </div>

      {/* Pro: 節約見込みサマリー */}
      {isPro && hasActionable && savings > 0 && (
        <div className="mb-3 rounded-2xl p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-500/30">
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">
            節約できそうな金額（月あたり）
          </div>
          <div className="text-[1.5rem] font-bold tabular-nums text-ink-900 dark:text-night-100">
            {formatYen(savings)}
          </div>
          <div className="text-[0.625rem] text-ink-500 dark:text-night-400">
            ＝ 年間 {formatYen(savings * 12)} の節約候補
          </div>
        </div>
      )}

      {/* 各 verdict グループ */}
      <div className="space-y-3">
        {(['cancel', 'review', 'keep'] as AuditVerdict[]).map((v) => {
          const items = grouped[v];
          if (items.length === 0) return null;
          return (
            <VerdictGroup
              key={v}
              verdict={v}
              items={items}
              isPro={isPro}
              onUpgrade={onUpgrade}
              onJumpToRecurring={onJumpToRecurring}
            />
          );
        })}

        {/* unrated グループは Pro だけに表示 (情報過多回避) */}
        {isPro && grouped.unrated.length > 0 && (
          <VerdictGroup
            verdict="unrated"
            items={grouped.unrated}
            isPro={isPro}
            onUpgrade={onUpgrade}
            onJumpToRecurring={onJumpToRecurring}
          />
        )}
      </div>

      {/* 無料ユーザーへの Pro 誘導 */}
      {!isPro && hasActionable && (
        <button
          type="button"
          onClick={() => onUpgrade('節約見込み額 + 1タップ停止')}
          className="tap-shrink mt-3 w-full rounded-2xl py-2.5 text-[0.75rem] font-semibold text-amber-800 dark:text-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-500/30"
        >
          💡 Pro で月の節約見込み額 + 1タップ解約 →
        </button>
      )}
    </div>
  );
}

function VerdictGroup({
  verdict,
  items,
  isPro,
  onUpgrade,
  onJumpToRecurring,
}: {
  verdict: AuditVerdict;
  items: AuditEntry[];
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
  onJumpToRecurring: (ruleId: string) => void;
}) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  return (
    <div className={['rounded-2xl border p-3', meta.bg, meta.border].join(' ')}>
      <div className={['flex items-center gap-1.5 mb-2', meta.accent].join(' ')}>
        <Icon size={13} strokeWidth={2.4} />
        <h3 className="text-[0.75rem] font-bold tracking-wide uppercase">
          {meta.title}
        </h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <AuditRow
            key={item.ruleId}
            entry={item}
            verdict={verdict}
            isPro={isPro}
            onUpgrade={onUpgrade}
            onJumpToRecurring={onJumpToRecurring}
          />
        ))}
      </ul>
    </div>
  );
}

function AuditRow({
  entry,
  verdict,
  isPro,
  onUpgrade,
  onJumpToRecurring,
}: {
  entry: AuditEntry;
  verdict: AuditVerdict;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
  onJumpToRecurring: (ruleId: string) => void;
}) {
  const { getMeta } = useCategories();
  const meta = getMeta(entry.category);
  const showActionable = verdict === 'cancel' || verdict === 'review';

  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-night-800/70 p-2.5">
      <div
        className="size-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: meta.color }}
        aria-hidden
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-semibold text-ink-900 dark:text-night-100 truncate">
          {entry.label}
        </div>
        <div className="text-[0.6875rem] text-ink-500 dark:text-night-300 tabular-nums">
          {formatYen(entry.monthlyAmount)}/月
          {isPro && entry.lifetimeSpent > 0 && (
            <> · 累計 {formatYen(entry.lifetimeSpent)}</>
          )}
        </div>
        {entry.hits > 0 && (
          <div className="mt-1 text-[0.625rem] text-ink-400 dark:text-night-400 tabular-nums">
            👍{entry.good}件 / 👎{entry.bad}件 / 未評価{entry.neutral}件
          </div>
        )}
      </div>
      {showActionable && (
        <button
          type="button"
          onClick={() => {
            if (isPro) {
              onJumpToRecurring(entry.ruleId);
            } else {
              onUpgrade('1タップで定期取引を停止');
            }
          }}
          className={[
            'tap-shrink text-[0.6875rem] font-semibold rounded-full px-2.5 py-1.5 shrink-0',
            isPro
              ? 'bg-rose-500 text-white shadow-ios'
              : 'bg-ink-100 dark:bg-night-700 text-ink-600 dark:text-night-300',
          ].join(' ')}
        >
          {isPro ? '停止' : '🔒 Pro'}
        </button>
      )}
    </li>
  );
}
