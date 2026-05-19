import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { CategoryKind, CategoryMeta } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../utils/categories';
import { useCategories } from '../context/CategoriesContext';

const FREE_CUSTOM_CATEGORY_LIMIT = 3;

interface Props {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgrade: (feature?: string) => void;
}

const EMOJI_PALETTE = [
  '🍽️', '☕', '🍱', '🍣', '🍺', '🥂',
  '🧺', '🛒', '🧴', '🧻', '🧼',
  '📚', '✏️', '🧠', '💼',
  '🎮', '🎵', '🎨', '🎬', '⚽', '🎤',
  '💸', '💰', '🎁', '💎',
  '🏠', '🛏️', '🔌', '💡',
  '🚃', '🚗', '🛵', '✈️',
  '💆', '💄', '🏋️', '🩺',
  '🐶', '🐱', '🌱',
  '🏷️', '✨', '🎯', '🌈',
];

const COLOR_PALETTE = [
  '#FF6B9D', '#FF7676', '#FFB454', '#FBBF24',
  '#34D399', '#4FC3A1', '#22D3EE', '#60A5FA',
  '#5B8DEF', '#A66BFF', '#F472B6', '#94A3B8',
];

const KIND_OPTIONS: Array<{ id: CategoryKind; label: string }> = [
  { id: 'dining', label: '外食' },
  { id: 'social', label: '交際' },
  { id: 'daily', label: '日用品' },
  { id: 'self_investment', label: '自己投資' },
  { id: 'hobby', label: '趣味' },
  { id: 'impulse', label: '浪費' },
  { id: 'utility', label: '固定費' },
  { id: 'income', label: '収入' },
  { id: 'other', label: 'その他' },
];

interface DraftState {
  label: string;
  emoji: string;
  color: string;
  kind: CategoryKind;
  /** 編集中の場合の元ラベル。新規追加は null。 */
  oldLabel: string | null;
}

const EMPTY_DRAFT: DraftState = {
  label: '',
  emoji: '🏷️',
  color: '#A66BFF',
  kind: 'other',
  oldLabel: null,
};

export function CategoryManager({ open, onClose, isPro, onUpgrade }: Props) {
  const { userCategories, save, remove } = useCategories();
  const [draft, setDraft] = useState<DraftState | null>(null);

  const customCount = userCategories.length;
  const customCapReached =
    !isPro && customCount >= FREE_CUSTOM_CATEGORY_LIMIT;

  useEffect(() => {
    if (!open) setDraft(null);
  }, [open]);

  const allKnown = useMemo(() => {
    const map = new Map<string, CategoryMeta & { custom: boolean }>();
    for (const c of [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
      map.set(c.label, { ...c, custom: false });
    }
    for (const c of userCategories) {
      map.set(c.label, { ...c, custom: true });
    }
    return Array.from(map.values());
  }, [userCategories]);

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
        aria-label="カテゴリの管理"
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
                ? draft.oldLabel
                  ? 'カテゴリを編集'
                  : 'カテゴリを追加'
                : 'カテゴリの管理'}
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
              onCancel={() => setDraft(null)}
              onSave={async () => {
                if (!draft.label.trim()) return;
                await save(
                  {
                    label: draft.label.trim(),
                    emoji: draft.emoji,
                    color: draft.color,
                    kind: draft.kind,
                  },
                  draft.oldLabel,
                );
                setDraft(null);
              }}
            />
          ) : (
            <>
              {customCapReached ? (
                <button
                  type="button"
                  onClick={() => onUpgrade('カテゴリの追加（4件以上）')}
                  className="tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-1.5 mb-3 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-semibold border-2 border-dashed border-amber-300 dark:border-amber-400/60"
                >
                  <Lock size={15} />
                  カスタム枠を使い切りました
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
                  新しいカテゴリを追加
                  {!isPro && (
                    <span className="text-[0.625rem] font-normal text-white/80 tabular-nums">
                      ({customCount}/{FREE_CUSTOM_CATEGORY_LIMIT})
                    </span>
                  )}
                </button>
              )}
              <ul className="space-y-1.5">
                {allKnown.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-3 rounded-2xl p-2.5 bg-ink-50 dark:bg-night-700/50"
                  >
                    <div
                      className={[
                        'size-10 rounded-xl flex items-center justify-center text-base shrink-0 bg-gradient-to-br',
                        c.gradient,
                      ].join(' ')}
                      style={{ background: c.color }}
                    >
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.875rem] font-semibold truncate">
                        {c.label}
                      </div>
                      <div className="text-[0.625rem] text-ink-400 dark:text-night-400">
                        {c.custom ? 'カスタム' : 'プリセット'} ·{' '}
                        {KIND_OPTIONS.find((k) => k.id === c.kind)?.label ??
                          c.kind}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          label: c.label,
                          emoji: c.emoji,
                          color: c.color,
                          kind: c.kind,
                          oldLabel: c.label,
                        })
                      }
                      aria-label="編集"
                      className="tap-shrink size-9 rounded-xl bg-white dark:bg-night-800 flex items-center justify-center text-ink-600 dark:text-night-200"
                    >
                      <Pencil size={14} />
                    </button>
                    {c.custom && (
                      <button
                        type="button"
                        onClick={() => void remove(c.label)}
                        aria-label="削除"
                        className="tap-shrink size-9 rounded-xl bg-white dark:bg-night-800 flex items-center justify-center text-rose-500 dark:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.6875rem] text-ink-400 dark:text-night-400 leading-relaxed">
                プリセットを編集すると、同じラベルで色や絵文字が上書きされます。
                削除はカスタムカテゴリのみ可能です。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  draft: DraftState;
  setDraft: (next: DraftState) => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
}) {
  const canSave = draft.label.trim().length > 0;
  return (
    <div className="space-y-4">
      {/* プレビュー */}
      <div className="flex items-center gap-3 rounded-2xl p-3 bg-ink-50 dark:bg-night-700/50">
        <div
          className="size-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: draft.color }}
          aria-hidden
        >
          {draft.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.625rem] uppercase tracking-wider font-semibold text-ink-400 dark:text-night-400">
            プレビュー
          </div>
          <div className="text-[0.9375rem] font-semibold truncate">
            {draft.label || '（ラベル未入力）'}
          </div>
        </div>
      </div>

      {/* ラベル */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          ラベル
        </label>
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="例: コーヒー、サブスク…"
          maxLength={20}
          className={[
            'w-full rounded-2xl px-4 py-3 text-[0.9375rem]',
            'bg-white border border-ink-100 shadow-ios text-ink-900',
            'dark:bg-night-800 dark:border-night-700 dark:text-night-100 dark:shadow-ios-dark',
            'focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition',
          ].join(' ')}
        />
      </section>

      {/* 絵文字 */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          絵文字
        </label>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJI_PALETTE.map((e) => {
            const active = draft.emoji === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => setDraft({ ...draft, emoji: e })}
                aria-pressed={active}
                className={[
                  'tap-shrink aspect-square rounded-xl flex items-center justify-center text-lg transition',
                  active
                    ? 'bg-brand-500 text-white shadow-ios'
                    : 'bg-ink-50 dark:bg-night-700/50',
                ].join(' ')}
              >
                {e}
              </button>
            );
          })}
        </div>
      </section>

      {/* 色 */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          カラー
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {COLOR_PALETTE.map((c) => {
            const active = draft.color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setDraft({ ...draft, color: c })}
                aria-pressed={active}
                className={[
                  'tap-shrink aspect-square rounded-xl flex items-center justify-center transition',
                  active ? 'ring-2 ring-offset-2 dark:ring-offset-night-900' : '',
                ].join(' ')}
                style={
                  active
                    ? ({
                        background: c,
                        '--tw-ring-color': c,
                      } as React.CSSProperties)
                    : { background: c }
                }
              >
                {active && <Check size={16} strokeWidth={3} className="text-white" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 種別 (kind) */}
      <section>
        <label className="block text-[0.8125rem] font-bold px-1 mb-1.5">
          種別 <span className="text-ink-400 font-normal text-[0.6875rem]">（性格診断ロジックに影響）</span>
        </label>
        <div className="flex gap-1.5 overflow-x-auto thin-scroll -mx-1 px-1 pb-0.5">
          {KIND_OPTIONS.map((k) => {
            const active = draft.kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setDraft({ ...draft, kind: k.id })}
                aria-pressed={active}
                className={[
                  'tap-shrink shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition',
                  active
                    ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-ios'
                    : 'bg-ink-100 text-ink-700 dark:bg-night-700 dark:text-night-200',
                ].join(' ')}
              >
                {k.label}
              </button>
            );
          })}
        </div>
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
          onClick={() => void onSave()}
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
