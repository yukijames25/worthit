import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Lock,
  Pencil,
  Plus,
  Power,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import type { TxType } from '../types';
import type { RecurringInput, RecurringRule } from '../hooks/useRecurring';
import { useCategories } from '../context/CategoriesContext';
import { formatYen } from '../utils/format';

const FREE_RECURRING_LIMIT = 2;

interface Props {
  open: boolean;
  onClose: () => void;
  rules: RecurringRule[];
  onAdd: (input: RecurringInput) => void;
  onUpdate: (id: string, patch: Partial<RecurringInput>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
}

interface Draft {
  id: string | null;
  type: TxType;
  amount: string;
  category: string;
  memo: string;
  dayOfMonth: number;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  type: 'expense',
  amount: '',
  category: '',
  memo: '',
  dayOfMonth: 1,
};

export function RecurringManager({
  open,
  onClose,
  rules,
  onAdd,
  onUpdate,
  onRemove,
  onToggle,
  isPro,
  onUpgrade,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const { expensePresets, incomePresets } = useCategories();

  useEffect(() => {
    if (!open) setDraft(null);
  }, [open]);

  const presets = draft?.type === 'income' ? incomePresets : expensePresets;

  const canSave =
    !!draft &&
    Number(draft.amount) > 0 &&
    !!draft.category.trim() &&
    draft.dayOfMonth >= 1 &&
    draft.dayOfMonth <= 31;

  if (!open) return null;

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
        aria-label="定期取引の管理"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 pt-2 pb-3 px-5 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold">
              {draft
                ? draft.id
                  ? '定期取引を編集'
                  : '定期取引を追加'
                : '定期取引'}
            </h2>
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

        <div className="px-5 pb-6">
          {draft ? (
            <Editor
              draft={draft}
              setDraft={setDraft}
              presets={presets.map((p) => p.label)}
              onCancel={() => setDraft(null)}
              canSave={canSave}
              onSave={() => {
                if (!canSave || !draft) return;
                const payload: RecurringInput = {
                  type: draft.type,
                  amount: Number(draft.amount),
                  category: draft.category.trim(),
                  memo: draft.memo.trim(),
                  dayOfMonth: draft.dayOfMonth,
                };
                if (draft.id) {
                  onUpdate(draft.id, payload);
                } else {
                  onAdd(payload);
                }
                setDraft(null);
              }}
            />
          ) : (
            <>
              {!isPro && rules.length >= FREE_RECURRING_LIMIT ? (
                <button
                  type="button"
                  onClick={() => onUpgrade('定期取引の登録（3件以上）')}
                  className="tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-1.5 mb-3 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-semibold border-2 border-dashed border-amber-300 dark:border-amber-400/60"
                >
                  <Lock size={15} />
                  無料は{FREE_RECURRING_LIMIT}件まで。さらに追加するには
                  <span className="text-[0.625rem] font-bold tracking-wide rounded-full px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    PRO
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDraft({ ...EMPTY_DRAFT })}
                  className="tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-1.5 bg-gradient-to-br from-brand-500 to-brand-400 text-white font-semibold shadow-ios mb-3"
                >
                  <Plus size={16} strokeWidth={2.6} />
                  定期取引を追加
                  {!isPro && (
                    <span className="text-[0.625rem] font-normal text-white/80 tabular-nums">
                      ({rules.length}/{FREE_RECURRING_LIMIT})
                    </span>
                  )}
                </button>
              )}
              {rules.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="space-y-1.5">
                  {rules.map((r) => (
                    <Row
                      key={r.id}
                      rule={r}
                      onEdit={() =>
                        setDraft({
                          id: r.id,
                          type: r.type,
                          amount: String(r.amount),
                          category: r.category,
                          memo: r.memo,
                          dayOfMonth: r.dayOfMonth,
                        })
                      }
                      onRemove={() => onRemove(r.id)}
                      onToggle={() => onToggle(r.id)}
                    />
                  ))}
                </ul>
              )}
              <p className="mt-4 text-[0.6875rem] text-ink-400 dark:text-night-400 leading-relaxed">
                毎月の家賃やサブスクをここに登録しておくと、指定日が来た時に自動で記録されます。アプリを開いた時にチェックして反映するので、起動が無い月は自動挿入されません（最大3か月分まで遡って補完）。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  rule,
  onEdit,
  onRemove,
  onToggle,
}: {
  rule: RecurringRule;
  onEdit: () => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const { getMeta } = useCategories();
  const meta = getMeta(rule.category);
  const next = new Date(rule.nextDue);

  return (
    <li
      className={[
        'flex items-center gap-3 rounded-2xl p-3',
        rule.active
          ? 'bg-ink-50 dark:bg-night-700/50'
          : 'bg-ink-50/50 dark:bg-night-700/30 opacity-60',
      ].join(' ')}
    >
      <div
        className={[
          'size-10 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br',
          meta.gradient,
        ].join(' ')}
        style={{ background: meta.color }}
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-[0.875rem] font-semibold truncate">
            {rule.memo || rule.category}
          </div>
          {rule.type === 'income' && (
            <span className="text-[0.625rem] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 rounded-full px-1.5 py-0.5 shrink-0">
              収入
            </span>
          )}
        </div>
        <div className="text-[0.6875rem] text-ink-500 dark:text-night-300 flex items-center gap-1 tabular-nums">
          <Calendar size={10} />
          毎月{rule.dayOfMonth}日 ·{' '}
          {rule.type === 'income' ? '+' : '−'}
          {formatYen(rule.amount)}
        </div>
        <div className="text-[0.625rem] text-ink-400 dark:text-night-400 tabular-nums">
          次回: {next.getMonth() + 1}/{next.getDate()}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={rule.active ? '停止' : '再開'}
        className={[
          'tap-shrink size-9 rounded-xl flex items-center justify-center',
          rule.active
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-white dark:bg-night-800 text-ink-400 dark:text-night-400',
        ].join(' ')}
      >
        <Power size={14} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="編集"
        className="tap-shrink size-9 rounded-xl bg-white dark:bg-night-800 flex items-center justify-center text-ink-600 dark:text-night-200"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="削除"
        className="tap-shrink size-9 rounded-xl bg-white dark:bg-night-800 flex items-center justify-center text-rose-500 dark:text-rose-300"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-ink-50 dark:bg-night-700/50 p-5 text-center">
      <div className="mx-auto size-12 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white shadow-ios">
        <Repeat size={22} strokeWidth={2.2} />
      </div>
      <p className="mt-3 text-[0.8125rem] font-semibold">
        定期取引が登録されていません
      </p>
      <p className="mt-1 text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
        家賃・サブスクなど、毎月発生する取引を登録すると
        自動で明細に追加されるようになります。
      </p>
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  presets,
  canSave,
  onCancel,
  onSave,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  presets: string[];
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const uniquePresets = useMemo(() => Array.from(new Set(presets)), [presets]);

  return (
    <div className="space-y-4">
      {/* 種別 */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-100 dark:bg-night-800 p-1">
        {(['expense', 'income'] as const).map((t) => {
          const active = draft.type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setDraft({ ...draft, type: t, category: '' })}
              aria-pressed={active}
              className={[
                'tap-shrink rounded-xl py-2 text-[0.8125rem] font-semibold transition',
                active
                  ? t === 'expense'
                    ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-ios'
                  : 'text-ink-500 dark:text-night-300',
              ].join(' ')}
            >
              {t === 'expense' ? '💸 支出' : '💰 収入'}
            </button>
          );
        })}
      </div>

      {/* 金額 */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          金額
        </label>
        <div
          className={[
            'flex items-center gap-1 rounded-2xl px-3.5 py-3',
            'bg-white border border-ink-100 shadow-ios',
            'dark:bg-night-800 dark:border-night-700 dark:shadow-ios-dark',
          ].join(' ')}
        >
          <span className="text-[1.0625rem] font-bold">¥</span>
          <input
            type="number"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) =>
              setDraft({
                ...draft,
                amount: e.target.value.replace(/^0+(?=\d)/, ''),
              })
            }
            placeholder="0"
            className="flex-1 bg-transparent text-[1.0625rem] font-bold leading-none placeholder:text-ink-300 dark:placeholder:text-night-500 focus:outline-none"
            aria-label="金額"
          />
        </div>
      </section>

      {/* カテゴリ */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          カテゴリ
        </label>
        <input
          type="text"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          placeholder="例：家賃、Netflix"
          maxLength={20}
          list="recurring-presets"
          className={[
            'w-full rounded-2xl px-4 py-3 text-[0.9375rem]',
            'bg-white border border-ink-100 shadow-ios text-ink-900',
            'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
            'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
          ].join(' ')}
        />
        <datalist id="recurring-presets">
          {uniquePresets.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </section>

      {/* メモ */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          メモ <span className="text-ink-400 font-normal">（任意）</span>
        </label>
        <input
          type="text"
          value={draft.memo}
          onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
          placeholder="例：5月分の家賃"
          maxLength={40}
          className={[
            'w-full rounded-2xl px-4 py-3 text-[0.9375rem]',
            'bg-white border border-ink-100 shadow-ios text-ink-900',
            'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
            'placeholder:text-ink-400 dark:placeholder:text-night-400',
            'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
          ].join(' ')}
        />
      </section>

      {/* 日付 */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          毎月の発生日 <span className="text-ink-400 font-normal">（1〜31）</span>
        </label>
        <input
          type="number"
          min={1}
          max={31}
          value={draft.dayOfMonth}
          onChange={(e) =>
            setDraft({
              ...draft,
              dayOfMonth: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
            })
          }
          className={[
            'w-full rounded-2xl px-4 py-3 text-[0.9375rem] font-bold tabular-nums',
            'bg-white border border-ink-100 shadow-ios text-ink-900',
            'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
            'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
          ].join(' ')}
        />
        <p className="mt-1.5 text-[0.625rem] text-ink-400 dark:text-night-400">
          月末に存在しない日（例：2月30日）はその月の最終日に丸めて記録します。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="tap-shrink rounded-2xl py-3 text-[0.8125rem] font-semibold bg-ink-100 text-ink-700 dark:bg-night-700 dark:text-night-200"
        >
          キャンセル
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className={[
            'tap-shrink rounded-2xl py-3 text-[0.8125rem] font-semibold transition',
            canSave
              ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
              : 'bg-ink-200 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500',
          ].join(' ')}
        >
          保存
        </button>
      </div>
    </div>
  );
}
