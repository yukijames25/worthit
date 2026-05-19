<div align="center">

# 🪙 worthit

**満足度から未来の買い物を最適化する家計簿**
*Optimize tomorrow's spending from yesterday's satisfaction.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-worthit--sigma.vercel.app-ff2e83?style=for-the-badge)](https://worthit-sigma.vercel.app)
[![Tests](https://img.shields.io/badge/tests-43%20passing-22c55e?style=for-the-badge)](./src/utils)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20Supabase-5b8def?style=for-the-badge)](#tech-stack)
[![Built with AI](https://img.shields.io/badge/Built%20with-Claude%20pair%20programming-A66BFF?style=for-the-badge)](./docs/AI_BUILD_PROCESS.md)

</div>

---

## 🎯 What it is

A budget app **rebuilt around purchase satisfaction**, not just totals.

Each expense gets a one-tap rating — **👍 I'm glad I bought this** or **👎 I wish I hadn't**. An advice engine then surfaces *"keep doing this"* and *"watch out for this"* categories specifically for you, and the personality diagnosis takes your fulfillment ratio into account.

A traditional household ledger asks **how much** you spent. worthit asks **whether it was worth it.**

## ✨ What's inside

| | |
|---|---|
| 🏦 **Bank-statement view** | Income and expenses on a single timeline, grouped by day. |
| 👍👎 **Inline satisfaction rating** | One-tap good / bad on every expense. No modal. |
| 🧭 **Satisfaction-driven advice** | Recommended spending vs warnings, ranked by net-good. |
| 🎭 **Personality diagnosis (5 types)** | Updated to weigh good/bad ratio. |
| 📅 **Monthly chart + budget tracker** | 6-month trend + projected overrun. |
| 🔄 **Recurring transactions** | Rent / subscriptions auto-log on app open. |
| 🏷️ **Custom categories** | Edit emoji, color, kind. Synced to cloud. |
| 📤 **CSV import / export** | Full round-trip with duplicate detection. |
| ☁️ **Cloud sync (Supabase)** | Google OAuth + Row Level Security. Works offline as PWA. |
| 🌗 **Dark / Light / System** | + small/medium/large font scaling. |
| 🌐 **i18n (ja / en)** | Auto-detected from browser, switchable in Settings. |
| 🔁 **Live update banner** | Polls for new deployments, prompts user to reload. |
| 🧪 **43 unit tests** | Pure functions: scoring, advice, period, CSV, recurring math. |
| 💳 **Stripe Pro tier (¥480/月)** | Checkout + Customer Portal + Webhook → Supabase sync. |
| 📄 **PDF reports (Pro)** | Client-side jsPDF + html2canvas, lazy-loaded so it costs zero on first load. |
| 📷 **Receipt images** | Compressed client-side, stored in Supabase Storage with RLS. Pro: unlimited, free: 3/mo. |
| 🧹 **Subscription declutter** | Audits your recurring rules against your satisfaction history. |
| 👨‍👩‍👧 **Household sharing (Pro)** | Invite family members via link; share transactions in real-time. |
| 📝 **Notion auto-sync (Pro)** | Every new transaction also appears in your Notion database. |
| 🤖 **AI Personal FP** | Groq (Llama 3.3) primary + Gemini Flash fallback. Free 3/mo, Pro unlimited. |

## 🚀 Try it

→ **[worthit-sigma.vercel.app](https://worthit-sigma.vercel.app)**

You can use it without an account (local-only mode), or sign in with Google to sync across devices. Click **"まずはサンプルデータで試してみる"** to seed a few weeks of fake data and see the advice engine in action.

> 📱 Add it to your phone's home screen for a native-feeling install (PWA).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  React 19 + Vite + TypeScript (strict)     │
│  Tailwind CSS · Recharts · Lucide icons    │
└─────────────────────────────────────────────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
┌──────▼───────┐         ┌──────────▼──────────┐
│ LocalStorage │         │ Supabase Postgres   │
│ (offline)    │         │ + Row Level Security│
└──────────────┘         │ + Google OAuth      │
                         └─────────────────────┘
                                  │
                            ┌─────▼──────┐
                            │ Vercel Edge│
                            │  + PWA SW  │
                            └────────────┘
```

Every component falls back to LocalStorage when Supabase env vars are missing — the app **never breaks** when you fork it. Sign-in is optional; cloud sync is opt-in.

Deep dive → [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## 🤖 How this was built

This entire app was built by **pairing with Claude (an AI coding assistant)** over a handful of focused sessions, while a human designer-developer drove the product direction.

That doesn't mean "prompted once and shipped." It means *thousands* of small judgment calls — scope cuts, naming, UX trade-offs, what to deepen vs ship — kept by the human, and the AI executed mechanical changes faster than typing them by hand.

The process is documented honestly in **[`docs/AI_BUILD_PROCESS.md`](./docs/AI_BUILD_PROCESS.md)**, including:
- Time-on-task per phase
- Which decisions came from human intuition vs AI synthesis
- Prompts that worked and prompts that didn't
- What I'd do differently next time

Key technical decisions are logged ADR-style in **[`docs/DECISIONS.md`](./docs/DECISIONS.md)**.

## 🧱 Tech stack

| Layer        | Choice                                                  | Why                                                                                  |
|--------------|---------------------------------------------------------|--------------------------------------------------------------------------------------|
| UI runtime   | **React 19** + **Vite**                                 | Fastest DX. Code splitting & lazy routes out of the box.                            |
| Language     | **TypeScript** (strict, `noUnusedLocals`, etc.)         | Catches the 80% of bugs that would surface in user testing.                          |
| Styling      | **Tailwind 3** (`dark:` class strategy)                 | Single source of truth for theming; dark mode without context-pumping.              |
| State        | React **Context** (Settings · Auth · Categories) + hooks | No Redux. The data is too small to justify it.                                       |
| Backend      | **Supabase** (Postgres + Auth + RLS)                    | Auth, DB, and RLS in one — chose this over Firebase for SQL familiarity.            |
| Charts       | **Recharts** (lazy-loaded)                              | Lazy import keeps initial bundle ~260 KB.                                            |
| PWA          | **vite-plugin-pwa** (Workbox)                            | Offline shell + auto-update.                                                         |
| Testing      | **Vitest** (43 unit tests)                              | Same toolchain as Vite; ESM-first; fast.                                             |
| Hosting      | **Vercel** (auto-deploy from `git push`)                | Free tier, instant cache invalidation, preview URLs.                                 |

## 🧠 What's interesting in the code

A few spots worth a read:

- [`src/utils/scoring.ts`](./src/utils/scoring.ts) — 5-axis personality scoring, with entropy-based "balanced" axis and good/bad ratio injected as a 6th axis (`fulfilled`). Full coverage of all 5 types in [`scoring.test.ts`](./src/utils/scoring.test.ts).
- [`src/hooks/useTransactions.ts`](./src/hooks/useTransactions.ts) — Optimistic-UI hook that transparently switches between Supabase and LocalStorage, with one-time migration when a local user signs in.
- [`src/hooks/useRecurring.ts`](./src/hooks/useRecurring.ts) — Monthly recurring rules with retroactive catch-up (max 3 months) and day-of-month edge cases (Feb 30 → Feb 28).
- [`src/context/CategoriesContext.tsx`](./src/context/CategoriesContext.tsx) — Default + user-customized categories merged with override-by-label semantics. Pure `getCategoryMeta` accepts an optional customs map so [`diagnose()`](./src/utils/scoring.ts) stays a pure function.
- [`src/hooks/useUpdateChecker.ts`](./src/hooks/useUpdateChecker.ts) — Polls `/index.html` every 5 min, compares the JS bundle filename, and pops a "new version available" banner without a service worker push.

## 🛠️ Running locally

```bash
git clone https://github.com/yukijames25/worthit.git
cd worthit
npm install
npm run dev
```

That's it — opens at `http://localhost:5173` in **LocalStorage-only mode**.

To enable cloud sync (optional):

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key
```

Then run [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL Editor and add Google OAuth in Authentication → Providers. Full walkthrough below.

### Other commands

```bash
npm test        # Run vitest (43 tests)
npm run build   # Production build (tsc + vite build + PWA precache)
npm run lint    # ESLint
```

## 🗂️ Project layout

```
src/
├── App.tsx                  # Shell + screen routing + auth gating
├── components/              # All UI components (no headless lib)
│   ├── StatementScreen.tsx  # Bank-statement-style transaction list
│   ├── AdviceScreen.tsx     # Recommendations + monthly chart
│   ├── ResultScreen.tsx     # Personality diagnosis
│   ├── SettingsScreen.tsx   # Account, theme, font, language, budget, data
│   ├── InputSheet.tsx       # Bottom-sheet add transaction modal
│   ├── CategoryManager.tsx  # User category editor (sheet)
│   ├── RecurringManager.tsx # Recurring rules editor (sheet)
│   ├── ImportPrompt.tsx     # CSV import confirmation
│   ├── MigrationPrompt.tsx  # First-login LocalStorage→cloud
│   └── UpdateBanner.tsx     # New version available
├── context/
│   ├── SettingsContext.tsx  # theme, fontScale, locale
│   ├── AuthContext.tsx      # Supabase session, Google sign-in
│   └── CategoriesContext.tsx# Defaults + customs, with getMeta
├── hooks/
│   ├── useTransactions.ts   # CRUD + Supabase sync + LocalStorage fallback
│   ├── useRecurring.ts      # Monthly auto-log scheduling
│   ├── useBudget.ts         # Monthly budget (LocalStorage)
│   └── useUpdateChecker.ts  # Polls for new deployments
├── i18n/
│   ├── translations.ts      # ja + en string tables
│   └── useTranslation.ts
├── lib/
│   └── supabase.ts          # Singleton client (null if env missing)
├── utils/
│   ├── scoring.ts           # Personality diagnosis (pure)
│   ├── advice.ts            # Category insights + recommendations
│   ├── period.ts            # Month boundaries + aggregation
│   ├── csv.ts               # Export + parse + dedup
│   ├── categories.ts        # Default presets + hash-based fallback
│   ├── personalities.ts     # Type definitions for the 5 archetypes
│   └── format.ts            # ¥ formatter, relative time, date keys
└── types/index.ts           # Core domain types
```

## 🗺️ Roadmap

| Phase | Status | Highlights |
|------:|--------|-----------|
| 1 | ✅ Shipped | Concept rebuild, dark mode, font scale, bank statement UI |
| 2 | ✅ Shipped | Supabase cloud sync, Google OAuth, migration prompt |
| 3 | ✅ Shipped | Monthly chart, budget tracker, CSV export, code splitting |
| 4 | ✅ Shipped | Custom categories, CSV import, recurring transactions, vitest |
| 5 | ✅ Shipped | PWA offline, i18n (ja/en), update banner, diagnosis verification |
| 6 | ✅ Shipped | **Stripe Pro tier (¥480/月)**, per-category budgets, 12-month chart, PDF reports |
| 7 | ✅ Shipped | **Receipt images** + **Subscription declutter** + tighter free-tier caps |
| 8 | ✅ Shipped | **Household sharing** (RLS rewrite) + **Notion auto-sync** |
| 9 | ✅ Shipped | **AI Personal FP** (Groq + Gemini, free 3/mo) |
| ∞ | 💭 Maybe | Plaid bank link, voice input, recurring auto-classification |

## 📜 License

MIT. Use it, fork it, learn from it.

---

<div align="center">
Built by <a href="https://github.com/yukijames25">@yukijames25</a> · paired with <a href="https://claude.com/code">Claude Code</a>
</div>
