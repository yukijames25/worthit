import { useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Crown,
  Download,
  FileText,
  Lock,
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
  Users,
} from 'lucide-react';
import { ProBadge } from './pro/ProBadge';
import { openCustomerPortal } from '../lib/billing';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import type { FontScale, Locale, ThemeMode, Transaction } from '../types';
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
  isPro: boolean;
  planStatus: string;
  currentPeriodEnd: number | null;
  onUpgrade: (feature?: string) => void;
  perCategoryBudgetCount: number;
  onOpenCategoryBudgets: () => void;
  pdfGenerating: boolean;
  onGeneratePdf: () => void;
  onOpenHousehold: () => void;
  onOpenNotion: () => void;
  onOpenAiCoach: () => void;
}

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
  isPro,
  planStatus,
  currentPeriodEnd,
  onUpgrade,
  perCategoryBudgetCount,
  onOpenCategoryBudgets,
  pdfGenerating,
  onGeneratePdf,
  onOpenHousehold,
  onOpenNotion,
  onOpenAiCoach,
}: Props) {
  const { theme, fontScale, locale, setTheme, setFontScale, setLocale } =
    useSettings();
  const { mode, user, signInWithGoogle, signOut, exitLocal } = useAuth();
  const { t, f } = useTranslation();

  const THEME_OPTIONS: Array<{
    id: ThemeMode;
    label: string;
    Icon: typeof Sun;
    description: string;
  }> = [
    { id: 'light', label: t.theme_light, Icon: Sun, description: t.theme_light_desc },
    { id: 'dark', label: t.theme_dark, Icon: Moon, description: t.theme_dark_desc },
    {
      id: 'system',
      label: t.theme_system,
      Icon: Smartphone,
      description: t.theme_system_desc,
    },
  ];

  const FONT_OPTIONS: Array<{ id: FontScale; label: string; sample: string }> = [
    { id: 'sm', label: t.font_sm, sample: 'Aa' },
    { id: 'md', label: t.font_md, sample: 'Aa' },
    { id: 'lg', label: t.font_lg, sample: 'Aa' },
  ];

  const LOCALE_OPTIONS: Array<{ id: Locale; label: string; flag: string }> = [
    { id: 'ja', label: t.lang_ja, flag: '🇯🇵' },
    { id: 'en', label: t.lang_en, flag: '🇬🇧' },
  ];

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
      <Section title={t.settings_accountTitle}>
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
              {t.settings_logout}
            </button>
          )}
          {mode === 'local-only' && (
            <button
              type="button"
              onClick={exitLocal}
              className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              {t.settings_loginToSync}
            </button>
          )}
          {mode === 'unauthenticated' && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              {t.settings_login}
            </button>
          )}
        </div>
      </Section>

      {/* AI コーチ (目玉機能) */}
      <button
        type="button"
        onClick={onOpenAiCoach}
        className={[
          'tap-shrink w-full rounded-3xl p-5 text-left relative overflow-hidden',
          'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-ios-lg',
        ].join(' ')}
      >
        <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Bot size={22} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.6875rem] tracking-wider uppercase font-bold text-white/80">
              NEW · 無料3回/月
            </div>
            <div className="text-[1.0625rem] font-bold leading-tight">
              AI パーソナル FP
            </div>
            <div className="text-[0.6875rem] text-white/85 leading-snug">
              あなたの支出傾向と満足度から、優しくアドバイス
            </div>
          </div>
          <ChevronRight size={20} className="text-white/80 shrink-0" />
        </div>
      </button>

      {/* Pro */}
      <ProSection
        isPro={isPro}
        planStatus={planStatus}
        currentPeriodEnd={currentPeriodEnd}
        onUpgrade={() => onUpgrade()}
      />

      {/* 予算 */}
      <Section
        title={t.settings_budgetTitle}
        subtitle={t.settings_budgetSubtitle}
      >
        <BudgetInput budget={budget} onSetBudget={onSetBudget} />
        <button
          type="button"
          onClick={onOpenCategoryBudgets}
          className={[
            'tap-shrink mt-3 w-full rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 flex items-center gap-3',
            !isPro ? 'opacity-95' : '',
          ].join(' ')}
        >
          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-ios shrink-0">
            {isPro ? <Target size={16} /> : <Lock size={16} />}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[0.875rem] font-semibold flex items-center gap-1.5">
              カテゴリ別予算
              {!isPro && (
                <span className="text-[0.5625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  PRO
                </span>
              )}
              {isPro && perCategoryBudgetCount > 0 && (
                <span className="text-[0.6875rem] text-ink-400 dark:text-night-400 tabular-nums font-normal">
                  {perCategoryBudgetCount}件
                </span>
              )}
            </div>
            <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
              {isPro
                ? '外食・趣味など、カテゴリごとに月の上限を設定'
                : 'カテゴリごとに上限を設定 (Pro 限定)'}
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-ink-400 dark:text-night-400 shrink-0"
          />
        </button>
      </Section>

      {/* カスタマイズ */}
      <Section title={t.settings_customizeTitle}>
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
                {t.settings_categoryManage}
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                {t.settings_categorySubtle}
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
                {t.settings_recurring}
                {recurringCount > 0 && (
                  <span className="ml-1.5 text-[0.6875rem] text-ink-400 dark:text-night-400 tabular-nums">
                    {f(t.settings_recurringCount, { count: recurringCount })}
                  </span>
                )}
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                {t.settings_recurringSubtle}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-ink-400 dark:text-night-400 shrink-0"
            />
          </button>
          <button
            type="button"
            onClick={onOpenHousehold}
            className="tap-shrink w-full rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 flex items-center gap-3"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white shadow-ios shrink-0">
              <Users size={16} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[0.875rem] font-semibold flex items-center gap-1.5">
                家族グループ
                {!isPro && (
                  <span className="text-[0.5625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                家族や同居人とトランザクションを共有
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-ink-400 dark:text-night-400 shrink-0"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                onUpgrade('Notion 自動同期');
              } else {
                onOpenNotion();
              }
            }}
            className="tap-shrink w-full rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 flex items-center gap-3"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-ink-900 to-ink-700 dark:from-night-600 dark:to-night-800 flex items-center justify-center text-white shadow-ios shrink-0">
              <span className="text-base">N</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[0.875rem] font-semibold flex items-center gap-1.5">
                Notion 自動同期
                {!isPro && (
                  <span className="text-[0.5625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
                記録を Notion データベースにも自動保存
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-ink-400 dark:text-night-400 shrink-0"
            />
          </button>
        </div>
      </Section>

      {/* 言語 */}
      <Section title={t.settings_langTitle} subtitle={t.settings_langSubtitle}>
        <div className="grid grid-cols-2 gap-2">
          {LOCALE_OPTIONS.map((opt) => {
            const active = locale === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLocale(opt.id)}
                aria-pressed={active}
                className={[
                  'tap-shrink rounded-2xl p-3 flex flex-col items-center gap-1.5 border transition',
                  active
                    ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-white border-ink-100 text-ink-700 dark:bg-night-800 dark:border-night-700 dark:text-night-200',
                ].join(' ')}
              >
                <span className="text-2xl leading-none">{opt.flag}</span>
                <span className="text-[0.8125rem] font-semibold">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* テーマ */}
      <Section title={t.settings_appearance} subtitle={t.settings_appearance_sub}>
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
      <Section title={t.settings_fontTitle} subtitle={t.settings_fontSubtitle}>
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
          <p>{t.font_note}</p>
        </div>
      </Section>

      {/* データ */}
      <Section
        title={t.settings_dataTitle}
        subtitle={
          mode === 'authenticated'
            ? t.settings_dataCloud
            : t.settings_dataLocal
        }
      >
        <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 mb-3">
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-ink-500 dark:text-night-400">
            {t.settings_recordCount}
          </div>
          <div className="text-[1.375rem] font-bold tabular-nums text-ink-900 dark:text-night-100">
            {transactionCount}
            <span className="text-[0.875rem] font-medium ml-1">
              {t.settings_count_unit}
            </span>
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
            {t.settings_export}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPro) {
                fileInputRef.current?.click();
              } else {
                onUpgrade(t.settings_import);
              }
            }}
            className={[
              'tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold flex items-center justify-center gap-1.5',
              isPro
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
            ].join(' ')}
          >
            {isPro ? <Upload size={14} /> : <Lock size={14} />}
            {t.settings_import}
            {!isPro && (
              <span className="ml-1 text-[0.625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                PRO
              </span>
            )}
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
            onClick={onGeneratePdf}
            disabled={pdfGenerating}
            className={[
              'tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold flex items-center justify-center gap-1.5',
              pdfGenerating ? 'opacity-60 cursor-wait' : '',
              isPro
                ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
            ].join(' ')}
          >
            {isPro ? <FileText size={14} /> : <Lock size={14} />}
            {pdfGenerating ? 'PDF生成中…' : 'PDFレポートをダウンロード'}
            {!isPro && (
              <span className="ml-1 text-[0.625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                PRO
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10"
          >
            {t.settings_deleteAll}
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

      <Section title={t.settings_about}>
        <p className="text-[0.8125rem] leading-relaxed text-ink-600 dark:text-night-300">
          {t.about_body
            .split('{strong}')
            .map((piece, i, arr) => (
              <span key={i}>
                {piece}
                {i < arr.length - 1 && (
                  <strong className="text-ink-900 dark:text-night-100">
                    {t.appTagline}
                  </strong>
                )}
              </span>
            ))}
        </p>
      </Section>
    </div>
  );
}

function ProSection({
  isPro,
  planStatus,
  currentPeriodEnd,
  onUpgrade,
}: {
  isPro: boolean;
  planStatus: string;
  currentPeriodEnd: number | null;
  onUpgrade: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      await openCustomerPortal();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  if (isPro) {
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
    const periodStr = periodEnd
      ? `${periodEnd.getFullYear()}/${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`
      : null;
    return (
      <section
        className={[
          'rounded-3xl p-5 shadow-ios border',
          'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50',
          'dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/30 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-[0.9375rem] font-bold text-amber-900 dark:text-amber-100">
            worthit
          </h2>
          <ProBadge size="md" />
        </div>
        <div className="rounded-2xl bg-white/70 dark:bg-night-800/70 p-3 mb-3">
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">
            {planStatus === 'past_due'
              ? '⚠️ お支払いが滞っています'
              : planStatus === 'trialing'
                ? 'トライアル中'
                : 'アクティブ'}
          </div>
          {periodStr && (
            <div className="mt-0.5 text-[0.8125rem] font-semibold text-ink-900 dark:text-night-100">
              次回更新: {periodStr}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void openPortal()}
          disabled={loading}
          className={[
            'tap-shrink w-full rounded-2xl py-3 text-[0.8125rem] font-semibold',
            'bg-white text-amber-800 border border-amber-200 dark:bg-night-800 dark:text-amber-200 dark:border-amber-500/30',
            loading ? 'opacity-60 cursor-wait' : '',
          ].join(' ')}
        >
          {loading ? 'Stripe へ移動中…' : '購読を管理 (Stripe)'}
        </button>
        {error && (
          <div className="mt-2 text-[0.6875rem] text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className={[
        'rounded-3xl p-5 shadow-ios border overflow-hidden relative',
        'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50',
        'dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/30 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-amber-300/40 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Crown
            size={16}
            className="text-orange-500 dark:text-amber-300"
            strokeWidth={2.4}
          />
          <h2 className="text-[0.9375rem] font-bold text-ink-900 dark:text-night-100">
            worthit Pro
          </h2>
        </div>
        <p className="mt-1 text-[0.75rem] text-ink-600 dark:text-night-300 leading-relaxed">
          CSVインポート・年間チャート・カテゴリ別予算・PDFレポート。
          すべて月額 <strong>¥480</strong> でアンロック。
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="tap-shrink mt-4 w-full rounded-2xl py-3 flex items-center justify-center gap-1.5 font-bold text-[0.875rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-ios"
        >
          <Crown size={14} strokeWidth={2.6} />
          詳しく見る
        </button>
      </div>
    </section>
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
  const { t, f } = useTranslation();
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
      <div
        className={[
          'flex items-center gap-1 rounded-2xl px-3.5 min-w-0',
          'bg-white border border-ink-100 shadow-ios',
          'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <Target size={14} className="text-ink-400 dark:text-night-400 shrink-0" />
        <span className="text-[1.0625rem] font-bold text-ink-900 dark:text-night-100 shrink-0">
          ¥
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/^0+(?=\d)/, ''))}
          onBlur={(e) => apply(e.target.value)}
          placeholder="0"
          className="flex-1 min-w-0 bg-transparent text-[1.0625rem] font-bold leading-none text-ink-900 dark:text-night-100 placeholder:text-ink-300 dark:placeholder:text-night-500 focus:outline-none py-3"
          aria-label={t.settings_budgetTitle}
        />
      </div>
      <button
        type="button"
        onClick={() => apply(draft)}
        className={[
          'tap-shrink mt-2 w-full rounded-2xl py-2.5 font-semibold text-[0.8125rem] transition flex items-center justify-center gap-1.5',
          justSaved
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios',
        ].join(' ')}
      >
        {justSaved ? (
          <>
            <Check size={14} strokeWidth={3} />
            {t.settings_budgetSaved}
          </>
        ) : (
          t.save
        )}
      </button>
      {budget !== null && (
        <div className="mt-2 text-[0.6875rem] text-ink-500 dark:text-night-300 tabular-nums">
          {f(t.settings_budgetCurrent, { amount: formatYen(budget) })}
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
            {t.settings_budgetResetPreset}
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
  const { t } = useTranslation();
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
            {name ?? t.account_signed_in}
          </div>
          <div className="text-[0.6875rem] text-emerald-700/80 dark:text-emerald-300/80 truncate flex items-center gap-1">
            <Cloud size={11} />
            {email ?? t.account_signed_in}
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
            {t.account_local}
          </div>
          <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
            {t.account_local_body}
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
            {t.account_cloud_disabled}
          </div>
          <div className="text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
            {t.account_cloud_disabled_body}
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
          {t.account_unauthed}
        </div>
        <div className="text-[0.6875rem] text-ink-500 dark:text-night-300">
          {t.account_unauthed_body}
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
