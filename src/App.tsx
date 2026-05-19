import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { StatementScreen } from './components/StatementScreen';
import { InputSheet } from './components/InputSheet';
import { LoginScreen } from './components/LoginScreen';
import { MigrationPrompt } from './components/MigrationPrompt';
import { UpdateBanner } from './components/UpdateBanner';
import { CategoryManager } from './components/CategoryManager';
import { RecurringManager } from './components/RecurringManager';
import { CategoryBudgetEditor } from './components/CategoryBudgetEditor';
import { PdfReportTemplate } from './components/PdfReportTemplate';
import { UpgradeSheet } from './components/pro/UpgradeSheet';
import { generatePdfFromNode } from './utils/pdfReport';
import { toDateKey } from './utils/format';
import { useTransactions } from './hooks/useTransactions';
import { useAuth } from './context/AuthContext';
import { useCategories } from './context/CategoriesContext';
import { useBudget } from './hooks/useBudget';
import { useUpdateChecker } from './hooks/useUpdateChecker';
import { useRecurring } from './hooks/useRecurring';
import { useSubscription } from './hooks/useSubscription';
import { diagnose } from './utils/scoring';
import { useTranslation } from './i18n/useTranslation';
import type { ScreenId } from './types';

// recharts / heavy result tree は遅延ロード
const AdviceScreen = lazy(() =>
  import('./components/AdviceScreen').then((m) => ({ default: m.AdviceScreen })),
);
const ResultScreen = lazy(() =>
  import('./components/ResultScreen').then((m) => ({ default: m.ResultScreen })),
);
const SettingsScreen = lazy(() =>
  import('./components/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  })),
);

function useScreenMeta() {
  const { t } = useTranslation();
  return useMemo<Record<ScreenId, { title: string; subtitle: string }>>(
    () => ({
      statement: {
        title: t.screen_statement_title,
        subtitle: t.screen_statement_subtitle,
      },
      advice: {
        title: t.screen_advice_title,
        subtitle: t.screen_advice_subtitle,
      },
      result: {
        title: t.screen_result_title,
        subtitle: t.screen_result_subtitle,
      },
      settings: {
        title: t.screen_settings_title,
        subtitle: t.screen_settings_subtitle,
      },
    }),
    [t],
  );
}

export default function App() {
  const { mode, loading } = useAuth();
  const { hasUpdate, apply } = useUpdateChecker();

  let body: React.ReactNode;
  if (loading) {
    body = <BootSplash />;
  } else if (mode === 'unauthenticated') {
    body = <LoginScreen />;
  } else {
    body = <Shell />;
  }

  return (
    <>
      {body}
      <UpdateBanner show={hasUpdate} onApply={apply} />
    </>
  );
}

function Shell() {
  const { t } = useTranslation();
  const screenMeta = useScreenMeta();
  const [screen, setScreen] = useState<ScreenId>('statement');
  const [inputOpen, setInputOpen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState<{ open: boolean; feature?: string }>(
    { open: false },
  );
  const [categoryBudgetOpen, setCategoryBudgetOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const subscription = useSubscription();
  const { user } = useAuth();
  const {
    transactions,
    totals,
    add,
    remove,
    cycleSatisfaction,
    reset,
    seed,
    migrationCandidate,
    acceptMigration,
    dismissMigration,
    loading: txLoading,
  } = useTransactions();
  const { budget, setBudget, perCategory, setCategoryBudget } = useBudget();
  const { customsMap, expensePresets } = useCategories();
  const recurring = useRecurring();

  // 起動時に定期取引の期限切れを自動補完
  useEffect(() => {
    if (txLoading || recurring.loading) return;
    if (migrationCandidate !== null) return; // 移行プロンプト表示中は走らせない
    void recurring.applyDue(add);
  }, [txLoading, recurring.loading, migrationCandidate, recurring, add]);

  const result = useMemo(
    () => diagnose(transactions, customsMap),
    [transactions, customsMap],
  );
  const hasResult = result !== null;

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(t.category);
    return Array.from(set);
  }, [transactions]);

  const handleReset = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(t.confirm_deleteAll)
    ) {
      reset();
      setScreen('statement');
    }
  };

  return (
    <div
      className={[
        'min-h-[100svh] text-ink-900 dark:text-night-100',
        'bg-app-gradient dark:bg-app-gradient-dark',
        'transition-colors duration-300',
      ].join(' ')}
    >
      <div className="mx-auto max-w-md min-h-[100svh] flex flex-col">
        <Header
          title={screenMeta[screen].title}
          subtitle={screenMeta[screen].subtitle}
          rightSlot={<BrandBadge />}
        />

        <main className="flex-1 overflow-y-auto app-scroll">
          {screen === 'statement' && (
            <StatementScreen
              key="statement"
              transactions={transactions}
              income={totals.income}
              expense={totals.expense}
              net={totals.net}
              budget={budget}
              onCycleSatisfaction={cycleSatisfaction}
              onRemove={remove}
              onAdd={() => setInputOpen(true)}
              onSeed={seed}
              onOpenSettings={() => setScreen('settings')}
            />
          )}
          {screen === 'advice' && (
            <Suspense fallback={<ScreenFallback />}>
              <AdviceScreen
                key="advice"
                transactions={transactions}
                expense={totals.expense}
                income={totals.income}
                result={result}
                onOpenResult={() => setScreen('result')}
                isPro={subscription.isPro}
                onUpgrade={(feature) => setUpgradeOpen({ open: true, feature })}
              />
            </Suspense>
          )}
          {screen === 'result' && (
            <Suspense fallback={<ScreenFallback />}>
              <ResultScreen
                key="result"
                result={result}
                totalSpent={totals.expense}
                onBackToStatement={() => setScreen('statement')}
                onReset={handleReset}
              />
            </Suspense>
          )}
          {screen === 'settings' && (
            <Suspense fallback={<ScreenFallback />}>
              <SettingsScreen
                key="settings"
                transactionCount={transactions.length}
                transactions={transactions}
                budget={budget}
                onSetBudget={setBudget}
                onReset={handleReset}
                onOpenCategoryEditor={() => setCategoryEditorOpen(true)}
                onOpenRecurring={() => setRecurringOpen(true)}
                recurringCount={recurring.rules.length}
                onImportCsv={(rows) => {
                  for (const r of rows) add(r);
                }}
                isPro={subscription.isPro}
                planStatus={subscription.status}
                currentPeriodEnd={subscription.currentPeriodEnd}
                onUpgrade={(feature) =>
                  setUpgradeOpen({ open: true, feature })
                }
                perCategoryBudgetCount={Object.keys(perCategory).length}
                onOpenCategoryBudgets={() => {
                  if (subscription.isPro) {
                    setCategoryBudgetOpen(true);
                  } else {
                    setUpgradeOpen({
                      open: true,
                      feature: 'カテゴリ別予算',
                    });
                  }
                }}
                pdfGenerating={pdfGenerating}
                onGeneratePdf={async () => {
                  if (!subscription.isPro) {
                    setUpgradeOpen({ open: true, feature: 'PDFレポート' });
                    return;
                  }
                  if (!pdfTemplateRef.current) return;
                  setPdfGenerating(true);
                  try {
                    await generatePdfFromNode({
                      node: pdfTemplateRef.current,
                      filename: `worthit-report-${toDateKey(Date.now())}.pdf`,
                    });
                  } catch (e) {
                    window.alert(
                      'PDF 生成に失敗しました: ' +
                        (e instanceof Error ? e.message : String(e)),
                    );
                  } finally {
                    setPdfGenerating(false);
                  }
                }}
              />
            </Suspense>
          )}
        </main>

        <BottomNav
          active={screen}
          onChange={setScreen}
          hasResult={hasResult}
        />
      </div>

      <InputSheet
        open={inputOpen}
        onClose={() => setInputOpen(false)}
        existingCategories={existingCategories}
        onSubmit={(input) => add(input)}
      />

      <MigrationPrompt
        open={migrationCandidate !== null}
        candidate={migrationCandidate ?? []}
        onAccept={() => void acceptMigration()}
        onDismiss={dismissMigration}
      />

      <CategoryManager
        open={categoryEditorOpen}
        onClose={() => setCategoryEditorOpen(false)}
      />

      <RecurringManager
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        rules={recurring.rules}
        onAdd={recurring.add}
        onUpdate={recurring.update}
        onRemove={recurring.remove}
        onToggle={recurring.toggleActive}
      />

      <UpgradeSheet
        open={upgradeOpen.open}
        feature={upgradeOpen.feature}
        onClose={() => setUpgradeOpen({ open: false })}
      />

      <CategoryBudgetEditor
        open={categoryBudgetOpen}
        onClose={() => setCategoryBudgetOpen(false)}
        categories={expensePresets}
        perCategory={perCategory}
        onSet={setCategoryBudget}
      />

      {/* PDF用の非表示テンプレート (html2canvas で画像化される) */}
      <div
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <PdfReportTemplate
          ref={pdfTemplateRef}
          monthRef={Date.now()}
          transactions={transactions}
          result={result}
          userName={
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.name as string | undefined) ??
            user?.email ??
            null
          }
        />
      </div>
    </div>
  );
}

function ScreenFallback() {
  const { t } = useTranslation();
  return (
    <div className="px-5 pt-12 animate-fade-in">
      <div className="mx-auto size-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xl shadow-ios animate-pulse">
        🪙
      </div>
      <p className="mt-3 text-center text-[0.75rem] text-ink-500 dark:text-night-300">
        {t.loading}
      </p>
    </div>
  );
}

function BootSplash() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-app-gradient dark:bg-app-gradient-dark">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-3xl shadow-ios-lg animate-float">
          🪙
        </div>
        <div className="text-[0.75rem] text-ink-500 dark:text-night-300">
          {t.booting}
        </div>
      </div>
    </div>
  );
}

function BrandBadge() {
  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border shadow-ios',
        'bg-white/70 backdrop-blur-md border-white',
        'dark:bg-night-800/70 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
      <span className="text-[0.625rem] font-bold tracking-[0.18em] uppercase text-ink-700 dark:text-night-200">
        worthit
      </span>
    </div>
  );
}
