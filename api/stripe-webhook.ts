import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase, getStripe, json } from './_lib';

/**
 * POST /api/stripe-webhook
 *
 * Stripe からの Webhook を受け取り、署名を検証して subscriptions テーブルを更新する。
 *
 * ⚠️ raw body が必要なため bodyParser を無効化する。
 */
export const config = {
  api: { bodyParser: false },
};

// Stripe SDK v22 の名前空間型は default import から直接引けないので、
// 必要なフィールドだけを抜き出した軽量型を自前定義する。
type SubStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused';

interface SubscriptionLike {
  id: string;
  customer: string | { id: string };
  status: SubStatus;
  current_period_end: number;
  metadata?: Record<string, string>;
}

interface CheckoutSessionLike {
  customer: string | { id: string } | null;
  subscription: string | { id: string } | null;
  metadata?: Record<string, string>;
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function planFromStatus(status: SubStatus): 'free' | 'pro' {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return 'pro';
  }
  return 'free';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const sigHeader = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return json(res, 500, { error: 'webhook_secret_not_set' });
  if (typeof sigHeader !== 'string') return json(res, 400, { error: 'no_signature' });

  const stripe = getStripe();
  const supabase = getServiceSupabase();

  let event: { type: string; data: { object: unknown } };
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sigHeader, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(res, 400, { error: `signature_verification_failed: ${msg}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as CheckoutSessionLike;
        const userId = session.metadata?.user_id ?? null;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;
        if (userId && customerId) {
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subId,
              status: 'active',
              plan: 'pro',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as SubscriptionLike;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const userId = sub.metadata?.user_id ?? null;
        const status: SubStatus = sub.status;
        const plan =
          event.type === 'customer.subscription.deleted'
            ? 'free'
            : planFromStatus(status);
        const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

        if (!userId) {
          const { data } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
          if (!data?.user_id) break;
          await supabase
            .from('subscriptions')
            .update({
              status,
              plan,
              stripe_subscription_id: sub.id,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', data.user_id);
        } else {
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              status,
              plan,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
        }
        break;
      }

      default:
        // 他のイベントは無視
        break;
    }

    return json(res, 200, { received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(res, 500, { error: msg });
  }
}
