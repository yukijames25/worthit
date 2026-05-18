import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  getCategoryMeta,
} from '../utils/categories';
import { formatYen, fromDateKey, toDateKey } from '../utils/format';
import type { CategoryMeta, TxType } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** すでに記録済みのカテゴリ名（自由入力でユーザーが作ったもの含む）。 */
  existingCategories: string[];
  onSubmit: (input: {
    type: TxType;
    amount: number;
    category: string;
    memo: string;
    date: number;
  }) => void;
}

export function InputSheet({
  open,
  onClose,
  existingCategories,
  onSubmit,
}: Props) {
  const [type, setType] = useState<TxType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<string>('');
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [memo, setMemo] = useState('');
  const [dateKey, setDateKey] = useState<string>(() => toDateKey(Date.now()));
  const amountRef = useRef<HTMLInputElement>(null);

  // 表示用のサジェスト一覧
  const presets: CategoryMeta[] = useMemo(() => {
    const base =
      type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_CATEGORIES;
    const customLabels = existingCategories.filter(
      (l) => !base.some((b) => b.label === l),
    );
    const customs = customLabels.map((label) => getCategoryMeta(label));
    return [...base, ...customs];
  }, [type, existingCategories]);

  // 開く度にリセット
  useEffect(() => {
    if (open) {
      setType('expense');
      setAmountInput('');
      setCategory('');
      setCustomMode(false);
      setCustomInput('');
      setMemo('');
      setDateKey(toDateKey(Date.now()));
      window.setTimeout(() => amountRef.current?.focus(), 220);
    }
  }, [open]);

  // Escで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const amount = Number(amountInput);
  const resolvedCategory = customMode ? customInput.trim() : category;
  const canSave = amount > 0 && resolvedCategory.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSubmit({
      type,
      amount,
      category: resolvedCategory,
      memo,
      date: fromDateKey(dateKey),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="記録を追加"
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold">記録を追加</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="tap-shrink size-9 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-5">
          {/* 種別 */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-100 dark:bg-night-800 p-1">
            {(['expense', 'income'] as const).map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategory('');
                    setCustomMode(false);
                  }}
                  className={[
                    'tap-shrink rounded-xl py-2 text-[0.8125rem] font-semibold transition',
                    active
                      ? t === 'expense'
                        ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-ios'
                      : 'text-ink-500 dark:text-night-300',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {t === 'expense' ? '💸 支出' : '💰 収入'}
                </button>
              );
            })}
          </div>

          {/* 金額 */}
          <section
            className={[
              'rounded-3xl p-5 shadow-ios border',
              'bg-gradient-to-br from-white to-brand-50 border-white',
              'dark:from-night-800 dark:to-night-700 dark:border-night-700 dark:shadow-ios-dark',
            ].join(' ')}
          >
            <div className="text-[0.6875rem] tracking-wider uppercase font-semibold text-ink-500 dark:text-night-300">
              金額
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[2.25rem] font-bold leading-none">¥</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(e.target.value.replace(/^0+(?=\d)/, ''))
                }
                placeholder="0"
                className="w-full bg-transparent text-[2.25rem] font-bold leading-none placeholder:text-ink-300 dark:placeholder:text-night-500 focus:outline-none"
                aria-label="金額"
              />
            </div>
            {amount > 0 && (
              <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300">
                {formatYen(amount)}
              </p>
            )}
          </section>

          {/* 日付 */}
          <section>
            <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
              日付
            </label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className={[
                'w-full rounded-2xl px-4 py-3 text-[0.9375rem] font-medium',
                'bg-white border border-white shadow-ios text-ink-900',
                'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
                'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
                '[color-scheme:light] dark:[color-scheme:dark]',
              ].join(' ')}
            />
          </section>

          {/* カテゴリ */}
          <section>
            <div className="flex items-center justify-between px-1">
              <label className="text-[0.8125rem] font-bold">カテゴリ</label>
              <button
                type="button"
                onClick={() => {
                  setCustomMode((v) => !v);
                  setCategory('');
                }}
                className="text-[0.6875rem] text-brand-500 dark:text-brand-300 font-semibold"
              >
                {customMode ? 'プリセットに戻る' : '+ 新しいカテゴリ'}
              </button>
            </div>
            {customMode ? (
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="例：サブスク、旅行、コーヒー…"
                maxLength={20}
                className={[
                  'mt-2 w-full rounded-2xl px-4 py-3 text-[0.9375rem]',
                  'bg-white border border-white shadow-ios text-ink-900',
                  'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
                  'placeholder:text-ink-400 dark:placeholder:text-night-400',
                  'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
                ].join(' ')}
              />
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {presets.map((c) => {
                  const active = category === c.label;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setCategory(c.label)}
                      className={[
                        'tap-shrink relative text-left rounded-2xl px-3 py-2.5 border transition-all duration-200',
                        active
                          ? 'bg-white dark:bg-night-700 border-transparent shadow-ios-lg ring-2'
                          : 'bg-white/70 border-white shadow-ios hover:bg-white dark:bg-night-800/80 dark:border-night-700 dark:hover:bg-night-800',
                      ].join(' ')}
                      style={
                        active
                          ? ({ '--tw-ring-color': c.color } as React.CSSProperties)
                          : undefined
                      }
                      aria-pressed={active}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={[
                            'size-9 rounded-xl flex items-center justify-center text-base shrink-0',
                            'bg-gradient-to-br',
                            c.gradient,
                          ].join(' ')}
                        >
                          {c.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[0.8125rem] font-semibold leading-tight truncate text-ink-900 dark:text-night-100">
                            {c.label}
                          </div>
                          {c.hint && (
                            <div className="text-[0.625rem] text-ink-400 dark:text-night-400 leading-tight truncate">
                              {c.hint}
                            </div>
                          )}
                        </div>
                      </div>
                      {active && (
                        <div
                          className="absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center text-white"
                          style={{ background: c.color }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* メモ */}
          <section>
            <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
              メモ <span className="text-ink-400 font-normal">（任意）</span>
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={
                type === 'income'
                  ? '例：5月分の給料'
                  : '例：お気に入りのカフェでランチ'
              }
              maxLength={40}
              className={[
                'w-full rounded-2xl px-4 py-3 text-[0.9375rem]',
                'bg-white border border-white shadow-ios text-ink-900',
                'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
                'placeholder:text-ink-400 dark:placeholder:text-night-400',
                'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
              ].join(' ')}
            />
          </section>

          {/* 保存 */}
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className={[
              'tap-shrink w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold text-[0.9375rem] transition-all',
              canSave
                ? type === 'income'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-ios-lg'
                  : 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios-lg'
                : 'bg-ink-200 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500',
            ].join(' ')}
          >
            <Sparkles size={16} strokeWidth={2.4} />
            記録する
          </button>
        </div>
      </div>
    </div>
  );
}
