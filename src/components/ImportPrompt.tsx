import { AlertTriangle, FileSpreadsheet, X } from 'lucide-react';
import type { ImportRow } from '../utils/csv';
import { formatYen, toDateKey } from '../utils/format';

interface Props {
  open: boolean;
  fresh: ImportRow[];
  duplicates: number;
  errors: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportPrompt({
  open,
  fresh,
  duplicates,
  errors,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  const sample = fresh.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="CSVインポートの確認"
        className={[
          'relative max-w-sm w-full rounded-3xl p-6 animate-pop-in',
          'bg-white text-ink-900 shadow-ios-lg',
          'dark:bg-night-800 dark:text-night-100 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="閉じる"
          className="absolute top-4 right-4 size-8 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
        >
          <X size={14} />
        </button>

        <div className="mx-auto size-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-ios">
          <FileSpreadsheet size={22} strokeWidth={2.2} />
        </div>
        <h2 className="mt-4 text-[1.0625rem] font-bold text-center">
          CSVをインポートしますか？
        </h2>
        <p className="mt-2 text-[0.75rem] text-ink-500 dark:text-night-300 text-center leading-relaxed">
          以下の件数を既存の記録に追加します。重複する記録（日付・金額・カテゴリ・メモが完全一致）は自動でスキップします。
        </p>

        <div className="mt-4 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 space-y-1.5 text-[0.75rem]">
          <Stat label="追加件数" value={`${fresh.length}件`} accent="good" />
          <Stat label="重複スキップ" value={`${duplicates}件`} />
          {errors.length > 0 && (
            <Stat label="エラー行" value={`${errors.length}件`} accent="bad" />
          )}
        </div>

        {sample.length > 0 && (
          <div className="mt-3 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3 text-[0.6875rem]">
            <div className="font-semibold text-ink-500 dark:text-night-400 uppercase tracking-wider mb-1">
              プレビュー (最初の{sample.length}件)
            </div>
            <ul className="space-y-1">
              {sample.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-ink-700 dark:text-night-200"
                >
                  <span className="tabular-nums w-[5.5em] text-ink-400 dark:text-night-400">
                    {toDateKey(r.date)}
                  </span>
                  <span className="truncate flex-1">
                    {r.category}
                    {r.memo ? ` · ${r.memo}` : ''}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {r.type === 'income' ? '+' : '−'}
                    {formatYen(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-3 text-[0.6875rem] text-amber-700 dark:text-amber-200">
            <div className="font-semibold flex items-center gap-1 mb-1">
              <AlertTriangle size={11} />
              読み取れなかった行
            </div>
            <ul className="space-y-0.5">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>· {e}</li>
              ))}
              {errors.length > 5 && (
                <li className="text-amber-600 dark:text-amber-300">
                  ほか {errors.length - 5}件
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            disabled={fresh.length === 0}
            onClick={onConfirm}
            className={[
              'tap-shrink w-full rounded-2xl py-3 font-semibold text-[0.875rem] transition',
              fresh.length === 0
                ? 'bg-ink-200 text-ink-400 cursor-not-allowed dark:bg-night-700 dark:text-night-500'
                : 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-ios-lg',
            ].join(' ')}
          >
            {fresh.length > 0 ? `${fresh.length}件を追加` : '追加できる行がありません'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="tap-shrink w-full rounded-2xl py-2.5 text-[0.8125rem] text-ink-500 dark:text-night-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'good' | 'bad';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500 dark:text-night-300">{label}</span>
      <span
        className={[
          'font-semibold tabular-nums',
          accent === 'good'
            ? 'text-emerald-600 dark:text-emerald-300'
            : accent === 'bad'
              ? 'text-amber-600 dark:text-amber-300'
              : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
