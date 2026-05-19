import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAppOrigin,
  getAuthenticatedUser,
  getServiceSupabase,
  getStripe,
  json,
} from './_lib.js';

/**
 * POST /api/portal
 * Authorization: Bearer <supabase_jwt>
 *
 * Stripe Customer Portal セッションを作成して URL を返す。
 * 加入者のキャンセル/カード更新/領収書ダウンロードに使う。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const supabase = getServiceSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return json(res, 404, { error: 'no_customer' });
  }

  const stripe = getStripe();
  const origin = getAppOrigin(req);
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/?portal=return`,
  });

  return json(res, 200, { url: portal.url });
}
