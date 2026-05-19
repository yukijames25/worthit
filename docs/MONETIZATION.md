# Monetization setup (Stripe)

This document walks through everything you need to do **outside the codebase** to enable the Pro tier. The code is already wired — these steps connect Stripe + Vercel + Supabase so the wiring actually carries current.

> ⏱ Total time: ~30 minutes (mostly waiting for emails / pasting keys).

---

## 0. What you need

- A Stripe account (free to create)
- Vercel project deploy access (you already have this)
- Supabase project (you already have this)

---

## 1. Create the product + price in Stripe

1. Go to <https://dashboard.stripe.com/test/products> — **make sure you're in Test mode** (toggle top right)
2. Click **「新規追加」** / "Add product"
3. Fill in:
   - **Name**: `worthit Pro`
   - **Description**: `満足度ベース家計簿の Pro プラン`
4. Under **Pricing**:
   - **Pricing model**: `Standard pricing`
   - **Price**: `¥480`
   - **Billing period**: `Monthly` / `毎月`
   - **Currency**: `JPY`
5. Click **「商品を保存」** / "Save product"
6. On the product detail page, find the **Price ID** (starts with `price_…`). **Copy it.** This is your `STRIPE_PRICE_ID`.

---

## 2. Get the Stripe API keys

1. <https://dashboard.stripe.com/test/apikeys>
2. Copy two values:
   - **Publishable key** (starts with `pk_test_…`) — we don't currently use this, can ignore
   - **Secret key** (starts with `sk_test_…`) — **THIS** is what you need. Copy it. → `STRIPE_SECRET_KEY`

---

## 3. Create a Stripe Webhook endpoint

The webhook is what tells worthit "this user just upgraded" / "this user just canceled."

1. <https://dashboard.stripe.com/test/webhooks> → **「エンドポイントを追加」** / "Add endpoint"
2. **Endpoint URL**: `https://worthit-sigma.vercel.app/api/stripe-webhook` (your Vercel domain + `/api/stripe-webhook`)
3. **Events to send**: select these 4:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **「イベントを追加」** / "Add events"
5. After creating, click the endpoint to view details
6. Find **Signing secret** — click **「Reveal」** / "Reveal" → copy (`whsec_…`). → `STRIPE_WEBHOOK_SECRET`

---

## 4. Get the Supabase service-role key

The webhook needs this to bypass RLS and write to the `subscriptions` table.

1. Supabase Dashboard → **⚙ Project Settings → API**
2. Find **`service_role`** secret (⚠️ NOT the anon key — different one, more powerful)
3. Click **Reveal** → copy. → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Never commit the service-role key to git.** Vercel env only.

---

## 5. Run the SQL migration

In Supabase SQL Editor, re-run [`supabase/schema.sql`](../supabase/schema.sql). It's idempotent — only the new `subscriptions` table will be created. Existing tables stay intact.

---

## 6. Configure Vercel environment variables

Vercel Dashboard → `worthit` project → **Settings → Environment Variables**

Add these (set "Environments" to **Production + Preview + Development** for each):

| Key | Value | From |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` | Step 2 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Step 3 |
| `STRIPE_PRICE_ID` | `price_…` | Step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | Step 4 |

You **already** have these from earlier setup (no need to re-add):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

After saving, **trigger a redeploy** (Deployments tab → ⋯ → Redeploy) so the new env vars reach the serverless functions.

---

## 7. Try it end-to-end (test mode)

1. Open `https://worthit-sigma.vercel.app`
2. Sign in with Google
3. Go to **Settings** → **worthit Pro** → **詳しく見る**
4. Click **Pro にアップグレード** → you'll be redirected to Stripe Checkout
5. Use Stripe's [test card numbers](https://stripe.com/docs/testing):
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: any future date
   - **CVC**: any 3 digits
   - **Postal code**: any
6. Click 支払う / Pay
7. You'll be redirected back to worthit
8. After ~5 seconds (the polling window in `useSubscription`), Settings should show **PRO** badge and "購読を管理" button
9. Verify the `subscriptions` table in Supabase has a row with `plan = 'pro'`, `status = 'active'`

### Try canceling

1. Click **購読を管理** → Stripe Customer Portal opens
2. Cancel subscription
3. Back to worthit → wait a few seconds → reload → Pro badge gone, monthly chart back to 6 months, CSV import locked

---

## 8. Going live (when you're ready)

Switching from test mode to live is **deliberate** — Stripe wants you to KYC and verify.

1. Stripe Dashboard → toggle **Test mode → Live mode** (top right)
2. Re-do **Steps 1, 2, 3** in Live mode (Stripe keeps test and live data fully separate)
3. Activate your Stripe account (business name, bank account, identity verification — Stripe walks you through)
4. Update Vercel env vars with the **live** keys (`sk_live_…`, `whsec_…` (new), `price_…` (new))
5. Trigger a redeploy

> 💡 Keep test mode keys handy for development. You can run with test keys in your `.env.local` locally and live keys in Vercel.

---

## 9. Local development with the functions

For most local development, the Pro features just show as "PRO locked" — fine. But if you want to test the Stripe flow locally:

```bash
npm install -g vercel
vercel dev
```

This runs the api/ functions on `localhost:3000`. You'll need a tunnel (ngrok / Stripe CLI) to receive webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

This gives you a temporary webhook secret for local use. Most of the time you don't need this — testing on Vercel Preview deploys is faster.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Checkout button → 401 unauthenticated | User not signed in to Supabase. Sign in first. |
| Checkout button → 500 / `STRIPE_PRICE_ID is not set` | Env var missing on Vercel. Verify in Settings → Env vars. |
| Webhook returns 400 `signature_verification_failed` | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's secret. Re-copy from Stripe dashboard. |
| `subscriptions` row never gets created | Check Vercel function logs in `Deployments → ⋯ → Logs`. The webhook must be receiving events; if not, the endpoint URL or events selection is wrong. |
| User pays, comes back, still shows free | The polling window may have missed. Reload the page once. If still wrong, check the `subscriptions` table directly. |

---

## What's in scope for "Pro" right now

| Feature | Free | Pro |
|---|---|---|
| Bank-statement view | ✓ | ✓ |
| Add/edit/delete transactions | ✓ | ✓ |
| 👍👎 satisfaction ratings | ✓ | ✓ |
| Custom categories | ✓ | ✓ |
| Monthly budget (total) | ✓ | ✓ |
| Personality diagnosis | ✓ | ✓ |
| Dark mode + font scale + i18n | ✓ | ✓ |
| Recurring transactions | ✓ | ✓ |
| CSV export | ✓ | ✓ |
| 6-month chart | ✓ | ✓ |
| **CSV import** | — | **✓** |
| **12-month chart** | — | **✓** |
| **Per-category budgets** | — | **✓** |
| **PDF monthly report** | — | **✓** |
