import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function 用の共通ユーティリティ。
 * - Stripe SDK の単一インスタンス
 * - Supabase service-role クライアント (Webhook 用)
 * - 認証済みユーザー解決 (クライアントの JWT 検証)
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getStripe(): Stripe {
  if (!STRIPE_SECRET) {
    throw new Error('STRIPE_SECRET_KEY env var is not configured');
  }
  return new Stripe(STRIPE_SECRET);
}

/** service_role キーで Supabase を呼ぶ (RLS を bypass する)。Webhook 用。 */
export function getServiceSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase env vars are not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * リクエストの Authorization ヘッダから JWT を取り出して Supabase に検証してもらう。
 * 認証されていなければ null。
 */
export async function getAuthenticatedUser(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

export function getAppOrigin(req: VercelRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host =
    (req.headers['x-forwarded-host'] as string) ??
    (req.headers.host as string) ??
    'worthit-sigma.vercel.app';
  return `${proto}://${host}`;
}
