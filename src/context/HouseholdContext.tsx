import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  /** member 数。 */
  memberCount: number;
  isOwner: boolean;
}

export type HouseholdScope = string | null; // null = 個人

interface HouseholdState {
  households: Household[];
  /** 'personal' 表示 = null。 */
  currentHouseholdId: HouseholdScope;
  /** 現在の世帯 (個人なら null)。 */
  currentHousehold: Household | null;
  loading: boolean;
  error: string | null;
}

interface HouseholdActions {
  switchScope: (id: HouseholdScope) => void;
  createHousehold: (name: string) => Promise<Household | null>;
  renameHousehold: (id: string, name: string) => Promise<void>;
  leaveHousehold: (id: string) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;
  refresh: () => void;
}

const HouseholdContext = createContext<(HouseholdState & HouseholdActions) | null>(
  null,
);

const SCOPE_PREFIX = 'worthit.householdScope.';

function readScope(userId: string | null): HouseholdScope {
  if (typeof window === 'undefined' || !userId) return null;
  const v = window.localStorage.getItem(`${SCOPE_PREFIX}${userId}`);
  return v && v !== 'null' ? v : null;
}

function writeScope(userId: string | null, scope: HouseholdScope) {
  if (typeof window === 'undefined' || !userId) return;
  if (scope === null) {
    window.localStorage.setItem(`${SCOPE_PREFIX}${userId}`, 'null');
  } else {
    window.localStorage.setItem(`${SCOPE_PREFIX}${userId}`, scope);
  }
}

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const userId = user?.id ?? null;

  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHouseholdId, setCurrentHouseholdId] =
    useState<HouseholdScope>(() => readScope(userId));
  const [loading, setLoading] = useState(cloudReady);
  const [error, setError] = useState<string | null>(null);
  const [bump, setBump] = useState(0);

  const userIdRef = useRef<string | null>(userId);
  userIdRef.current = userId;

  // Load list
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cloudReady || !supabase || !userId) {
        setHouseholds([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      // 自分が member の household を取り、各 household の member 数も
      const { data: membersData, error: e1 } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', userId);
      if (cancelled) return;
      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }
      const ids = (membersData ?? []).map((m) => m.household_id);
      if (ids.length === 0) {
        setHouseholds([]);
        // scope を localStorage から読み直し
        const stored = readScope(userId);
        setCurrentHouseholdId(stored);
        setLoading(false);
        return;
      }
      const { data: hData, error: e2 } = await supabase
        .from('households')
        .select('id, name, owner_id')
        .in('id', ids);
      if (cancelled) return;
      if (e2) {
        setError(e2.message);
        setLoading(false);
        return;
      }
      // member 数の取得 (シンプルに別クエリ)
      const { data: countData } = await supabase
        .from('household_members')
        .select('household_id')
        .in('household_id', ids);
      const memberCounts = new Map<string, number>();
      for (const row of countData ?? []) {
        memberCounts.set(
          row.household_id,
          (memberCounts.get(row.household_id) ?? 0) + 1,
        );
      }
      const list: Household[] = (hData ?? []).map((h) => ({
        id: h.id,
        name: h.name,
        ownerId: h.owner_id,
        memberCount: memberCounts.get(h.id) ?? 1,
        isOwner: h.owner_id === userId,
      }));
      setHouseholds(list);

      // 保存されている scope を読み込む。存在しないなら null へ。
      const stored = readScope(userId);
      if (stored && list.some((h) => h.id === stored)) {
        setCurrentHouseholdId(stored);
      } else {
        setCurrentHouseholdId(null);
      }
      setLoading(false);
      setError(null);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cloudReady, userId, bump]);

  const switchScope = useCallback(
    (id: HouseholdScope) => {
      setCurrentHouseholdId(id);
      writeScope(userIdRef.current, id);
    },
    [],
  );

  const createHousehold = useCallback(
    async (name: string): Promise<Household | null> => {
      if (!cloudReady || !supabase || !userId) return null;
      const trimmed = name.trim() || '家族';
      const { data, error: e1 } = await supabase
        .from('households')
        .insert({ name: trimmed, owner_id: userId })
        .select('id, name, owner_id')
        .single();
      if (e1 || !data) {
        setError(e1?.message ?? 'create_failed');
        return null;
      }
      // owner も member 表に登録
      await supabase
        .from('household_members')
        .insert({ household_id: data.id, user_id: userId, role: 'owner' });
      const h: Household = {
        id: data.id,
        name: data.name,
        ownerId: data.owner_id,
        memberCount: 1,
        isOwner: true,
      };
      setHouseholds((prev) => [...prev, h]);
      switchScope(h.id);
      return h;
    },
    [cloudReady, userId, switchScope],
  );

  const renameHousehold = useCallback(
    async (id: string, name: string) => {
      if (!supabase) return;
      const trimmed = name.trim() || '家族';
      const { error: e } = await supabase
        .from('households')
        .update({ name: trimmed })
        .eq('id', id);
      if (e) {
        setError(e.message);
        return;
      }
      setHouseholds((prev) =>
        prev.map((h) => (h.id === id ? { ...h, name: trimmed } : h)),
      );
    },
    [],
  );

  const leaveHousehold = useCallback(
    async (id: string) => {
      if (!supabase || !userIdRef.current) return;
      await supabase
        .from('household_members')
        .delete()
        .eq('household_id', id)
        .eq('user_id', userIdRef.current);
      setHouseholds((prev) => prev.filter((h) => h.id !== id));
      if (currentHouseholdId === id) switchScope(null);
    },
    [currentHouseholdId, switchScope],
  );

  const deleteHousehold = useCallback(
    async (id: string) => {
      if (!supabase) return;
      const { error: e } = await supabase.from('households').delete().eq('id', id);
      if (e) {
        setError(e.message);
        return;
      }
      setHouseholds((prev) => prev.filter((h) => h.id !== id));
      if (currentHouseholdId === id) switchScope(null);
    },
    [currentHouseholdId, switchScope],
  );

  const refresh = useCallback(() => setBump((n) => n + 1), []);

  const currentHousehold = useMemo(
    () =>
      currentHouseholdId
        ? households.find((h) => h.id === currentHouseholdId) ?? null
        : null,
    [households, currentHouseholdId],
  );

  const value = useMemo(
    () => ({
      households,
      currentHouseholdId,
      currentHousehold,
      loading,
      error,
      switchScope,
      createHousehold,
      renameHousehold,
      leaveHousehold,
      deleteHousehold,
      refresh,
    }),
    [
      households,
      currentHouseholdId,
      currentHousehold,
      loading,
      error,
      switchScope,
      createHousehold,
      renameHousehold,
      leaveHousehold,
      deleteHousehold,
      refresh,
    ],
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
