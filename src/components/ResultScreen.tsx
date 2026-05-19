import {
  Crown,
  Heart,
  RotateCcw,
  Smile,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { PersonalityResult } from '../types';
import { useCategories } from '../context/CategoriesContext';
import { formatYen } from '../utils/format';

interface Props {
  result: PersonalityResult | null;
  totalSpent: number;
  onBackToStatement: () => void;
  onReset: () => void;
}

const AXIS_LABELS: Array<{
  key: keyof PersonalityResult['axes'];
  label: string;
}> = [
  { key: 'social', label: '社交性' },
  { key: 'strategic', label: '戦略性' },
  { key: 'passionate', label: '情熱度' },
  { key: 'impulsive', label: '直感性' },
  { key: 'balanced', label: 'バランス' },
  { key: 'fulfilled', label: '満足度' },
];

export function ResultScreen({
  result,
  totalSpent,
  onBackToStatement,
  onReset,
}: Props) {
  const { getMeta } = useCategories();

  if (!result) {
    return (
      <div className="px-5 pb-32 animate-fade-up text-center">
        <div className="mt-12">
          <div className="mx-auto size-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-500/20 dark:to-brand-400/20 flex items-center justify-center text-4xl shadow-ios animate-float">
            🔮
          </div>
          <h2 className="mt-4 text-[1.125rem] font-bold text-ink-900 dark:text-night-100">
            まずは支出を記録しましょう
          </h2>
          <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300 px-6 leading-relaxed">
            あなたのお金の使い方と満足度から、性格タイプを診断します。
          </p>
          <button
            type="button"
            onClick={onBackToStatement}
            className="tap-shrink mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-white font-semibold shadow-ios-lg"
          >
            <Sparkles size={16} />
            明細を見る
          </button>
        </div>
      </div>
    );
  }

  const {
    type,
    confidence,
    topCategories,
    axes,
    advice,
    summary,
    regretRatio,
  } = result;

  return (
    <div className="px-5 pb-32 space-y-5 animate-fade-up">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-ios-lg animate-pop-in"
        style={{ background: type.heroGradient }}
      >
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 size-32 rounded-full bg-white/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-wider uppercase text-white/80">
              <Crown size={13} />
              診断結果
            </div>
            <ConfidenceRing value={confidence} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="size-16 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner">
              {type.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-[0.625rem] font-semibold tracking-[0.2em] uppercase text-white/75">
                YOU ARE
              </div>
              <div className="text-[1.375rem] font-bold leading-tight">
                {type.name}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[0.875rem] leading-relaxed text-white/95 font-medium">
            「{type.tagline}」
          </p>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-white/80">
            {summary}
          </p>
        </div>
      </div>

      {/* 満足度ハイライト */}
      <Card>
        <SectionTitle icon={<Smile size={14} />}>満足度サマリー</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <SatStat
            label="満たされ度"
            value={`${Math.round(axes.fulfilled * 100)}%`}
            color="#22c55e"
            hint="評価のうち good の割合"
          />
          <SatStat
            label="後悔率"
            value={`${Math.round(regretRatio * 100)}%`}
            color="#ef4444"
            hint="評価のうち bad の割合"
          />
        </div>
        <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-600 dark:text-night-300">
          {axes.fulfilled >= 0.7
            ? '満足度の高い使い方ができています。この「ご機嫌になる支出パターン」を継続しましょう。'
            : axes.fulfilled <= 0.35
              ? '後悔の比重が高め。買う前に「これは未来の自分が喜ぶ？」を一度問い直してみるとよさそうです。'
              : 'ニュートラル域。記録に👍👎の評価を増やすほど、診断と提案の精度が上がります。'}
        </p>
      </Card>

      {/* 性格の輪郭 */}
      <Card>
        <SectionTitle icon={<Heart size={14} />}>あなたの輪郭</SectionTitle>
        <p className="text-[0.875rem] leading-relaxed text-ink-700 dark:text-night-200">
          {type.description}
        </p>
      </Card>

      {/* AI アドバイス */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-ink-900 to-ink-800 dark:from-night-700 dark:to-night-900 text-white shadow-ios-lg dark:shadow-ios-dark">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          }}
        />
        <div className="flex items-center gap-1.5 mb-3">
          <div className="size-6 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" strokeWidth={2.6} />
          </div>
          <div className="text-[0.6875rem] font-semibold tracking-[0.2em] uppercase bg-clip-text text-transparent bg-[linear-gradient(90deg,#fff,#ffd1e3,#fff)] bg-[length:200%_100%] animate-shimmer">
            AI Coach
          </div>
        </div>
        <div className="space-y-3">
          {advice.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-[0.84375rem] leading-relaxed text-white/90"
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TraitsCard
          title="得意なこと"
          accent={type.accent}
          items={type.strengths}
        />
        <TraitsCard
          title="気にすべきこと"
          accent="#FF7676"
          items={type.blindspots}
        />
      </div>

      {/* 6 軸 */}
      <Card>
        <SectionTitle icon={<TrendingUp size={14} />}>性格軸スコア</SectionTitle>
        <ul className="space-y-2.5 mt-1">
          {AXIS_LABELS.map(({ key, label }) => {
            const v = axes[key];
            const isSat = key === 'fulfilled';
            return (
              <li key={key}>
                <div className="flex items-center justify-between text-[0.75rem] mb-1">
                  <span className="text-ink-700 dark:text-night-200 font-medium">
                    {label}
                  </span>
                  <span className="text-ink-500 dark:text-night-300 tabular-nums">
                    {Math.round(v * 100)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100 dark:bg-night-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round(v * 100)}%`,
                      background: isSat ? '#22c55e' : type.accent,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* トップカテゴリ */}
      <Card>
        <SectionTitle icon={<Crown size={14} />}>支出のトップ3</SectionTitle>
        <div className="mt-1 space-y-2">
          {topCategories.map((t, idx) => {
            const meta = getMeta(t.category);
            const amount = totalSpent * t.ratio;
            return (
              <div
                key={t.category}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-ink-50 dark:bg-night-700/50"
              >
                <div className="text-[0.6875rem] font-bold text-ink-400 dark:text-night-400 tabular-nums w-4 text-center">
                  {idx + 1}
                </div>
                <div
                  className={[
                    'size-9 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br',
                    meta.gradient,
                  ].join(' ')}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8125rem] font-semibold text-ink-900 dark:text-night-100 truncate">
                    {t.category}
                  </div>
                  <div className="text-[0.65625rem] text-ink-500 dark:text-night-300">
                    {(t.ratio * 100).toFixed(1)}% · {formatYen(amount)}
                  </div>
                </div>
                <div
                  className="h-1.5 w-12 rounded-full overflow-hidden bg-white dark:bg-night-800"
                  aria-hidden
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, t.ratio * 100 * 2)}%`,
                      background: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <button
        type="button"
        onClick={onReset}
        className="tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-500 dark:text-night-300 hover:text-rose-500 transition"
      >
        <RotateCcw size={14} />
        記録をリセットして最初から
      </button>
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

function TraitsCard({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <div
      className={[
        'rounded-3xl p-4 shadow-ios border',
        'bg-white border-white',
        'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div
        className="text-[0.6875rem] font-bold tracking-wider uppercase mb-2"
        style={{ color: accent }}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="text-[0.78125rem] text-ink-700 dark:text-night-200 leading-snug flex gap-1.5"
          >
            <span
              className="mt-1 size-1.5 rounded-full shrink-0"
              style={{ background: accent }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SatStat({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string;
  color: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 px-3.5 py-3">
      <div className="text-[0.625rem] font-semibold tracking-wider uppercase text-ink-500 dark:text-night-400">
        {label}
      </div>
      <div
        className="mt-0.5 text-[1.375rem] font-bold leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 text-[0.625rem] text-ink-400 dark:text-night-400">
        {hint}
      </div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const size = 46;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - value / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[0.6875rem] font-bold leading-none tabular-nums">
          {value}
        </span>
        <span className="text-[0.4375rem] tracking-widest opacity-80">
          CONF
        </span>
      </div>
    </div>
  );
}
