import { Moon, Smartphone, Sun, Type } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { FontScale, ThemeMode } from '../types';

interface Props {
  onReset: () => void;
  transactionCount: number;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  Icon: typeof Sun;
  description: string;
}> = [
  { id: 'light', label: 'ライト', Icon: Sun, description: '常に明るい配色' },
  { id: 'dark', label: 'ダーク', Icon: Moon, description: '夜に優しい配色' },
  {
    id: 'system',
    label: 'システム',
    Icon: Smartphone,
    description: 'OSの設定に合わせる',
  },
];

const FONT_OPTIONS: Array<{ id: FontScale; label: string; sample: string }> = [
  { id: 'sm', label: '小', sample: 'Aa' },
  { id: 'md', label: '中', sample: 'Aa' },
  { id: 'lg', label: '大', sample: 'Aa' },
];

const FONT_SAMPLE_SIZE: Record<FontScale, string> = {
  sm: '0.875rem',
  md: '1.125rem',
  lg: '1.375rem',
};

export function SettingsScreen({ onReset, transactionCount }: Props) {
  const { theme, fontScale, setTheme, setFontScale } = useSettings();

  return (
    <div className="px-5 pb-32 space-y-5 animate-fade-up">
      {/* テーマ */}
      <Section title="外観" subtitle="ライト/ダーク/システムから選べます">
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.id;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                aria-pressed={active}
                className={[
                  'tap-shrink rounded-2xl p-3 flex flex-col items-center gap-1.5 border transition',
                  active
                    ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-white border-ink-100 text-ink-700 dark:bg-night-800 dark:border-night-700 dark:text-night-200',
                ].join(' ')}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span className="text-[0.75rem] font-semibold">
                  {opt.label}
                </span>
                <span
                  className={[
                    'text-[0.625rem] leading-tight text-center',
                    active
                      ? 'text-white/80'
                      : 'text-ink-400 dark:text-night-400',
                  ].join(' ')}
                >
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 文字サイズ */}
      <Section title="文字サイズ" subtitle="読みやすい大きさを選べます">
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((opt) => {
            const active = fontScale === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFontScale(opt.id)}
                aria-pressed={active}
                className={[
                  'tap-shrink rounded-2xl py-4 flex flex-col items-center gap-1 border transition',
                  active
                    ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-white border-ink-100 text-ink-700 dark:bg-night-800 dark:border-night-700 dark:text-night-200',
                ].join(' ')}
              >
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: FONT_SAMPLE_SIZE[opt.id] }}
                >
                  {opt.sample}
                </span>
                <span className="text-[0.75rem] font-semibold mt-1">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
          <Type size={12} className="mt-0.5 shrink-0" />
          <p>
            選んだサイズは即座に反映され、次回開いたときも保持されます。
          </p>
        </div>
      </Section>

      {/* データ */}
      <Section title="データ" subtitle="保存はこのブラウザ内のみで完結します">
        <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 mb-3">
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-ink-500 dark:text-night-400">
            記録件数
          </div>
          <div className="text-[1.375rem] font-bold tabular-nums text-ink-900 dark:text-night-100">
            {transactionCount}
            <span className="text-[0.875rem] font-medium ml-1">件</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10"
        >
          すべての記録を削除
        </button>
      </Section>

      {/* About */}
      <Section title="アプリについて">
        <p className="text-[0.8125rem] leading-relaxed text-ink-600 dark:text-night-300">
          このアプリは「過去の支出に対する満足度」をもとに、
          <strong className="text-ink-900 dark:text-night-100">
            未来の買い物を最適化する家計簿
          </strong>
          です。記録に👍👎をつけるほど、推奨と警告の精度が上がっていきます。
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        'rounded-3xl p-5 shadow-ios border',
        'bg-white border-white',
        'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div className="mb-3">
        <h2 className="text-[0.9375rem] font-bold text-ink-900 dark:text-night-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[0.6875rem] text-ink-400 dark:text-night-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
