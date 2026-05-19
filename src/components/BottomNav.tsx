import { ChartPie, ListChecks, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import type { ScreenId } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  active: ScreenId;
  onChange: (next: ScreenId) => void;
  hasResult: boolean;
}

export function BottomNav({ active, onChange, hasResult }: Props) {
  const { t } = useTranslation();
  const TABS: Array<{ id: ScreenId; label: string; Icon: typeof ListChecks }> = [
    { id: 'statement', label: t.nav_statement, Icon: ListChecks },
    { id: 'advice', label: t.nav_advice, Icon: ChartPie },
    { id: 'result', label: t.nav_result, Icon: Sparkles },
    { id: 'settings', label: t.nav_settings, Icon: SettingsIcon },
  ];
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 px-3 pb-3 safe-bottom pointer-events-none"
      aria-label={t.nav_settings}
    >
      <div className="mx-auto max-w-md pointer-events-auto">
        <div
          className={[
            'relative rounded-3xl px-2 py-1.5 flex',
            'bg-white/85 backdrop-blur-2xl border border-white/70 shadow-nav',
            'dark:bg-night-800/85 dark:border-night-700/70 dark:shadow-ios-dark',
          ].join(' ')}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            const disabled = tab.id === 'result' && !hasResult;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !disabled && onChange(tab.id)}
                disabled={disabled}
                className={[
                  'tap-shrink flex-1 flex flex-col items-center justify-center gap-0.5',
                  'rounded-2xl py-2.5 transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'text-ink-500 dark:text-night-300',
                  disabled ? 'opacity-30' : '',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
              >
                <tab.Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  className="transition-transform duration-300"
                />
                <span
                  className={[
                    'text-[0.625rem] font-semibold tracking-wide leading-none',
                    isActive ? 'text-white' : 'text-ink-500 dark:text-night-300',
                  ].join(' ')}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
