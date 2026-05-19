# Decision log

Lightweight Architecture Decision Records (ADRs). Each entry: **what we decided**, **why**, **what we gave up**.

For background context on the build process behind these decisions, see [`AI_BUILD_PROCESS.md`](./AI_BUILD_PROCESS.md).

---

## ADR-001 · Pivot the core concept to "satisfaction-driven optimization"

**Context.** The starting prototype was a generic Japanese household-budget app with a personality diagnosis tacked on the end. It looked OK but wasn't *about* anything you couldn't get from a thousand other apps.

**Decision.** Rebuild around a single new question — *"was the purchase worth it?"* — exposed as a one-tap 👍 / 👎 rating on every expense.

**Consequences.**
- ✅ Gives the personality diagnosis real signal (fulfillment, not just category share).
- ✅ Enables an "advice engine" — recommend categories users actually rate positively, warn on regret-heavy ones.
- ⚠️ Requires user discipline (need ratings to surface advice). Mitigated by displaying neutral-state copy and only ranking when ≥1 rating exists.
- ⚠️ Loses any "import bank CSV automatically" appeal — this is a *journaling* tool, not a *tracking* tool.

---

## ADR-002 · Supabase, not Firebase

**Context.** Need backing store + auth + multi-device sync, with minimal ops overhead.

**Decision.** Supabase (PostgreSQL + Auth + RLS) over Firebase (Firestore).

**Consequences.**
- ✅ SQL is familiar; RLS is declarative and audit-friendly.
- ✅ Free tier is generous (500 MB DB, 50K MAU) for a personal-scale app.
- ✅ Standard JSON API; no proprietary SDK lock-in for the data layer.
- ⚠️ No real-time sync out of the box (would need a `subscribe()` channel). For personal use, polling on app open is enough.
- ⚠️ Cold starts on the free tier can spike to 1-2s when the DB has been idle. Hasn't been a problem in practice.

---

## ADR-003 · Optional cloud — never gate the app

**Context.** The app should be reviewable / forkable without a Supabase account.

**Decision.** All hooks/components transparently fall back to LocalStorage when `VITE_SUPABASE_URL` is not set. The Supabase singleton resolves to `null`, `isCloudEnabled` becomes `false`, and the rest of the app handles it.

**Consequences.**
- ✅ The Vercel-deployed demo works in "local mode" if cloud env vars are misconfigured.
- ✅ Cloning the repo and running `npm run dev` gives an immediately working app.
- ⚠️ Every hook has two code paths. The branching adds complexity — but it's contained in `useTransactions`, `useCategories`, `useRecurring` (and gated by `cloudReady` refs to avoid stale-closure bugs).

---

## ADR-004 · React Context over Redux/Zustand

**Context.** State to manage: theme, font, locale, auth session, custom categories, transactions, budget, recurring rules.

**Decision.** Three Contexts (`Settings`, `Auth`, `Categories`) — the only state needed app-wide. Transactions / budget / recurring stay as `useState` inside `<Shell>` because no other tree needs them.

**Consequences.**
- ✅ Almost zero boilerplate. No reducer / selector / typed-action machinery.
- ✅ Each context is a small, readable file (~150 lines each).
- ⚠️ No time-travel debugging. Doesn't matter here.

---

## ADR-005 · Optimistic UI with fire-and-forget cloud writes

**Context.** Network latency to Supabase is 100-500ms. Blocking the UI on every save is wrong.

**Decision.** All mutations update local state immediately and dispatch the cloud write asynchronously. On error, set `error` on the hook (non-blocking), keep the optimistic state.

**Consequences.**
- ✅ The UI never feels laggy.
- ✅ Works seamlessly when network is briefly flaky.
- ⚠️ If a cloud write fails permanently, the user won't notice unless they refresh. Acceptable for a personal-scale app; would be wrong for a multi-user collaborative one.
- ⚠️ No write queue when offline → if you're signed-in but offline, the local data drifts from cloud. Mitigated because PWA shell keeps the app usable, and signed-out users go through the LocalStorage path anyway.

---

## ADR-006 · Pure scoring function with an optional `customs` parameter

**Context.** Custom user categories can override the `kind` (which axes a category counts toward). Putting category lookup inside `diagnose()` would either (a) make it depend on React Context (breaks testability) or (b) hard-code a global registry (breaks the multi-user model).

**Decision.** Keep `diagnose(transactions, customs?)` pure. Components that have `CategoriesContext` available pass `customsMap` from `useCategories()`. Tests pass it directly with no React tree.

**Consequences.**
- ✅ `scoring.ts` is trivially testable. 17 of the 43 tests live in `scoring.test.ts`.
- ✅ Same function works in any environment (server-side renderable in the future).
- ⚠️ Slight ergonomic cost — caller must remember to pass `customsMap`. Not a problem in practice; there's exactly one caller in the app.

---

## ADR-007 · Lazy-load heavy screens to halve initial bundle

**Context.** First load on a mobile network matters. The initial bundle was ~560 KB gzipped — Recharts (107 KB gzipped on its own) dominated.

**Decision.** `React.lazy(() => import(...))` for `AdviceScreen`, `ResultScreen`, `SettingsScreen`. Wrap with `<Suspense>` and a tiny fallback.

**Consequences.**
- ✅ Initial bundle dropped to ~92 KB gzipped.
- ✅ Recharts only loads when the user opens "Advice" — most first-time visitors stay on "Statement."
- ⚠️ ~50 ms perceived delay when switching to "Advice" on slow networks. Mitigated by a friendly fallback spinner.

---

## ADR-008 · 5-min poll for new versions, no service-worker push

**Context.** When a user has the tab open for hours and I push a new version, they're stuck on the stale JS bundle until they reload.

**Decision.** A `useUpdateChecker` hook fetches `/index.html` every 5 minutes (and on tab focus), parses the script src, and compares to the bundle filename that was current when the page loaded. On mismatch, show a banner with a "更新する" button that calls `location.reload()`.

**Consequences.**
- ✅ Zero infrastructure required — just a periodic fetch.
- ✅ No silent reloads. User stays in control.
- ⚠️ A user idle for >5 min between deploys will see the banner with a few-minute lag. Fine.
- ⚠️ Tiny request cost (~1-2 KB every 5 min). Negligible.

---

## ADR-009 · Skip push notifications & real-time sync

**Context.** Both featured on the wishlist. Both involve weeks of work and ongoing infra cost.

**Decision.** Defer indefinitely.
- **Push notifications:** Need VAPID keys, a server endpoint to send push, Supabase Edge Functions for scheduling, and tolerate iOS Safari's strict "must be installed first" rule. Total ROI for a personal-scale app: low.
- **Real-time sync:** Would need a Supabase Realtime channel per user. Adds connection overhead. Last-write-wins is fine when there's exactly one user.

**Consequences.**
- ✅ The build stayed shippable.
- ✅ Hosting cost stays at $0.
- ⚠️ No "you haven't logged today" reminders. Workaround: PWA → home-screen icon → user opens manually.

---

## ADR-010 · Honest scope on i18n migration

**Context.** Once I had `ja` and `en` translations infrastructure, I had to decide how much existing text to migrate. Migrating *everything* (personality descriptions, advice copy, category labels) would have been hundreds of additional strings.

**Decision.** Migrate the **navigational and operational** strings (titles, buttons, settings labels, login screen). Defer the **narrative** content (advice text, personality descriptions) — these stay Japanese-only for now and a future phase can migrate them.

**Consequences.**
- ✅ Language picker visibly works and the app feels bilingual.
- ✅ Phase 3 finished within a sane time window.
- ⚠️ A user switching to English will see English UI with Japanese advice paragraphs. Documented in [`AI_BUILD_PROCESS.md`](./AI_BUILD_PROCESS.md) as a known limitation.

---

## ADR-011 · Tests cover pure functions only

**Context.** Component testing in React requires JSDOM + Testing Library setup, mock providers, and writing brittle "find the button, click it, assert text" specs.

**Decision.** Vitest tests only cover pure modules: `scoring.ts`, `advice.ts`, `period.ts`, `csv.ts`, `useRecurring.ts` math. Component behavior is verified manually.

**Consequences.**
- ✅ 43 tests run in ~1.5 seconds. No flakiness.
- ✅ Tests focus on the part of the code that's least obvious — the math — and avoid the part that's most likely to change (UI).
- ⚠️ A UI regression won't fail CI. Mitigated by exercising the app manually after each deploy.

---

If you read this list and disagree with any of the trade-offs, that's the whole point — these are the bets I made, and I want them visible.
