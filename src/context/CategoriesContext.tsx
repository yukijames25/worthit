import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CategoryKind, CategoryMeta } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  getCategoryMeta as getDefaultMeta,
} from '../utils/categories';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'worthit.userCategories';

export interface UserCategoryInput {
  label: string;
  emoji: string;
  color: string;
  kind: CategoryKind;
}

interface State {
  /** ユーザー定義の追加/上書きカテゴリ。 */
  userCategories: CategoryMeta[];
  /** ラベル → 解決済みCategoryMeta（ユーザー定義優先）。 */
  getMeta: (label: string) => CategoryMeta;
  /** label をキーにした上書きマップ。pure function 渡しで使う。 */
  customsMap: Record<string, CategoryMeta>;
  /** 既定 + ユーザー定義を結合したサジェスト用一覧（支出系）。 */
  expensePresets: CategoryMeta[];
  /** 既定 + ユーザー定義を結合した収入用一覧。 */
  incomePresets: CategoryMeta[];
  /** 上書き元のラベル (oldLabel) と新しい内容。oldLabel を null で新規追加。 */
  save: (input: UserCategoryInput, oldLabel?: string | null) => Promise<void>;
  remove: (label: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CategoriesContext = createContext<State | null>(null);

// ---- LocalStorage helpers ---------------------------------------------------

function readLocal(): CategoryMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCategoryMeta);
  } catch {
    return [];
  }
}

function writeLocal(list: CategoryMeta[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function isCategoryMeta(x: unknown): x is CategoryMeta {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.label === 'string' &&
    typeof r.emoji === 'string' &&
    typeof r.color === 'string' &&
    typeof r.kind === 'string'
  );
}

// ---- Cloud row mapping ------------------------------------------------------

interface Row {
  id: string;
  user_id: string;
  label: string;
  emoji: string;
  color: string;
  kind: string;
}

function rowToMeta(r: Row): CategoryMeta {
  return {
    label: r.label,
    emoji: r.emoji,
    color: r.color,
    gradient: getDefaultMeta(r.label).gradient, // 既定のグラデーションを継承
    kind: (r.kind as CategoryKind) ?? 'other',
  };
}

// ---- Provider ---------------------------------------------------------------

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const userId = user?.id ?? null;

  const [userCategories, setUserCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(cloudReady);
  const [error, setError] = useState<string | null>(null);

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
          .from('categories')
          .select('*')
          .eq('user_id', userId);
        if (cancelled) return;
        if (e) {
          setError(e.message);
          setLoading(false);
          return;
        }
        setUserCategories((data ?? []).map(rowToMeta));
        setLoading(false);
        setError(null);
      } else {
        setUserCategories(readLocal());
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
    if (!cloudReady) writeLocal(userCategories);
  }, [userCategories, cloudReady, loading]);

  const customsMap = useMemo(() => {
    const m: Record<string, CategoryMeta> = {};
    for (const c of userCategories) m[c.label] = c;
    return m;
  }, [userCategories]);

  const getMeta = useCallback(
    (label: string): CategoryMeta => {
      if (customsMap[label]) return customsMap[label];
      return getDefaultMeta(label);
    },
    [customsMap],
  );

  /** 既定 + ユーザー = 結合した支出系プリセット。重複は user 優先。 */
  const expensePresets = useMemo(() => {
    const map = new Map<string, CategoryMeta>();
    for (const c of DEFAULT_CATEGORIES) map.set(c.label, c);
    for (const c of userCategories) {
      if (c.kind === 'income') continue;
      map.set(c.label, c);
    }
    return Array.from(map.values());
  }, [userCategories]);

  const incomePresets = useMemo(() => {
    const map = new Map<string, CategoryMeta>();
    for (const c of DEFAULT_INCOME_CATEGORIES) map.set(c.label, c);
    for (const c of userCategories) {
      if (c.kind !== 'income') continue;
      map.set(c.label, c);
    }
    return Array.from(map.values());
  }, [userCategories]);

  const save = useCallback(
    async (input: UserCategoryInput, oldLabel?: string | null) => {
      const next: CategoryMeta = {
        label: input.label.trim(),
        emoji: input.emoji || '🏷️',
        color: input.color || '#A66BFF',
        gradient: getDefaultMeta(input.label).gradient,
        kind: input.kind,
      };

      // ローカルstateを楽観更新
      setUserCategories((prev) => {
        const filtered = oldLabel
          ? prev.filter((c) => c.label !== oldLabel)
          : prev.filter((c) => c.label !== next.label);
        return [...filtered, next];
      });

      if (cloudReadyRef.current && supabase && userIdRef.current) {
        // oldLabel と label が違うなら削除→挿入、同じなら upsert
        if (oldLabel && oldLabel !== next.label) {
          await supabase
            .from('categories')
            .delete()
            .eq('user_id', userIdRef.current)
            .eq('label', oldLabel);
        }
        const { error: e } = await supabase
          .from('categories')
          .upsert(
            {
              user_id: userIdRef.current,
              label: next.label,
              emoji: next.emoji,
              color: next.color,
              kind: next.kind,
            },
            { onConflict: 'user_id,label' },
          );
        if (e) setError(e.message);
      }
    },
    [],
  );

  const remove = useCallback(async (label: string) => {
    setUserCategories((prev) => prev.filter((c) => c.label !== label));
    if (cloudReadyRef.current && supabase && userIdRef.current) {
      const { error: e } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', userIdRef.current)
        .eq('label', label);
      if (e) setError(e.message);
    }
  }, []);

  const value = useMemo<State>(
    () => ({
      userCategories,
      getMeta,
      customsMap,
      expensePresets,
      incomePresets,
      save,
      remove,
      loading,
      error,
    }),
    [
      userCategories,
      getMeta,
      customsMap,
      expensePresets,
      incomePresets,
      save,
      remove,
      loading,
      error,
    ],
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
