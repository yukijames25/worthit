import { RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  show: boolean;
  onApply: () => void;
}

export function UpdateBanner({ show, onApply }: Props) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 px-3 safe-top pointer-events-none"
      aria-live="polite"
    >
      <div className="mx-auto max-w-md pt-2 pointer-events-auto animate-fade-up">
        <div
          className={[
            'rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-ios-lg',
            'bg-gradient-to-br from-brand-500 to-brand-400 text-white',
            'border border-white/20',
          ].join(' ')}
        >
          <Sparkles size={16} strokeWidth={2.4} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-bold leading-tight">
              {t.update_title}
            </div>
            <div className="text-[0.6875rem] text-white/85 leading-tight">
              {t.update_body}
            </div>
          </div>
          <button
            type="button"
            onClick={onApply}
            className="tap-shrink shrink-0 rounded-full px-3 py-1.5 bg-white text-brand-600 text-[0.75rem] font-bold inline-flex items-center gap-1"
            aria-label={t.update_button}
          >
            <RefreshCw size={12} strokeWidth={2.6} />
            {t.update_button}
          </button>
        </div>
      </div>
    </div>
  );
}
