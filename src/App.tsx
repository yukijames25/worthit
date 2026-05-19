import { lazy, Suspense, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { StatementScreen } from './components/StatementScreen';
import { InputSheet } from './components/InputSheet';
import { LoginScreen } from './components/LoginScreen';
import { MigrationPrompt } from './components/MigrationPrompt';
import { UpdateBanner } from './components/UpdateBanner';
import { useTransactions } from './hooks/useTransactions';
import { useAuth } from './context/AuthContext';
import { useBudget } from './hooks/useBudget';
import { useUpdateChecker } from './hooks/useUpdateChecker';
import { diagnose } from './utils/scoring';
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

const SCREEN_META: Record<ScreenId, { title: string; subtitle: string }> = {
  statement: {
    title: '明細',
    subtitle: '記録を時系列で振り返る',
  },
  advice: {
    title: 'アドバイス',
    subtitle: '満足度から次の一手を提案',
  },
  result: {
    title: 'パーソナリティ',
    subtitle: 'お金が語る、あなたの輪郭',
  },
  settings: {
    title: '設定',
    subtitle: 'アカウントと表示',
  },
};

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
  const [screen, setScreen] = useState<ScreenId>('statement');
  const [inputOpen, setInputOpen] = useState(false);
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
  } = useTransactions();
  const { budget, setBudget } = useBudget();

  const result = useMemo(() => diagnose(transactions), [transactions]);
  const hasResult = result !== null;

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(t.category);
    return Array.from(set);
  }, [transactions]);

  const handleReset = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('記録をすべて削除します。よろしいですか？')
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
          title={SCREEN_META[screen].title}
          subtitle={SCREEN_META[screen].subtitle}
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
    </div>
  );
}

function ScreenFallback() {
  return (
    <div className="px-5 pt-12 animate-fade-in">
      <div className="mx-auto size-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xl shadow-ios animate-pulse">
        🪙
      </div>
      <p className="mt-3 text-center text-[0.75rem] text-ink-500 dark:text-night-300">
        読み込み中…
      </p>
    </div>
  );
}

function BootSplash() {
  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-app-gradient dark:bg-app-gradient-dark">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-3xl shadow-ios-lg animate-float">
          🪙
        </div>
        <div className="text-[0.75rem] text-ink-500 dark:text-night-300">
          worthit を起動中…
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
