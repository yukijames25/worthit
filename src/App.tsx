import { useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { StatementScreen } from './components/StatementScreen';
import { AdviceScreen } from './components/AdviceScreen';
import { ResultScreen } from './components/ResultScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { InputSheet } from './components/InputSheet';
import { useTransactions } from './hooks/useTransactions';
import { diagnose } from './utils/scoring';
import type { ScreenId } from './types';

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
    subtitle: 'テーマと文字サイズ',
  },
};

export default function App() {
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
  } = useTransactions();

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
              onCycleSatisfaction={cycleSatisfaction}
              onRemove={remove}
              onAdd={() => setInputOpen(true)}
              onSeed={seed}
            />
          )}
          {screen === 'advice' && (
            <AdviceScreen
              key="advice"
              transactions={transactions}
              expense={totals.expense}
              income={totals.income}
              result={result}
              onOpenResult={() => setScreen('result')}
            />
          )}
          {screen === 'result' && (
            <ResultScreen
              key="result"
              result={result}
              totalSpent={totals.expense}
              onBackToStatement={() => setScreen('statement')}
              onReset={handleReset}
            />
          )}
          {screen === 'settings' && (
            <SettingsScreen
              key="settings"
              transactionCount={transactions.length}
              onReset={handleReset}
            />
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
        SpendType
      </span>
    </div>
  );
}
