import { useState } from 'react';
import { Check, Crown, Sparkles, X } from 'lucide-react';
import { startCheckout } from '../../lib/billing';
import { useAuth } from '../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pro 機能のうち、利用しようとしている特定の機能名 (任意)。 */
  feature?: string;
}

const PRO_FEATURES = [
  '📥 CSVインポート',
  '📊 年間チャート + カスタム期間',
  '📄 PDFレポート',
  '💰 カテゴリ別予算',
  '🎯 これからの新機能',
];

export function UpgradeSheet({ open, onClose, feature }: Props) {
  const { mode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (mode !== 'authenticated') {
      setError(
        'Pro プランにアップグレードするにはまず Google でログインしてください。',
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await startCheckout();
      // Redirects to Stripe — never reaches here on success
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pro にアップグレード"
        className={[
          'absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px]',
          'bg-white text-ink-900 dark:bg-night-900 dark:text-night-100',
          'shadow-ios-lg animate-sheet-up safe-bottom',
        ].join(' ')}
      >
        <div className="pt-2 pb-3 px-5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-night-900/95 backdrop-blur-xl">
          <div className="mx-auto h-1 w-10 rounded-full bg-ink-200 dark:bg-night-600 absolute top-2 left-1/2 -translate-x-1/2" />
          <div />
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="tap-shrink size-9 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-8">
          {/* ヒーロー */}
          <div className="text-center pt-2">
            <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-white shadow-ios-lg animate-pop-in">
              <Crown size={28} strokeWidth={2.4} />
            </div>
            <h2 className="mt-4 text-[1.375rem] font-bold tracking-tight">
              worthit Pro
            </h2>
            {feature && (
              <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={12} />
                  {feature}
                </span>{' '}
                は Pro 機能です
              </p>
            )}
          </div>

          {/* 価格 */}
          <div className="mt-6 mx-auto rounded-3xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-500/30">
            <div className="text-[0.6875rem] tracking-wider uppercase font-semibold text-amber-700 dark:text-amber-300">
              月額プラン
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[2rem] font-bold text-ink-900 dark:text-night-100 leading-none tabular-nums">
                ¥480
              </span>
              <span className="text-[0.875rem] text-ink-500 dark:text-night-300">
                / 月
              </span>
            </div>
            <p className="mt-2 text-[0.75rem] text-ink-600 dark:text-night-300 leading-relaxed">
              いつでもキャンセル可能。次の請求日まで Pro 機能を使えます。
            </p>
          </div>

          {/* 特典 */}
          <ul className="mt-5 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 rounded-2xl p-3 bg-ink-50 dark:bg-night-700/50"
              >
                <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-[0.875rem] font-medium">{f}</span>
              </li>
            ))}
          </ul>

          {/* エラー */}
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 px-3.5 py-2.5 text-[0.75rem]">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={loading}
            className={[
              'tap-shrink mt-6 w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-[0.9375rem]',
              'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-ios-lg',
              loading ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
          >
            <Crown size={16} strokeWidth={2.6} />
            {loading ? 'Stripeへ移動中…' : 'Pro にアップグレード'}
          </button>

          <p className="mt-3 text-center text-[0.6875rem] text-ink-400 dark:text-night-400 leading-relaxed">
            決済は Stripe を経由します。クレジットカード情報を worthit が保持することはありません。
          </p>
        </div>
      </div>
    </div>
  );
}
