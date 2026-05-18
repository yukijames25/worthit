import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isCloudEnabled, supabase } from '../lib/supabase';

/**
 * 3 つの mode:
 *  - 'cloud-disabled' : Supabase env が未設定 → ローカルモードのみ
 *  - 'unauthenticated': Supabase 設定済みだがログインしていない
 *  - 'authenticated'  : ログイン済み
 *  - 'local-only'     : Supabase 設定済みだが、ユーザーが明示的に「ローカルで使う」を選択
 */
export type AuthMode =
  | 'cloud-disabled'
  | 'unauthenticated'
  | 'authenticated'
  | 'local-only';

interface AuthState {
  mode: AuthMode;
  user: User | null;
  session: Session | null;
  /** 初回セッション復元中は true。 */
  loading: boolean;
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Cloud 設定済みでも「ログインせずローカルで使う」を選ぶ。 */
  continueLocal: () => void;
  /** ローカル選択を解除してログイン画面に戻る。 */
  exitLocal: () => void;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

const LOCAL_MODE_KEY = 'worthit.localMode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isCloudEnabled);
  const [localChoice, setLocalChoice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(LOCAL_MODE_KEY) === '1';
  });

  // 初回セッション復元 + onAuthStateChange の購読
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_MODE_KEY);
    }
    setLocalChoice(false);
  }, []);

  const continueLocal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_MODE_KEY, '1');
    }
    setLocalChoice(true);
  }, []);

  const exitLocal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_MODE_KEY);
    }
    setLocalChoice(false);
  }, []);

  const mode: AuthMode = useMemo(() => {
    if (!isCloudEnabled) return 'cloud-disabled';
    if (session) return 'authenticated';
    if (localChoice) return 'local-only';
    return 'unauthenticated';
  }, [session, localChoice]);

  const value = useMemo(
    () => ({
      mode,
      user: session?.user ?? null,
      session,
      loading,
      signInWithGoogle,
      signOut,
      continueLocal,
      exitLocal,
    }),
    [
      mode,
      session,
      loading,
      signInWithGoogle,
      signOut,
      continueLocal,
      exitLocal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
