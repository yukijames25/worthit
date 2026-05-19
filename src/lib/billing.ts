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

/** API 呼び出し用の共通ヘルパー (Supabase JWT 添付)。 */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!supabase) throw new Error('Cloud sync is not configured.');
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Not signed in.');
  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...init, headers });
}
