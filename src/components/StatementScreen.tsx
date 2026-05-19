import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { Satisfaction, Transaction } from '../types';
import { formatDateHeader, formatYen, toDateKey } from '../utils/format';
import { satisfactionTally } from '../utils/advice';
import { useCategories } from '../context/CategoriesContext';
import {
  aggregateMonth,
  daysElapsedIn,
  daysInMonth,
  monthRangeOf,
} from '../utils/period';

interface Props {
  transactions: Transaction[];
  income: number;
  expense: number;
  net: number;
  budget: number | null;
  onCycleSatisfaction: (id: string, target: 'good' | 'bad') => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onSeed: () => void;
  onOpenSettings: () => void;
}

export function StatementScreen({
  transactions,
  income,
  expense,
  net,
  budget,
  onCycleSatisfaction,
  onRemove,
  onAdd,
  onSeed,
  onOpenSettings,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'unrated'>(
    'all',
  );
  const [query, setQuery] = useState('');

  const tally = useMemo(() => satisfactionTally(transactions), [transactions]);

  const thisMonth = useMemo(() => {
    const range = monthRangeOf(Date.now());
    const agg = aggregateMonth(transactions, range);
    const elapsed = daysElapsedIn(range);
    const total = daysInMonth(range);
    // 1 日あたりの支出ペースから月末予想を線形外挿
    const projected =
      elapsed > 0 ? Math.round((agg.expense / elapsed) * total) : 0;
    return {
      range,
      expense: agg.expense,
      income: agg.income,
      elapsed,
      total,
      projected,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && t.type !== 'expense') return false;
      if (filter === 'unrated') {
        if (t.type !== 'expense') return false;
        if (t.satisfaction !== 'neutral') return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          t.category.toLowerCase().includes(q) ||
          t.memo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filter, query]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="px-5 pb-32 animate-fade-up">
      {/* サマリーカード */}
      <div
        className={[
          'relative overflow-hidden rounded-3xl p-5 text-white shadow-ios-lg',
          'bg-gradient-to-br from-ink-900 to-ink-800 dark:from-night-700 dark:to-night-900 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -left-12 bottom-0 size-32 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-white/60 font-semibold">
            <Wallet size={13} />
            残高
          </div>
          <div className="mt-1 text-[2.25rem] font-bold leading-none tracking-tight tabular-nums">
            {formatYen(net)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[0.75rem]">
            <SummaryStat
              label="収入"
              value={formatYen(income)}
              tone="up"
            />
            <SummaryStat
              label="支出"
              value={formatYen(expense)}
              tone="down"
            />
          </div>
          {tally.total > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-white/70">
              <span>満足度</span>
              <SatisfactionMeter tally={tally} />
            </div>
          )}
        </div>
      </div>

      {/* 月予算カード */}
      <BudgetCard
        month={thisMonth.range.label}
        spent={thisMonth.expense}
        budget={budget}
        elapsed={thisMonth.elapsed}
        total={thisMonth.total}
        projected={thisMonth.projected}
        onOpenSettings={onOpenSettings}
      />

      {/* 検索 & フィルタ */}
      <div className="mt-4 space-y-2.5">
        <div
          className={[
            'flex items-center gap-2 rounded-2xl px-3.5 py-2.5',
            'bg-white border border-white shadow-ios',
            'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
          ].join(' ')}
        >
          <Search size={16} className="text-ink-400 dark:text-night-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="カテゴリやメモで検索…"
            className="flex-1 bg-transparent text-[0.875rem] text-ink-900 dark:text-night-100 placeholder:text-ink-400 dark:placeholder:text-night-400 focus:outline-none"
            aria-label="検索"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto thin-scroll -mx-1 px-1 pb-0.5">
          {(
            [
              { id: 'all', label: 'すべて' },
              { id: 'expense', label: '支出のみ' },
              { id: 'income', label: '収入のみ' },
              { id: 'unrated', label: '未評価' },
            ] as const
          ).map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={[
                  'tap-shrink shrink-0 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition',
                  active
                    ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-white text-ink-700 border border-ink-100 dark:bg-night-800 dark:text-night-200 dark:border-night-700',
                ].join(' ')}
                aria-pressed={active}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ステートメント */}
      <section className="mt-5">
        {transactions.length === 0 ? (
          <EmptyState onSeed={onSeed} onAdd={onAdd} />
        ) : filtered.length === 0 ? (
          <NoMatch />
        ) : (
          groups.map((g) => (
            <div key={g.key} className="mt-4 first:mt-0">
              <div className="px-1 mb-2 flex items-center justify-between">
                <h3 className="text-[0.75rem] font-bold uppercase tracking-wider text-ink-500 dark:text-night-300">
                  {g.title}
                </h3>
                <span className="text-[0.6875rem] text-ink-400 dark:text-night-400 tabular-nums">
                  {formatYen(g.dayTotal)}
                </span>
              </div>
              <ul
                className={[
                  'rounded-3xl overflow-hidden',
                  'bg-white border border-white shadow-ios',
                  'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
                ].join(' ')}
              >
                {g.items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    onCycleSatisfaction={onCycleSatisfaction}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* FAB - 追加 */}
      <button
        type="button"
        onClick={onAdd}
        aria-label="記録を追加"
        className={[
          'tap-shrink fixed z-20 bottom-[6.5rem] right-5 rounded-full size-14 flex items-center justify-center',
          'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios-lg',
          'hover:from-brand-400 hover:to-brand-500',
        ].join(' ')}
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function BudgetCard({
  month,
  spent,
  budget,
  elapsed,
  total,
  projected,
  onOpenSettings,
}: {
  month: string;
  spent: number;
  budget: number | null;
  elapsed: number;
  total: number;
  projected: number;
  onOpenSettings: () => void;
}) {
  if (budget === null) {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className={[
          'tap-shrink mt-3 w-full rounded-2xl p-4 text-left border-2 border-dashed',
          'border-ink-200 text-ink-500 dark:border-night-600 dark:text-night-300',
          'hover:border-brand-300 dark:hover:border-brand-400',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <Target size={14} />
          <span className="text-[0.8125rem] font-semibold">
            月の予算を設定して進捗を見る
          </span>
        </div>
        <div className="text-[0.6875rem] mt-0.5 text-ink-400 dark:text-night-400">
          {month}の支出 {formatYen(spent)}
        </div>
      </button>
    );
  }

  const ratio = budget > 0 ? Math.min(2, spent / budget) : 0;
  const overBudget = spent > budget;
  const willOverBudget = projected > budget;
  const remaining = budget - spent;

  // 0..1 を 0..100% に。1超は警告色で見せる
  const widthPct = Math.min(100, ratio * 100);
  const barColor = overBudget
    ? 'from-rose-500 to-red-500'
    : willOverBudget
      ? 'from-amber-400 to-orange-500'
      : 'from-emerald-400 to-teal-500';

  return (
    <div
      className={[
        'mt-3 rounded-2xl p-4 border shadow-ios',
        'bg-white border-white',
        'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ink-500 dark:text-night-300 text-[0.6875rem] font-semibold tracking-wider uppercase">
          <Target size={12} />
          {month} の予算
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[0.6875rem] text-brand-500 dark:text-brand-300 font-semibold"
        >
          変更
        </button>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[1.5rem] font-bold leading-none tabular-nums text-ink-900 dark:text-night-100">
          {formatYen(spent)}
        </span>
        <span className="text-[0.75rem] text-ink-400 dark:text-night-400 tabular-nums">
          / {formatYen(budget)}
        </span>
      </div>
      <div className="mt-2.5 h-2 rounded-full bg-ink-100 dark:bg-night-700 overflow-hidden">
        <div
          className={['h-full rounded-full bg-gradient-to-r', barColor].join(' ')}
          style={{ width: `${widthPct}%`, transition: 'width 600ms ease' }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.6875rem] tabular-nums">
        <span
          className={[
            'font-semibold',
            overBudget
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-ink-600 dark:text-night-200',
          ].join(' ')}
        >
          {overBudget
            ? `予算超過 ${formatYen(spent - budget)}`
            : `残り ${formatYen(remaining)}`}
        </span>
        <span className="text-ink-400 dark:text-night-400">
          {elapsed}/{total}日経過
          {projected > 0 && (
            <>
              {' · 月末予想 '}
              <strong
                className={[
                  willOverBudget && !overBudget
                    ? 'text-amber-600 dark:text-amber-300'
                    : '',
                ].join(' ')}
              >
                {formatYen(projected)}
              </strong>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'up' | 'down';
}) {
  const Icon = tone === 'up' ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1 text-white/60 text-[0.6875rem] font-semibold tracking-wider uppercase">
        <Icon size={11} className={tone === 'up' ? 'text-emerald-300' : 'text-rose-300'} />
        {label}
      </div>
      <div className="mt-0.5 text-[0.9375rem] font-bold tabular-nums">{value}</div>
    </div>
  );
}

function SatisfactionMeter({
  tally,
}: {
  tally: { good: number; bad: number; neutral: number; total: number };
}) {
  const { good, bad, neutral, total } = tally;
  if (total === 0) return null;
  const goodPct = (good / total) * 100;
  const badPct = (bad / total) * 100;
  const neuPct = (neutral / total) * 100;
  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10 flex">
        <div style={{ width: `${goodPct}%` }} className="bg-emerald-400" />
        <div style={{ width: `${neuPct}%` }} className="bg-white/30" />
        <div style={{ width: `${badPct}%` }} className="bg-rose-400" />
      </div>
      <span className="text-white tabular-nums text-[0.6875rem] font-semibold">
        {Math.round(goodPct)}%
      </span>
    </div>
  );
}

function TransactionRow({
  transaction,
  onCycleSatisfaction,
  onRemove,
}: {
  transaction: Transaction;
  onCycleSatisfaction: (id: string, target: 'good' | 'bad') => void;
  onRemove: (id: string) => void;
}) {
  const { getMeta } = useCategories();
  const meta = getMeta(transaction.category);
  const isIncome = transaction.type === 'income';

  return (
    <li className="statement-row group relative">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className={[
            'size-10 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br',
            meta.gradient,
          ].join(' ')}
          aria-hidden
        >
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-[0.9375rem] font-semibold text-ink-900 dark:text-night-100 truncate">
              {transaction.memo || meta.label}
            </div>
            {isIncome && (
              <span className="shrink-0 text-[0.625rem] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 rounded-full px-1.5 py-0.5">
                収入
              </span>
            )}
          </div>
          <div className="text-[0.6875rem] text-ink-400 dark:text-night-400 truncate">
            {meta.label}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={[
              'text-[0.9375rem] font-bold tabular-nums',
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-ink-900 dark:text-night-100',
            ].join(' ')}
          >
            {isIncome ? '+' : '−'}
            {formatYen(transaction.amount)}
          </div>
          {!isIncome && (
            <div className="mt-1.5 flex items-center justify-end gap-1">
              <SatisfactionButton
                value={transaction.satisfaction}
                target="good"
                onClick={() => onCycleSatisfaction(transaction.id, 'good')}
              />
              <SatisfactionButton
                value={transaction.satisfaction}
                target="bad"
                onClick={() => onCycleSatisfaction(transaction.id, 'bad')}
              />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(transaction.id)}
          aria-label="削除"
          className={[
            'opacity-0 group-hover:opacity-100 focus:opacity-100 tap-shrink',
            'ml-1 size-8 rounded-xl flex items-center justify-center shrink-0',
            'text-ink-400 hover:text-rose-500 hover:bg-rose-50',
            'dark:text-night-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10',
          ].join(' ')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function SatisfactionButton({
  value,
  target,
  onClick,
}: {
  value: Satisfaction;
  target: 'good' | 'bad';
  onClick: () => void;
}) {
  const active = value === target;
  const isGood = target === 'good';
  const Icon = isGood ? ThumbsUp : ThumbsDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={isGood ? '買ってよかった' : '買わなきゃよかった'}
      className={[
        'tap-shrink size-7 rounded-full flex items-center justify-center transition',
        active
          ? isGood
            ? 'bg-emerald-500 text-white shadow-ios'
            : 'bg-rose-500 text-white shadow-ios'
          : isGood
            ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300',
      ].join(' ')}
    >
      <Icon size={13} strokeWidth={2.4} />
    </button>
  );
}

function EmptyState({
  onSeed,
  onAdd,
}: {
  onSeed: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-8 text-center animate-fade-up">
      <div className="mx-auto size-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-500/20 dark:to-brand-400/20 flex items-center justify-center text-4xl shadow-ios animate-float">
        🪙
      </div>
      <h2 className="mt-4 text-[1.125rem] font-bold text-ink-900 dark:text-night-100">
        まずは最初の記録を
      </h2>
      <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300 px-6 leading-relaxed">
        収入や支出を記録すると、ここに利用明細のように並びます。
        買い物のあとは「買ってよかった👍 / 後悔👎」をワンタップで残せます。
      </p>
      <div className="mt-5 flex flex-col gap-2 px-5">
        <button
          type="button"
          onClick={onAdd}
          className="tap-shrink rounded-2xl py-3 bg-gradient-to-br from-brand-500 to-brand-400 text-white font-semibold shadow-ios-lg"
        >
          + 記録する
        </button>
        <button
          type="button"
          onClick={onSeed}
          className="tap-shrink text-[0.75rem] text-ink-500 dark:text-night-300 underline-offset-2 hover:underline"
        >
          まずはサンプルデータで試してみる
        </button>
      </div>
    </div>
  );
}

function NoMatch() {
  return (
    <div className="mt-12 text-center text-ink-400 dark:text-night-400 text-[0.8125rem]">
      該当する記録がありませんでした。
    </div>
  );
}

interface Group {
  key: string;
  title: string;
  items: Transaction[];
  dayTotal: number;
}

function groupByDate(transactions: Transaction[]): Group[] {
  const map = new Map<string, Group>();
  for (const t of transactions) {
    const key = toDateKey(t.date);
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        title: formatDateHeader(t.date),
        items: [],
        dayTotal: 0,
      };
      map.set(key, g);
    }
    g.items.push(t);
    g.dayTotal += t.type === 'income' ? t.amount : -t.amount;
  }
  // 日付降順
  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}
