import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TOTAL_PREFIX = 'worthit.budget.';
const PER_CATEGORY_PREFIX = 'worthit.categoryBudgets.';

interface PerCategory {
  [label: string]: number;
}

function totalKey(userId: string | null): string {
  return `${TOTAL_PREFIX}${userId ?? 'local'}`;
}

function perCategoryKey(userId: string | null): string {
  return `${PER_CATEGORY_PREFIX}${userId ?? 'local'}`;
}

/**
 * 予算管理 (端末ローカル保存)。
 * - monthlyTotal: 月の合計予算 (1 つ)。無料でも使える。
 * - perCategory: カテゴリラベル → 月予算。Pro 機能。
 */
export function useBudget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [budget, setBudgetState] = useState<number | null>(() =>
    readTotal(userId),
  );
  const [perCategory, setPerCategoryState] = useState<PerCategory>(() =>
    readPerCategory(userId),
  );

  useEffect(() => {
    setBudgetState(readTotal(userId));
    setPerCategoryState(readPerCategory(userId));
  }, [userId]);

  const setBudget = useCallback(
    (next: number | null) => {
      if (typeof window === 'undefined') return;
      const k = totalKey(userId);
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

  const setCategoryBudget = useCallback(
    (label: string, amount: number | null) => {
      if (typeof window === 'undefined') return;
      setPerCategoryState((prev) => {
        const next = { ...prev };
        if (amount === null || !Number.isFinite(amount) || amount <= 0) {
          delete next[label];
        } else {
          next[label] = Math.round(amount);
        }
        window.localStorage.setItem(perCategoryKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  const clearCategoryBudgets = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(perCategoryKey(userId));
    setPerCategoryState({});
  }, [userId]);

  return { budget, setBudget, perCategory, setCategoryBudget, clearCategoryBudgets };
}

function readTotal(userId: string | null): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(totalKey(userId));
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
}

function readPerCategory(userId: string | null): PerCategory {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(perCategoryKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: PerCategory = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && v > 0) out[k] = Math.round(v);
    }
    return out;
  } catch {
    return {};
  }
}
