import { CloudUpload, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { formatYen } from '../utils/format';

interface Props {
  open: boolean;
  candidate: Transaction[];
  onAccept: () => void;
  onDismiss: () => void;
}

export function MigrationPrompt({
  open,
  candidate,
  onAccept,
  onDismiss,
}: Props) {
  if (!open) return null;

  const total = candidate.length;
  const expense = candidate
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const income = candidate
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ローカルデータの移行"
        className={[
          'relative max-w-sm w-full rounded-3xl p-6 animate-pop-in',
          'bg-white text-ink-900 shadow-ios-lg',
          'dark:bg-night-800 dark:text-night-100 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-ios">
          <CloudUpload size={26} strokeWidth={2.2} />
        </div>
        <h2 className="mt-4 text-[1.0625rem] font-bold text-center">
          ローカルの記録をクラウドにアップロードしますか？
        </h2>
        <p className="mt-2 text-[0.8125rem] text-ink-500 dark:text-night-300 text-center leading-relaxed">
          この端末にある記録を、ログイン中のアカウントに紐づけて
          Supabase に保存します。完了後はすべての端末で同じデータを使えるようになります。
        </p>

        <div className="mt-4 rounded-2xl bg-ink-50 dark:bg-night-700/50 p-3.5 space-y-1.5 text-[0.75rem]">
          <Stat label="記録件数" value={`${total}件`} />
          <Stat label="支出合計" value={formatYen(expense)} />
          <Stat label="収入合計" value={formatYen(income)} />
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onAccept}
            className="tap-shrink w-full rounded-2xl py-3 bg-gradient-to-br from-emerald-500 to-teal-400 text-white font-semibold shadow-ios-lg"
          >
            アップロードする
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="tap-shrink w-full rounded-2xl py-2.5 text-[0.8125rem] text-ink-500 dark:text-night-300 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            破棄してクラウドの状態で続ける
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500 dark:text-night-300">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
