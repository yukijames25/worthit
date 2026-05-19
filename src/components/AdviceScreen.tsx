import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Calendar,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { PersonalityResult, Recommendation, Transaction } from '../types';
import type { RecurringRule } from '../hooks/useRecurring';
import { expenseSumsByCategory } from '../utils/scoring';
import { buildRecommendations, reasonForRecommendation } from '../utils/advice';
import { formatYen, formatYenCompact } from '../utils/format';
import { aggregateMonth, recentMonths } from '../utils/period';
import { useCategories } from '../context/CategoriesContext';
import { SubscriptionAuditCard } from './SubscriptionAuditCard';

interface Props {
  transactions: Transaction[];
  expense: number;
  income: number;
  result: PersonalityResult | null;
  onOpenResult: () => void;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
  recurringRules: RecurringRule[];
  onJumpToRecurring: (ruleId: string) => void;
}

export function AdviceScreen({
  transactions,
  expense,
  income,
  result,
  onOpenResult,
  isPro,
  onUpgrade,
  recurringRules,
  onJumpToRecurring,
}: Props) {
  const { getMeta } = useCategories();

  const sums = useMemo(
    () => expenseSumsByCategory(transactions),
    [transactions],
  );

  const pieData = useMemo(() => {
    const entries = Object.entries(sums).filter(([, v]) => v > 0);
    return entries
      .map(([category, value]) => {
        const meta = getMeta(category);
        return {
          id: category,
          label: meta.label,
          value,
          color: meta.color,
          ratio: expense > 0 ? value / expense : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [sums, expense, getMeta]);

  const { recommended, warnings } = useMemo(
    () => buildRecommendations(transactions, 3),
    [transactions],
  );

  const monthCount = isPro ? 12 : 6;
  const monthlyAggs = useMemo(() => {
    return recentMonths(monthCount)
      .map((range) => aggregateMonth(transactions, range))
      .reverse(); // 古い順
  }, [transactions, monthCount]);

  const currentMonth = monthlyAggs[monthlyAggs.length - 1];

  if (transactions.length === 0) {
    return (
      <div className="px-5 pb-32 animate-fade-up">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="px-5 pb-32 space-y-5 animate-fade-up">
      {/* 今月の振り返り */}
      <MonthlyReviewCard agg={currentMonth} />

      {/* 月別チャート */}
      <MonthlyChartCard
        months={monthlyAggs}
        isPro={isPro}
        onUpgrade={() => onUpgrade('年間チャート + 詳細分析')}
      />

      {/* サブスク断捨離チェック */}
      <SubscriptionAuditCard
        rules={recurringRules}
        transactions={transactions}
        isPro={isPro}
        onUpgrade={onUpgrade}
        onJumpToRecurring={onJumpToRecurring}
      />

      {/* おすすめカード */}
      <RecommendationCard
        title="あなたを幸せにするお金の使い方"
        subtitle="満足度の高いカテゴリ"
        tone="good"
        items={recommended}
      />

      {/* 警告カード */}
      <RecommendationCard
        title="注意すべき無駄遣い"
        subtitle="後悔の声が多いカテゴリ"
        tone="bad"
        items={warnings}
      />

      {/* 円グラフ */}
      <Card>
        <SectionTitle icon={<TrendingUp size={14} />}>支出の内訳</SectionTitle>
        {pieData.length === 0 ? (
          <p className="text-[0.8125rem] text-ink-500 dark:text-night-300">
            まだ支出の記録がありません。
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-[148px] shrink-0 relative animate-pop-in">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive
                    animationBegin={120}
                    animationDuration={700}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[0.625rem] font-semibold text-ink-400 dark:text-night-400">
                  カテゴリ
                </div>
                <div className="text-[1.25rem] font-bold leading-none text-ink-900 dark:text-night-100">
                  {pieData.length}
                </div>
              </div>
            </div>
            <ul className="flex-1 min-w-0 space-y-1.5">
              {pieData.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-2 text-[0.75rem]"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-ink-700 dark:text-night-200 truncate flex-1">
                    {d.label}
                  </span>
                  <span className="text-ink-500 dark:text-night-300 tabular-nums">
                    {(d.ratio * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-ink-100 dark:border-night-700 grid grid-cols-2 gap-3 text-[0.75rem]">
          <SummaryBlock label="収入" value={formatYen(income)} tone="good" />
          <SummaryBlock label="支出" value={formatYen(expense)} tone="bad" />
        </div>
      </Card>

      {/* 性格タイプ */}
      {result && (
        <button
          type="button"
          onClick={onOpenResult}
          className="tap-shrink w-full text-left relative overflow-hidden rounded-3xl p-5 shadow-ios-lg group"
          style={{ background: result.type.heroGradient }}
        >
          <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/30 blur-2xl" />
          <div className="relative flex items-center gap-4 text-white">
            <div className="size-14 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
              {result.type.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[0.6875rem] font-semibold tracking-wider uppercase text-white/80">
                <Sparkles size={12} />
                あなたの性格タイプ
              </div>
              <div className="text-[1.0625rem] font-bold mt-0.5 truncate">
                {result.type.name}
              </div>
              <div className="text-[0.6875rem] text-white/85 truncate">
                {result.type.tagline}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-white/80 group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </button>
      )}
    </div>
  );
}

function RecommendationCard({
  title,
  subtitle,
  tone,
  items,
}: {
  title: string;
  subtitle: string;
  tone: 'good' | 'bad';
  items: Recommendation[];
}) {
  const Icon = tone === 'good' ? Lightbulb : ShieldAlert;
  const headerClass =
    tone === 'good'
      ? 'from-emerald-500 to-teal-400'
      : 'from-rose-500 to-orange-400';
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={[
            'size-7 rounded-xl flex items-center justify-center text-white shadow-ios bg-gradient-to-br',
            headerClass,
          ].join(' ')}
        >
          <Icon size={14} strokeWidth={2.4} />
        </div>
        <div>
          <h2 className="text-[0.875rem] font-bold text-ink-900 dark:text-night-100 leading-tight">
            {title}
          </h2>
          <div className="text-[0.6875rem] text-ink-400 dark:text-night-400">
            {subtitle}
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 text-[0.75rem] text-ink-500 dark:text-night-300 leading-relaxed">
          {tone === 'good'
            ? '👍 評価がまだ少ないか、特に目立つカテゴリがありません。記録に「買ってよかった」をつけると、ここに推奨が表示されます。'
            : '👎 評価された支出のうち、後悔がついたカテゴリはまだありません。'}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((rec) => (
            <RecommendationRow key={rec.category} rec={rec} tone={tone} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecommendationRow({
  rec,
  tone,
}: {
  rec: Recommendation;
  tone: 'good' | 'bad';
}) {
  const { getMeta } = useCategories();
  const meta = getMeta(rec.category);
  const accent =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-300'
      : 'text-rose-600 dark:text-rose-300';
  return (
    <li className="flex items-start gap-3 rounded-2xl p-3 bg-ink-50 dark:bg-night-700/50">
      <div
        className={[
          'size-10 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br',
          meta.gradient,
        ].join(' ')}
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[0.875rem] font-semibold text-ink-900 dark:text-night-100 truncate">
            {rec.category}
          </div>
          <span
            className={[
              'text-[0.6875rem] font-bold tabular-nums shrink-0',
              accent,
            ].join(' ')}
          >
            {tone === 'good' ? '+' : '−'}
            {Math.abs(Math.round(rec.score * 100))}
          </span>
        </div>
        <p className="text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed mt-0.5">
          {reasonForRecommendation(rec, tone)}
        </p>
        <div className="text-[0.625rem] text-ink-400 dark:text-night-400 mt-1 tabular-nums">
          記録合計 {formatYen(rec.amount)}
        </div>
      </div>
    </li>
  );
}

function MonthlyReviewCard({
  agg,
}: {
  agg: ReturnType<typeof aggregateMonth> | undefined;
}) {
  if (!agg) return null;
  const evaluated = agg.good + agg.bad;
  const fulfilled = evaluated > 0 ? agg.good / evaluated : 0;
  const fulfilledPct = Math.round(fulfilled * 100);
  const topGood = agg.topCategories[0]?.category;
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[0.875rem] font-bold text-ink-900 dark:text-night-100 flex items-center gap-1.5">
          <Calendar size={14} />
          {agg.range.label} の振り返り
        </h2>
        {evaluated > 0 && (
          <span
            className={[
              'text-[0.6875rem] font-bold tabular-nums',
              fulfilled >= 0.6
                ? 'text-emerald-600 dark:text-emerald-300'
                : fulfilled < 0.4
                  ? 'text-rose-600 dark:text-rose-300'
                  : 'text-ink-500 dark:text-night-300',
            ].join(' ')}
          >
            満足度 {fulfilledPct}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-[0.75rem]">
        <SummaryBlock label="収入" value={formatYen(agg.income)} tone="good" />
        <SummaryBlock label="支出" value={formatYen(agg.expense)} tone="bad" />
      </div>
      {agg.expense > 0 && (
        <div className="mt-3 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3 text-[0.75rem] leading-relaxed text-ink-600 dark:text-night-200">
          {topGood ? (
            <>
              この月のいちばんの支出は
              <strong className="text-ink-900 dark:text-night-100"> {topGood} </strong>
              。
            </>
          ) : (
            'まだ支出記録がありません。'
          )}
          {evaluated === 0
            ? ' 👍👎をつけると、来月の提案がより的確になります。'
            : fulfilled >= 0.7
              ? ' 満たされる使い方ができてます！'
              : fulfilled < 0.4
                ? ' 後悔の比重が高め。買う前にひと呼吸を。'
                : ' 評価を増やして傾向を掴みましょう。'}
        </div>
      )}
    </Card>
  );
}

function MonthlyChartCard({
  months,
  isPro,
  onUpgrade,
}: {
  months: Array<ReturnType<typeof aggregateMonth>>;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  const hasAny = months.some((m) => m.expense > 0 || m.income > 0);
  if (!hasAny) return null;
  const data = months.map((m) => ({
    name: `${m.range.month}月`,
    expense: m.expense,
    income: m.income,
  }));
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={<TrendingUp size={14} />}>
          {isPro ? '過去12ヶ月の推移' : '過去6ヶ月の推移'}
        </SectionTitle>
        {!isPro && (
          <button
            type="button"
            onClick={onUpgrade}
            className="text-[0.625rem] font-bold tracking-wide rounded-full px-2 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-ios"
          >
            12ヶ月 PRO
          </button>
        )}
      </div>
      <div className="h-44 -mx-2 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={12}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-ink-400 dark:text-night-400"
            />
            <YAxis
              tickFormatter={(v: number) =>
                v === 0 ? '0' : formatYenCompact(v).replace('¥', '')
              }
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              width={42}
              className="text-ink-400 dark:text-night-400"
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
              formatter={(v, name) => [
                typeof v === 'number' ? formatYen(v) : String(v),
                name === 'expense' ? '支出' : '収入',
              ]}
            />
            <Bar dataKey="income" fill="#34D399" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#FF2E83" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center justify-center gap-4 text-[0.6875rem] text-ink-500 dark:text-night-300">
        <Legend color="#34D399" label="収入" />
        <Legend color="#FF2E83" label="支出" />
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function SummaryBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'bad';
}) {
  return (
    <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 px-3 py-2.5">
      <div className="text-[0.625rem] font-semibold uppercase tracking-wider text-ink-500 dark:text-night-400">
        {label}
      </div>
      <div
        className={[
          'mt-0.5 text-[0.9375rem] font-bold tabular-nums',
          tone === 'good'
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-ink-900 dark:text-night-100',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        'rounded-3xl p-5 shadow-ios border',
        'bg-white border-white',
        'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-[0.875rem] font-bold text-ink-800 dark:text-night-100 mb-3 flex items-center gap-1.5">
      {icon}
      {children}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 text-center animate-fade-up">
      <div className="mx-auto size-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-500/20 dark:to-brand-400/20 flex items-center justify-center text-4xl shadow-ios animate-float">
        💭
      </div>
      <h2 className="mt-4 text-[1.125rem] font-bold text-ink-900 dark:text-night-100">
        まだ分析できるデータがありません
      </h2>
      <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300 px-6 leading-relaxed">
        支出を記録して「買ってよかった👍」「後悔👎」をつけると、
        あなたの満足度に合わせた推奨と警告が表示されます。
      </p>
    </div>
  );
}
