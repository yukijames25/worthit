import { Cloud, CloudOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';

export function LoginScreen() {
  const { signInWithGoogle, continueLocal } = useAuth();
  const { t } = useTranslation();

  return (
    <div
      className={[
        'min-h-[100svh] flex flex-col',
        'bg-app-gradient dark:bg-app-gradient-dark',
        'text-ink-900 dark:text-night-100',
        'transition-colors duration-300',
      ].join(' ')}
    >
      <div className="mx-auto max-w-md w-full flex-1 flex flex-col justify-center px-6 py-10 animate-fade-up">
        {/* ヒーロー */}
        <div className="text-center">
          <div className="mx-auto size-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-4xl shadow-ios-lg animate-float">
            🪙
          </div>
          <h1 className="mt-5 text-[1.625rem] font-bold leading-tight tracking-tight">
            {t.appName}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500 dark:text-night-300">
            {t.login_tagline}
          </p>
        </div>

        <ul className="mt-8 space-y-2.5">
          <Feature icon="📒" title={t.feature_statement_t}>
            {t.feature_statement_b}
          </Feature>
          <Feature icon="👍👎" title={t.feature_rate_t}>
            {t.feature_rate_b}
          </Feature>
          <Feature icon="🧭" title={t.feature_ai_t}>
            {t.feature_ai_b}
          </Feature>
          <Feature icon="📱" title={t.feature_sync_t}>
            {t.feature_sync_b}
          </Feature>
        </ul>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className={[
              'tap-shrink w-full rounded-2xl py-3.5 flex items-center justify-center gap-3 font-semibold text-[0.9375rem]',
              'bg-white text-ink-900 shadow-ios-lg border border-ink-100',
              'dark:bg-night-800 dark:text-night-100 dark:border-night-700 dark:shadow-ios-dark',
            ].join(' ')}
          >
            <GoogleLogo />
            {t.login_google}
          </button>

          <button
            type="button"
            onClick={continueLocal}
            className={[
              'tap-shrink w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-[0.8125rem] font-medium',
              'text-ink-500 dark:text-night-300',
            ].join(' ')}
          >
            <CloudOff size={14} />
            {t.login_localOnly}
          </button>
        </div>

        <p className="mt-6 text-center text-[0.6875rem] text-ink-400 dark:text-night-400 leading-relaxed">
          <Cloud size={11} className="inline mb-0.5 mr-0.5" />
          {t.login_footnote_cloud}
          <Sparkles size={11} className="inline mb-0.5 mx-0.5" />
          {t.login_footnote_local}
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li
      className={[
        'flex items-start gap-3 rounded-2xl px-3.5 py-2.5 border',
        'bg-white/70 border-white shadow-ios',
        'dark:bg-night-800/70 dark:border-night-700 dark:shadow-ios-dark',
      ].join(' ')}
    >
      <div className="text-xl shrink-0 leading-none mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-[0.8125rem] font-semibold text-ink-900 dark:text-night-100">
          {title}
        </div>
        <div className="text-[0.6875rem] text-ink-500 dark:text-night-300 leading-relaxed">
          {children}
        </div>
      </div>
    </li>
  );
}

function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.441 1.346l2.581-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
