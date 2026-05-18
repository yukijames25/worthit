import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Satisfaction, Transaction, TxType } from '../types';
import { migrateLegacyCategoryId } from '../utils/categories';

const STORAGE_KEY = 'spendtype.transactions.v2';
const LEGACY_KEY = 'spendtype.expenses.v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStorage(): Transaction[] {
  if (typeof window === 'undefined') return [];
  // 1. 新フォーマット
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(coerceTransaction)
          .filter((t): t is Transaction => t !== null);
      }
    }
  } catch {
    /* ignore */
  }
  // 2. 旧フォーマットからのマイグレーション
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        return parsed
          .map(coerceLegacy)
          .filter((t): t is Transaction => t !== null);
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function coerceTransaction(x: unknown): Transaction | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  if (typeof r.amount !== 'number') return null;
  if (typeof r.category !== 'string') return null;
  const type: TxType = r.type === 'income' ? 'income' : 'expense';
  const satisfaction: Satisfaction =
    r.satisfaction === 'good' || r.satisfaction === 'bad' ? r.satisfaction : 'neutral';
  const date =
    typeof r.date === 'number'
      ? r.date
      : typeof r.createdAt === 'number'
        ? (r.createdAt as number)
        : Date.now();
  return {
    id: r.id,
    type,
    amount: Math.max(0, Math.round(r.amount)),
    category: r.category,
    memo: typeof r.memo === 'string' ? r.memo : '',
    date,
    satisfaction: type === 'income' ? 'neutral' : satisfaction,
  };
}

function coerceLegacy(x: unknown): Transaction | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  if (typeof r.amount !== 'number') return null;
  if (typeof r.category !== 'string') return null;
  return {
    id: r.id,
    type: 'expense',
    amount: Math.max(0, Math.round(r.amount)),
    category: migrateLegacyCategoryId(r.category),
    memo: typeof r.memo === 'string' ? r.memo : '',
    date: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    satisfaction: 'neutral',
  };
}

function writeStorage(transactions: Transaction[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    /* prototype — ignore quota */
  }
}

export interface AddInput {
  type: TxType;
  amount: number;
  category: string;
  memo: string;
  date?: number;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readStorage(),
  );

  useEffect(() => {
    writeStorage(transactions);
  }, [transactions]);

  const add = useCallback((input: AddInput) => {
    const next: Transaction = {
      id: newId(),
      type: input.type,
      amount: Math.max(0, Math.round(input.amount)),
      category: input.category.trim() || 'その他',
      memo: input.memo.trim(),
      date: input.date ?? Date.now(),
      satisfaction: 'neutral',
    };
    setTransactions((prev) => [next, ...prev].sort((a, b) => b.date - a.date));
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setSatisfaction = useCallback(
    (id: string, value: Satisfaction) => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id && t.type === 'expense'
            ? { ...t, satisfaction: value }
            : t,
        ),
      );
    },
    [],
  );

  /** ワンタップ用 — good / bad / neutral の循環。 */
  const cycleSatisfaction = useCallback(
    (id: string, target: 'good' | 'bad') => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.type !== 'expense') return t;
          if (t.satisfaction === target) {
            return { ...t, satisfaction: 'neutral' };
          }
          return { ...t, satisfaction: target };
        }),
      );
    },
    [],
  );

  const reset = useCallback(() => setTransactions([]), []);

  const seed = useCallback(() => {
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;
    const sample: Transaction[] = [
      {
        id: newId(),
        type: 'income',
        amount: 280000,
        category: '給料',
        memo: '5月分',
        date: now - day * 0.5,
        satisfaction: 'neutral',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 1280,
        category: '外食・カフェ',
        memo: 'お気に入りのカフェ',
        date: now - day * 0.2,
        satisfaction: 'good',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 6800,
        category: '交際費',
        memo: 'チームの送別会',
        date: now - day * 1,
        satisfaction: 'good',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 2480,
        category: '自己投資',
        memo: '気になっていた新刊',
        date: now - day * 2,
        satisfaction: 'good',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 980,
        category: '日用品',
        memo: 'シャンプー詰め替え',
        date: now - day * 2.5,
        satisfaction: 'neutral',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 3200,
        category: '趣味・娯楽',
        memo: '推しのライブBlu-ray',
        date: now - day * 3,
        satisfaction: 'good',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 1450,
        category: '浪費',
        memo: '深夜の通販で…',
        date: now - day * 4,
        satisfaction: 'bad',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 4200,
        category: '外食・カフェ',
        memo: 'やや高めのディナー',
        date: now - day * 5,
        satisfaction: 'bad',
      },
      {
        id: newId(),
        type: 'expense',
        amount: 12800,
        category: '住居・光熱費',
        memo: '今月の電気代',
        date: now - day * 6,
        satisfaction: 'neutral',
      },
    ];
    setTransactions(sample.sort((a, b) => b.date - a.date));
  }, []);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  return {
    transactions,
    totals,
    add,
    remove,
    setSatisfaction,
    cycleSatisfaction,
    reset,
    seed,
  };
}
