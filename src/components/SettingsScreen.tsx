import { useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Download,
  LogIn,
  LogOut,
  Moon,
  Palette,
  Repeat,
  Smartphone,
  Sun,
  Target,
  Type,
  Upload,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import type { FontScale, ThemeMode, Transaction } from '../types';
import {
  diffImport,
  downloadCsv,
  type ImportRow,
  parseCsv,
  transactionsToCsv,
} from '../utils/csv';
import { formatYen, toDateKey } from '../utils/format';
import { ImportPrompt } from './ImportPrompt';

interface Props {
  onReset: () => void;
  transactionCount: number;
  transactions: Transaction[];
  budget: number | null;
  onSetBudget: (next: number | null) => void;
  onOpenCategoryEditor: () => void;
  onOpenRecurring: () => void;
  recurringCount: number;
  onImportCsv: (rows: ImportRow[]) => void;
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

export function SettingsScreen({
  onReset,
  transactionCount,
  transactions,
  budget,
  onSetBudget,
  onOpenCategoryEditor,
  onOpenRecurring,
  recurringCount,
  onImportCsv,
}: Props) {
  const { theme, fontScale, setTheme, setFontScale } = useSettings();
  const { mode, user, signInWithGoogle, signOut, exitLocal } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<{
    fresh: ImportRow[];
    duplicates: number;
    errors: string[];
  } | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.malformed) {
      window.alert(`CSVを読み取れませんでした: ${parsed.errors.join(', ')}`);
      return;
    }
    const { fresh, duplicates } = diffImport(parsed.rows, transactions);
    setImportState({ fresh, duplicates, errors: parsed.errors });
  };

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

      {/* 予算 */}
      <Section
        title="月の予算"
        subtitle="目安を決めると進捗バーで超過を予測します"
      >
        <BudgetInput budget={budget} onSetBudget={onSetBudget} />
      </Section>

      {/* カスタマイズ */}
      <Section title="カスタマイズ">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenCategoryEditor}
            className="tap-shrink w-full rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 flex items-center gap-3"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white shadow-ios shrink-0">
              <Palette size={16} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[0.875rem] font-semibold">
                カテゴリを管理
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                絵文字・色・名前を自分仕様に
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-ink-400 dark:text-night-400 shrink-0"
            />
          </button>
          <button
            type="button"
            onClick={onOpenRecurring}
            className="tap-shrink w-full rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 flex items-center gap-3"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-ios shrink-0">
              <Repeat size={16} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[0.875rem] font-semibold">
                定期取引
                {recurringCount > 0 && (
                  <span className="ml-1.5 text-[0.6875rem] text-ink-400 dark:text-night-400 tabular-nums">
                    {recurringCount}件
                  </span>
                )}
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                家賃やサブスクを毎月自動で記録
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-ink-400 dark:text-night-400 shrink-0"
            />
          </button>
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
        <div className="space-y-2">
          <button
            type="button"
            disabled={transactions.length === 0}
            onClick={() => {
              const csv = transactionsToCsv(transactions);
              downloadCsv(`worthit-${toDateKey(Date.now())}.csv`, csv);
            }}
            className={[
              'tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold flex items-center justify-center gap-1.5 transition',
              transactions.length === 0
                ? 'bg-ink-100 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
            ].join(' ')}
          >
            <Download size={14} />
            CSVでエクスポート
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
          >
            <Upload size={14} />
            CSVをインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={onReset}
            className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10"
          >
            すべての記録を削除
          </button>
        </div>
      </Section>

      <ImportPrompt
        open={importState !== null}
        fresh={importState?.fresh ?? []}
        duplicates={importState?.duplicates ?? 0}
        errors={importState?.errors ?? []}
        onCancel={() => setImportState(null)}
        onConfirm={() => {
          if (importState) onImportCsv(importState.fresh);
          setImportState(null);
        }}
      />

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

const PRESET_BUDGETS = [30000, 50000, 80000, 100000, 150000, 200000];

function BudgetInput({
  budget,
  onSetBudget,
}: {
  budget: number | null;
  onSetBudget: (next: number | null) => void;
}) {
  const [draft, setDraft] = useState<string>(
    budget !== null ? String(budget) : '',
  );
  const [justSaved, setJustSaved] = useState(false);

  const apply = (v: string) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      onSetBudget(null);
      setDraft('');
    } else {
      onSetBudget(n);
      setDraft(String(Math.round(n)));
    }
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1200);
  };

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div
          className={[
            'flex-1 flex items-center gap-1 rounded-2xl px-3.5',
            'bg-white border border-ink-100 shadow-ios',
            'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
          ].join(' ')}
        >
          <Target size={14} className="text-ink-400 dark:text-night-400 shrink-0" />
          <span className="text-[1.0625rem] font-bold text-ink-900 dark:text-night-100">
            ¥
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/^0+(?=\d)/, ''))}
            onBlur={(e) => apply(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-[1.0625rem] font-bold leading-none text-ink-900 dark:text-night-100 placeholder:text-ink-300 dark:placeholder:text-night-500 focus:outline-none py-3"
            aria-label="月の予算"
          />
        </div>
        <button
          type="button"
          onClick={() => apply(draft)}
          className={[
            'tap-shrink rounded-2xl px-4 font-semibold text-[0.8125rem] transition shrink-0',
            justSaved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios',
          ].join(' ')}
        >
          {justSaved ? <Check size={16} strokeWidth={3} /> : '保存'}
        </button>
      </div>
      {budget !== null && (
        <div className="mt-2 text-[0.6875rem] text-ink-500 dark:text-night-300 tabular-nums">
          現在: {formatYen(budget)} / 月
        </div>
      )}
      <div className="mt-3 flex gap-1.5 overflow-x-auto thin-scroll -mx-1 px-1 pb-0.5">
        {PRESET_BUDGETS.map((v) => {
          const active = budget === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => apply(String(v))}
              className={[
                'tap-shrink shrink-0 rounded-full px-3 py-1.5 text-[0.6875rem] font-semibold transition',
                active
                  ? 'bg-brand-500 text-white shadow-ios'
                  : 'bg-ink-100 text-ink-600 dark:bg-night-700 dark:text-night-200',
              ].join(' ')}
            >
              {formatYen(v)}
            </button>
          );
        })}
        {budget !== null && (
          <button
            type="button"
            onClick={() => apply('')}
            className="tap-shrink shrink-0 rounded-full px-3 py-1.5 text-[0.6875rem] font-semibold text-ink-500 dark:text-night-300"
          >
            予算なしに戻す
          </button>
        )}
      </div>
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
