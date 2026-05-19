import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAppOrigin,
  getAuthenticatedUser,
  getServiceSupabase,
  getStripe,
  json,
} from './_lib.js';

/**
 * POST /api/checkout
 * Authorization: Bearer <supabase_jwt>
 *
 * Stripe Checkout セッションを作成して URL を返す。
 * 既に Pro 加入済みなら Customer Portal にリダイレクトしてもらう。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return json(res, 500, { error: 'STRIPE_PRICE_ID is not set' });

  const user = await getAuthenticatedUser(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  const stripe = getStripe();
  const supabase = getServiceSupabase();

  // 既存の Stripe customer があれば再利用 (重複作成を避ける)
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'inactive',
        plan: 'free',
      },
      { onConflict: 'user_id' },
    );
  }

  const origin = getAppOrigin(req);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
    metadata: { user_id: user.id },
  });

  return json(res, 200, { url: session.url });
}
