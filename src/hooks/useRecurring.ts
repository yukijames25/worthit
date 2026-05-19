import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TxType } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LOCAL_STORAGE_KEY = 'worthit.recurringRules';
const LAST_RUN_TS_KEY = 'worthit.recurring.lastCheck';
/** 過去にさかのぼって自動挿入する最大月数 */
const MAX_RETRO_MONTHS = 3;

export interface RecurringRule {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  memo: string;
  dayOfMonth: number;
  active: boolean;
  lastRun: number | null;
  nextDue: number;
}

export interface RecurringInput {
  type: TxType;
  amount: number;
  category: string;
  memo: string;
  dayOfMonth: number;
  active?: boolean;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 翌月の同じ日（その月の最終日でクランプ）を timestamp として返す。 */
export function nextDueAfter(from: number, dayOfMonth: number): number {
  const d = new Date(from);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return new Date(y, m, day, 0, 0, 0, 0).getTime();
}

/** 「今日以降」の最初の dayOfMonth を返す（新規ルール作成時の初期 nextDue 用）。 */
export function initialNextDue(dayOfMonth: number, now = Date.now()): number {
  const d = new Date(now);
  const today = d.getDate();
  const y = d.getFullYear();
  const m = d.getMonth();
  if (dayOfMonth >= today) {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const day = Math.min(dayOfMonth, lastDay);
    return new Date(y, m, day, 0, 0, 0, 0).getTime();
  }
  const lastDay = new Date(y, m + 2, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return new Date(y, m + 1, day, 0, 0, 0, 0).getTime();
}

// ---- LocalStorage helpers ---------------------------------------------------

function readLocal(): RecurringRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRule);
  } catch {
    return [];
  }
}

function writeLocal(rules: RecurringRule[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    /* ignore */
  }
}

function isRule(x: unknown): x is RecurringRule {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    (r.type === 'income' || r.type === 'expense') &&
    typeof r.amount === 'number' &&
    typeof r.category === 'string' &&
    typeof r.dayOfMonth === 'number'
  );
}

// ---- Cloud row mapping ------------------------------------------------------

interface Row {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  memo: string | null;
  day_of_month: number;
  active: boolean;
  last_run: string | null;
  next_due: string;
}

function rowToRule(r: Row): RecurringRule {
  return {
    id: r.id,
    type: r.type === 'income' ? 'income' : 'expense',
    amount: r.amount,
    category: r.category,
    memo: r.memo ?? '',
    dayOfMonth: r.day_of_month,
    active: !!r.active,
    lastRun: r.last_run ? new Date(r.last_run).getTime() : null,
    nextDue: new Date(r.next_due).getTime(),
  };
}

function ruleToRow(r: RecurringRule, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    type: r.type,
    amount: r.amount,
    category: r.category,
    memo: r.memo,
    day_of_month: r.dayOfMonth,
    active: r.active,
    last_run: r.lastRun ? new Date(r.lastRun).toISOString() : null,
    next_due: new Date(r.nextDue).toISOString(),
  };
}

// ---- Hook -------------------------------------------------------------------

interface AddTxFn {
  (input: {
    type: TxType;
    amount: number;
    category: string;
    memo: string;
    date: number;
  }): void;
}

export function useRecurring() {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const userId = user?.id ?? null;

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(cloudReady);

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
        const { data, error } = await supabase
          .from('recurring_rules')
          .select('*')
          .eq('user_id', userId);
        if (cancelled) return;
        if (error) {
          setLoading(false);
          return;
        }
        setRules((data ?? []).map(rowToRule));
        setLoading(false);
      } else {
        setRules(readLocal());
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cloudReady, userId]);

  // LocalStorage 同期
  useEffect(() => {
    if (loading) return;
    if (!cloudReady) writeLocal(rules);
  }, [rules, cloudReady, loading]);

  const add = useCallback((input: RecurringInput) => {
    const next: RecurringRule = {
      id: newId(),
      type: input.type,
      amount: Math.max(0, Math.round(input.amount)),
      category: input.category.trim() || 'その他',
      memo: input.memo.trim(),
      dayOfMonth: Math.min(31, Math.max(1, Math.round(input.dayOfMonth))),
      active: input.active ?? true,
      lastRun: null,
      nextDue: initialNextDue(input.dayOfMonth),
    };
    setRules((prev) => [...prev, next]);
    if (cloudReadyRef.current && supabase && userIdRef.current) {
      void supabase
        .from('recurring_rules')
        .insert(ruleToRow(next, userIdRef.current));
    }
    return next;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<RecurringInput>) => {
      setRules((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const merged: RecurringRule = {
            ...r,
            type: patch.type ?? r.type,
            amount:
              patch.amount !== undefined
                ? Math.max(0, Math.round(patch.amount))
                : r.amount,
            category: patch.category?.trim() ?? r.category,
            memo: patch.memo?.trim() ?? r.memo,
            dayOfMonth:
              patch.dayOfMonth !== undefined
                ? Math.min(31, Math.max(1, Math.round(patch.dayOfMonth)))
                : r.dayOfMonth,
            active: patch.active ?? r.active,
          };
          // dayOfMonth が変わったら nextDue も再計算
          if (
            patch.dayOfMonth !== undefined &&
            patch.dayOfMonth !== r.dayOfMonth
          ) {
            merged.nextDue = initialNextDue(merged.dayOfMonth);
          }
          if (cloudReadyRef.current && supabase && userIdRef.current) {
            void supabase
              .from('recurring_rules')
              .update(ruleToRow(merged, userIdRef.current))
              .eq('id', merged.id);
          }
          return merged;
        }),
      );
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    if (cloudReadyRef.current && supabase) {
      void supabase.from('recurring_rules').delete().eq('id', id);
    }
  }, []);

  const toggleActive = useCallback(
    (id: string) => {
      setRules((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const merged: RecurringRule = { ...r, active: !r.active };
          if (cloudReadyRef.current && supabase && userIdRef.current) {
            void supabase
              .from('recurring_rules')
              .update({ active: merged.active })
              .eq('id', merged.id);
          }
          return merged;
        }),
      );
    },
    [],
  );

  /**
   * 期限切れの定期ルールをすべて取引として追加し、nextDue/lastRun を進める。
   * 一日一回の呼び出しに留めるため、LocalStorageに最終実行日を記録。
   */
  const applyDue = useCallback(
    async (addTx: AddTxFn) => {
      if (loading) return;
      if (typeof window !== 'undefined') {
        const last = window.localStorage.getItem(LAST_RUN_TS_KEY);
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        if (last === todayKey) return; // 今日はもうやった
        window.localStorage.setItem(LAST_RUN_TS_KEY, todayKey);
      }

      const now = Date.now();
      const cutoff =
        now - 1000 * 60 * 60 * 24 * 30 * MAX_RETRO_MONTHS; // N か月以上前は無視

      const updates: RecurringRule[] = [];
      for (const r of rules) {
        if (!r.active) continue;
        let nextDue = r.nextDue;
        let lastRun = r.lastRun;
        let inserted = 0;
        while (nextDue <= now && nextDue > cutoff && inserted < MAX_RETRO_MONTHS) {
          addTx({
            type: r.type,
            amount: r.amount,
            category: r.category,
            memo: r.memo ? `${r.memo}（定期）` : '（定期）',
            date: nextDue,
          });
          lastRun = nextDue;
          nextDue = nextDueAfter(nextDue, r.dayOfMonth);
          inserted += 1;
        }
        // cutoff より古いものは捨てて、次の有効な nextDue まで進める
        while (nextDue <= now) {
          nextDue = nextDueAfter(nextDue, r.dayOfMonth);
        }
        if (inserted > 0 || nextDue !== r.nextDue) {
          updates.push({ ...r, lastRun, nextDue });
        }
      }

      if (updates.length === 0) return;
      setRules((prev) =>
        prev.map((r) => updates.find((u) => u.id === r.id) ?? r),
      );
      if (cloudReadyRef.current && supabase && userIdRef.current) {
        for (const u of updates) {
          await supabase
            .from('recurring_rules')
            .update({
              last_run: u.lastRun ? new Date(u.lastRun).toISOString() : null,
              next_due: new Date(u.nextDue).toISOString(),
            })
            .eq('id', u.id);
        }
      }
    },
    [rules, loading],
  );

  const sorted = useMemo(
    () => [...rules].sort((a, b) => a.dayOfMonth - b.dayOfMonth),
    [rules],
  );

  return {
    rules: sorted,
    loading,
    add,
    update,
    remove,
    toggleActive,
    applyDue,
  };
}
