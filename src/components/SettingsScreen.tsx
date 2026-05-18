import {
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Moon,
  Smartphone,
  Sun,
  Type,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
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
  const { mode, user, signInWithGoogle, signOut, exitLocal } = useAuth();

  return (
    <div className="px-5 pb-32 space-y-5 animate-fade-up">
      {/* アカウント */}
      <Section title="アカウント">
        <AccountBlock
          mode={mode}
          email={user?.email ?? null}
          name={
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.name as string | undefined) ??
            null
          }
          avatar={user?.user_metadata?.avatar_url as string | undefined}
        />
        <div className="mt-3 space-y-2">
          {mode === 'authenticated' && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} />
              ログアウト
            </button>
          )}
          {mode === 'local-only' && (
            <button
              type="button"
              onClick={exitLocal}
              className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              Googleでログインしてクラウド同期
            </button>
          )}
          {mode === 'unauthenticated' && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              ログイン
            </button>
          )}
        </div>
      </Section>

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
      <Section
        title="データ"
        subtitle={
          mode === 'authenticated'
            ? 'クラウド (Supabase) に保存されています'
            : 'このブラウザ内に保存されています'
        }
      >
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

      <Section title="アプリについて">
        <p className="text-[0.8125rem] leading-relaxed text-ink-600 dark:text-night-300">
          「過去の支出に対する満足度」をもとに
          <strong className="text-ink-900 dark:text-night-100">
            未来の買い物を最適化する家計簿
          </strong>
          。👍👎をつけるほど推奨と警告の精度が上がります。
        </p>
      </Section>
    </div>
  );
}

function AccountBlock({
  mode,
  email,
  name,
  avatar,
}: {
  mode: ReturnType<typeof useAuth>['mode'];
  email: string | null;
  name: string | null;
  avatar?: string;
}) {
  if (mode === 'authenticated') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-3.5">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="size-10 rounded-full bg-emerald-200 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 font-bold flex items-center justify-center">
            {(name ?? email ?? '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-semibold text-emerald-700 dark:text-emerald-200 truncate">
            {name ?? 'ログイン中'}
          </div>
          <div className="text-[0.6875rem] text-emerald-700/80 dark:text-emerald-300/80 truncate flex items-center gap-1">
            <Cloud size={11} />
            {email ?? 'クラウド同期 ON'}
          </div>
        </div>
      </div>
    );
  }
  if (mode === 'local-only') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5">
        <div className="size-10 rounded-full bg-ink-200 dark:bg-night-600 flex items-center justify-center text-ink-600 dark:text-night-200">
          <CloudOff size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-semibold text-ink-900 dark:text-night-100">
            ローカルモード
          </div>
          <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
            この端末のブラウザのみに保存されています
          </div>
        </div>
      </div>
    );
  }
  if (mode === 'cloud-disabled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5">
        <div className="size-10 rounded-full bg-ink-200 dark:bg-night-600 flex items-center justify-center text-ink-600 dark:text-night-200">
          <CloudOff size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-semibold text-ink-900 dark:text-night-100">
            クラウド同期は未設定
          </div>
          <div className="text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
            Supabaseの環境変数を設定するとログイン同期が有効になります。
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5">
      <div className="size-10 rounded-full bg-ink-200 dark:bg-night-600 flex items-center justify-center text-ink-600 dark:text-night-200">
        <LogIn size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[0.875rem] font-semibold text-ink-900 dark:text-night-100">
          未ログイン
        </div>
        <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
          Google でログインすると複数端末で同期できます
        </div>
      </div>
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
