import { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { authedFetch } from '../lib/billing';

const PENDING_KEY = 'worthit.pendingInvite';

/**
 * URL の ?invite=token を検知し、招待受諾フローを開始する。
 * 未ログインユーザーは Sign-In させる必要があるので、token を一旦
 * localStorage に保存し、ログイン後に再処理する。
 */
export function InviteAcceptPrompt() {
  const { mode, signInWithGoogle } = useAuth();
  const { switchScope, refresh } = useHousehold();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // URL から拾う
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('invite');
    if (fromUrl) {
      window.localStorage.setItem(PENDING_KEY, fromUrl);
      // URL をきれいに
      window.history.replaceState({}, '', window.location.pathname);
      setToken(fromUrl);
      return;
    }
    // ログイン後の再表示
    const pending = window.localStorage.getItem(PENDING_KEY);
    if (pending) setToken(pending);
  }, []);

  if (!token) return null;

  const handleAccept = async () => {
    if (mode !== 'authenticated') {
      // ログインさせる (戻ってきたら再処理される)
      void signInWithGoogle();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch('/api/household/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${t}`);
      }
      const data = (await res.json()) as {
        householdId: string;
        householdName: string;
      };
      window.localStorage.removeItem(PENDING_KEY);
      setSuccess({ name: data.householdName });
      refresh();
      switchScope(data.householdId);
      window.setTimeout(() => setToken(null), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PENDING_KEY);
    }
    setToken(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="家族グループへの招待"
        className={[
          'relative max-w-sm w-full rounded-3xl p-6 animate-pop-in',
          'bg-white text-ink-900 shadow-ios-lg',
          'dark:bg-night-800 dark:text-night-100 dark:shadow-ios-dark',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="閉じる"
          className="absolute top-4 right-4 size-8 rounded-full bg-ink-100 dark:bg-night-700 flex items-center justify-center text-ink-600 dark:text-night-200"
        >
          <X size={14} />
        </button>

        <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white shadow-ios">
          <Users size={26} strokeWidth={2.2} />
        </div>

        {success ? (
          <>
            <h2 className="mt-4 text-[1.0625rem] font-bold text-center">
              「{success.name}」に参加しました 🎉
            </h2>
            <p className="mt-2 text-[0.8125rem] text-ink-500 dark:text-night-300 text-center leading-relaxed">
              これからこのグループのトランザクションが共有されます。
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-[1.0625rem] font-bold text-center">
              家族グループへの招待
            </h2>
            <p className="mt-2 text-[0.8125rem] text-ink-500 dark:text-night-300 text-center leading-relaxed">
              {mode === 'authenticated'
                ? 'このグループに参加すると、メンバーのトランザクションが共有されます。'
                : 'まず Google でログインしてください。'}
            </p>
            {error && (
              <div className="mt-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 px-3 py-2 text-[0.75rem]">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleAccept()}
              disabled={busy}
              className={[
                'tap-shrink mt-5 w-full rounded-2xl py-3 font-bold text-[0.875rem]',
                'bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-ios-lg',
                busy ? 'opacity-60 cursor-wait' : '',
              ].join(' ')}
            >
              {busy
                ? '参加処理中…'
                : mode === 'authenticated'
                  ? 'グループに参加'
                  : 'Google でログイン'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="tap-shrink mt-2 w-full rounded-2xl py-2.5 text-[0.8125rem] text-ink-500 dark:text-night-300"
            >
              キャンセル
            </button>
          </>
        )}
      </div>
    </div>
  );
}
