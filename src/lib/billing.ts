import { supabase } from './supabase';

/**
 * Stripe Checkout を開始してリダイレクト。
 * 失敗時はエラーを throw する。
 */
export async function startCheckout(): Promise<void> {
  if (!supabase) {
    throw new Error('Cloud sync is not configured.');
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Not signed in.');

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Checkout failed (${res.status}): ${text}`);
  }
  const { url } = (await res.json()) as { url: string };
  window.location.href = url;
}

/**
 * Stripe Customer Portal にリダイレクトしてカード変更や解約を任せる。
 */
export async function openCustomerPortal(): Promise<void> {
  if (!supabase) throw new Error('Cloud sync is not configured.');
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Not signed in.');

  const res = await fetch('/api/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Portal failed (${res.status}): ${text}`);
  }
  const { url } = (await res.json()) as { url: string };
  window.location.href = url;
}
