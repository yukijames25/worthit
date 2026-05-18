import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Satisfaction, Transaction, TxType } from '../types';
import { migrateLegacyCategoryId } from '../utils/categories';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'spendtype.transactions.v2';
const LEGACY_KEY = 'spendtype.expenses.v1';
const MIGRATION_DONE_KEY = 'worthit.migrated';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- LocalStorage ----------------------------------------------------------

function readLocalStorage(): Transaction[] {
  if (typeof window === 'undefined') return [];
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

function writeLocalStorage(transactions: Transaction[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    /* prototype — ignore */
  }
}

function coerceTransaction(x: unknown): Transaction | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  if (typeof r.amount !== 'number') return null;
  if (typeof r.category !== 'string') return null;
  const type: TxType = r.type === 'income' ? 'income' : 'expense';
  const satisfaction: Satisfaction =
    r.satisfaction === 'good' || r.satisfaction === 'bad'
      ? r.satisfaction
      : 'neutral';
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

// ---- Cloud row mapping -----------------------------------------------------

interface Row {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  memo: string | null;
  date: string;
  satisfaction: string;
}

function rowToTransaction(row: Row): Transaction {
  const type: TxType = row.type === 'income' ? 'income' : 'expense';
  const satisfaction: Satisfaction =
    row.satisfaction === 'good' || row.satisfaction === 'bad'
      ? (row.satisfaction as Satisfaction)
      : 'neutral';
  return {
    id: row.id,
    type,
    amount: Math.max(0, Math.round(row.amount)),
    category: row.category,
    memo: row.memo ?? '',
    date: new Date(row.date).getTime(),
    satisfaction: type === 'income' ? 'neutral' : satisfaction,
  };
}

function transactionToRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    category: t.category,
    memo: t.memo,
    date: new Date(t.date).toISOString(),
    satisfaction: t.satisfaction,
  };
}

// ---- Hook ------------------------------------------------------------------

export interface AddInput {
  type: TxType;
  amount: number;
  category: string;
  memo: string;
  date?: number;
}

export interface UseTransactionsState {
  transactions: Transaction[];
  totals: { income: number; expense: number; net: number };
  add: (input: AddInput) => void;
  remove: (id: string) => void;
  setSatisfaction: (id: string, value: Satisfaction) => void;
  cycleSatisfaction: (id: string, target: 'good' | 'bad') => void;
  reset: () => void;
  seed: () => void;
  /** 初回ロード中は true (cloud のみ)。 */
  loading: boolean;
  /** クラウド同期で起きた直近エラー (null = OK)。 */
  error: string | null;
  /** ローカル → クラウド移行候補があれば返す。なければ null。 */
  migrationCandidate: Transaction[] | null;
  acceptMigration: () => Promise<void>;
  dismissMigration: () => void;
}

export function useTransactions(): UseTransactionsState {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const userId = user?.id ?? null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(cloudReady);
  const [error, setError] = useState<string | null>(null);
  const [migrationCandidate, setMigrationCandidate] = useState<
    Transaction[] | null
  >(null);

  // 直近の cloudReady を保持。effect の sync で stale closure を避ける
  const cloudReadyRef = useRef(cloudReady);
  cloudReadyRef.current = cloudReady;
  const userIdRef = useRef<string | null>(userId);
  userIdRef.current = userId;

  // 初期ロード
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (cloudReady && supabase && userId) {
        setLoading(true);
        const { data, error: e } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        if (cancelled) return;
        if (e) {
          setError(e.message);
          setLoading(false);
          return;
        }
        const cloudTx = (data ?? []).map(rowToTransaction);
        setTransactions(cloudTx);
        setLoading(false);
        setError(null);

        // 移行判定: クラウドが空 & ローカルに記録あり & 未移行
        const migrated =
          typeof window !== 'undefined' &&
          window.localStorage.getItem(`${MIGRATION_DONE_KEY}.${userId}`) === '1';
        if (!migrated && cloudTx.length === 0) {
          const local = readLocalStorage();
          if (local.length > 0) setMigrationCandidate(local);
        }
      } else {
        setTransactions(readLocalStorage());
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cloudReady, userId]);

  // LocalStorage への保存（cloud モードでは行わない）
  useEffect(() => {
    if (loading) return;
    if (!cloudReady) writeLocalStorage(transactions);
  }, [transactions, cloudReady, loading]);

  // --- Mutations ---

  const add = useCallback(
    (input: AddInput) => {
      const next: Transaction = {
        id: newId(),
        type: input.type,
        amount: Math.max(0, Math.round(input.amount)),
        category: input.category.trim() || 'その他',
        memo: input.memo.trim(),
        date: input.date ?? Date.now(),
        satisfaction: 'neutral',
      };
      setTransactions((prev) =>
        [next, ...prev].sort((a, b) => b.date - a.date),
      );
      if (cloudReadyRef.current && supabase && userIdRef.current) {
        void supabase
          .from('transactions')
          .insert(transactionToRow(next, userIdRef.current))
          .then(({ error: e }) => {
            if (e) setError(e.message);
          });
      }
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (cloudReadyRef.current && supabase) {
      void supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    }
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
      if (cloudReadyRef.current && supabase) {
        void supabase
          .from('transactions')
          .update({ satisfaction: value })
          .eq('id', id)
          .then(({ error: e }) => {
            if (e) setError(e.message);
          });
      }
    },
    [],
  );

  const cycleSatisfaction = useCallback(
    (id: string, target: 'good' | 'bad') => {
      let nextValue: Satisfaction = target;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.type !== 'expense') return t;
          nextValue = t.satisfaction === target ? 'neutral' : target;
          return { ...t, satisfaction: nextValue };
        }),
      );
      if (cloudReadyRef.current && supabase) {
        void supabase
          .from('transactions')
          .update({ satisfaction: nextValue })
          .eq('id', id)
          .then(({ error: e }) => {
            if (e) setError(e.message);
          });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setTransactions([]);
    if (cloudReadyRef.current && supabase && userIdRef.current) {
      void supabase
        .from('transactions')
        .delete()
        .eq('user_id', userIdRef.current)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    }
  }, []);

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
    const sorted = sample.sort((a, b) => b.date - a.date);
    setTransactions(sorted);
    if (cloudReadyRef.current && supabase && userIdRef.current) {
      void supabase
        .from('transactions')
        .insert(sorted.map((t) => transactionToRow(t, userIdRef.current!)))
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    }
  }, []);

  // --- Migration ---

  const acceptMigration = useCallback(async () => {
    if (!migrationCandidate || !supabase || !userIdRef.current) return;
    const userIdNow = userIdRef.current;
    const { error: e } = await supabase
      .from('transactions')
      .insert(migrationCandidate.map((t) => transactionToRow(t, userIdNow)));
    if (e) {
      setError(e.message);
      return;
    }
    setTransactions(
      migrationCandidate.slice().sort((a, b) => b.date - a.date),
    );
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${MIGRATION_DONE_KEY}.${userIdNow}`, '1');
    }
    setMigrationCandidate(null);
  }, [migrationCandidate]);

  const dismissMigration = useCallback(() => {
    if (typeof window !== 'undefined' && userIdRef.current) {
      window.localStorage.setItem(
        `${MIGRATION_DONE_KEY}.${userIdRef.current}`,
        '1',
      );
    }
    setMigrationCandidate(null);
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
    loading,
    error,
    migrationCandidate,
    acceptMigration,
    dismissMigration,
  };
}
