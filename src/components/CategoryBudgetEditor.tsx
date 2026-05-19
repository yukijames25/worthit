import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { CategoryMeta } from '../types';
import { formatYen } from '../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryMeta[];
  perCategory: Record<string, number>;
  onSet: (label: string, amount: number | null) => void;
}

export function CategoryBudgetEditor({
  open,
  onClose,
  categories,
  perCategory,
  onSet,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleApply = (label: string) => {
    const text = drafts[label];
    if (text === undefined) return;
    if (text === '') {
      onSet(label, null);
    } else {
      const n = Number(text);
      if (Number.isFinite(n) && n > 0) {
        onSet(label, n);
      } else if (text === '0') {
        onSet(label, null);
      }
    }
    setDrafts((p) => {
      const next = { ...p };
      delete next[label];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="カテゴリ別予算"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold">カテゴリ別予算</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="tap-shrink size-9 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[0.6875rem] text-ink-500 dark:text-night-300 mt-1">
            カテゴリごとに月予算を設定できます。空欄にすると予算なしに戻ります。
          </p>
        </div>

        <ul className="px-5 pb-6 space-y-1.5">
          {categories.map((c) => {
            const current = perCategory[c.label] ?? null;
            const draft = drafts[c.label];
            const value = draft !== undefined ? draft : current !== null ? String(current) : '';

            return (
              <li
                key={c.label}
                className="flex items-center gap-2.5 rounded-2xl p-3 bg-ink-50 dark:bg-night-700/50"
              >
                <div
                  className="size-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: c.color }}
                  aria-hidden
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.875rem] font-semibold truncate">
                    {c.label}
                  </div>
                  {current !== null && (
                    <div className="text-[0.625rem] text-ink-500 dark:text-night-400 tabular-nums">
                      現在: {formatYen(current)} / 月
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-night-800 rounded-xl border border-ink-100 dark:border-night-700 px-2.5 py-1.5">
                  <span className="text-[0.8125rem] font-bold shrink-0">¥</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) =>
                      setDrafts((p) => ({
                        ...p,
                        [c.label]: e.target.value.replace(/^0+(?=\d)/, ''),
                      }))
                    }
                    onBlur={() => handleApply(c.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="0"
                    className="w-20 bg-transparent text-[0.875rem] font-bold leading-none text-right text-ink-900 dark:text-night-100 placeholder:text-ink-300 dark:placeholder:text-night-500 focus:outline-none"
                  />
                </div>
                {current !== null && (
                  <button
                    type="button"
                    onClick={() => onSet(c.label, null)}
                    aria-label="削除"
                    className="tap-shrink size-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-300 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            );
          })}
          {categories.length === 0 && (
            <li className="text-center text-[0.8125rem] text-ink-400 dark:text-night-400 py-8">
              カテゴリがまだありません。
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
