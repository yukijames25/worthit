import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SubscriptionState {
  /** 'pro' になっているか。Pro機能のゲートはこれを見る。 */
  isPro: boolean;
  /** Stripe からの最新ステータス文字列。 */
  status: string;
  /** 'free' | 'pro' */
  plan: 'free' | 'pro';
  /** 期間終了 (ms)。Pro でなければ null。 */
  currentPeriodEnd: number | null;
  loading: boolean;
  /** 直近のフェッチを強制的にもう一度走らせる。Checkout 後の戻りに使う。 */
  refresh: () => void;
}

interface Row {
  status: string;
  plan: string;
  current_period_end: string | null;
}

export function useSubscription(): SubscriptionState {
  const { mode, user } = useAuth();
  const cloudReady = mode === 'authenticated' && !!supabase && !!user;
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(cloudReady);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cloudReady || !supabase || !user) {
        setRow(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setRow(data ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cloudReady, user, bump]);

  // Stripe Checkout 後の戻りで `?checkout=success` を読み取り、即再フェッチ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      // 5秒の間に5回ポーリングして Webhook の反映を捕まえる
      const timers: number[] = [];
      for (let i = 1; i <= 5; i++) {
        timers.push(window.setTimeout(() => setBump((n) => n + 1), i * 1500));
      }
      // URL をきれいにしておく
      window.history.replaceState({}, '', window.location.pathname);
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
  }, []);

  const refresh = useCallback(() => setBump((n) => n + 1), []);

  const plan: 'free' | 'pro' = row?.plan === 'pro' ? 'pro' : 'free';
  const status = row?.status ?? 'inactive';
  const isPro = plan === 'pro' && (status === 'active' || status === 'trialing' || status === 'past_due');
  const currentPeriodEnd = row?.current_period_end
    ? new Date(row.current_period_end).getTime()
    : null;

  return { isPro, status, plan, currentPeriodEnd, loading, refresh };
}
