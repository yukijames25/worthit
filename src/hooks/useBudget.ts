import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PREFIX = 'worthit.budget.';

function keyFor(userId: string | null): string {
  return `${PREFIX}${userId ?? 'local'}`;
}

/**
 * 月予算 (整数, 円)。0 または null は「未設定」。
 * 今のところ端末ローカル保存。Phase 2 でクラウド同期予定。
 */
export function useBudget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [budget, setBudgetState] = useState<number | null>(() => readFor(userId));

  useEffect(() => {
    setBudgetState(readFor(userId));
  }, [userId]);

  const setBudget = useCallback(
    (next: number | null) => {
      if (typeof window === 'undefined') return;
      const k = keyFor(userId);
      if (next === null || !Number.isFinite(next) || next <= 0) {
        window.localStorage.removeItem(k);
        setBudgetState(null);
      } else {
        const v = Math.round(next);
        window.localStorage.setItem(k, String(v));
        setBudgetState(v);
      }
    },
    [userId],
  );

  return { budget, setBudget };
}

function readFor(userId: string | null): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(keyFor(userId));
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
}
