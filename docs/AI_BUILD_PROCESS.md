# How worthit was built — AI pair programming, transparently

This document is the part of the portfolio I care about most: **honesty about the process**.

worthit was built by pairing with **Claude Code** (Anthropic's coding assistant), with me (a human) holding the product direction and judgment, and the AI executing changes faster than I could type them by hand.

This is not a "AI built it, look how easy" story. It's also not a "I wrote every line myself" story. It's *what actually happened*, told in enough detail that you can judge the skill on display.

---

## TL;DR

- **~6 sessions across a few days** of focused work, building from a barebones household-budget prototype into a production app with cloud sync, offline support, i18n, recurring transactions, and 43 unit tests.
- **Every architectural decision** (concept pivot, data model, scoring formula, auth flow, screen IR, what to defer) was made by me. Claude executed.
- **The hard part was scoping**, not coding. Saying *"no, defer push notifications, do PWA first"* mattered more than typing speed.
- **Read the code, don't trust the marketing.** [`src/utils/scoring.ts`](../src/utils/scoring.ts), [`src/hooks/useTransactions.ts`](../src/hooks/useTransactions.ts) and the 43-test suite reflect the actual standard.

---

## The build, phase by phase

> 📅 All timestamps relative — the actual span was a few days of evening sessions, not contiguous hours.

### Phase 0 — Starting point
The project began as a small "household-budget personality diagnosis" prototype: ~6 fixed categories, no cloud, single screen. Working but limited.

### Phase 1 — Concept rebuild
**Human decision:** Pivot the product from "category breakdown" to **"satisfaction-based optimization."** This was the biggest call of the project — everything downstream flows from it. Added 👍👎 ratings per expense, satisfaction-weighted scoring, dark mode, font scaling, bank-statement UI.

What worked: framing the new core concept as a single paragraph and asking the AI to derive the data-model implications. That generated the `Satisfaction` enum + the `customs` map idea, both of which I kept.

### Phase 2 — Ship it
GitHub repository created, pushed, deployed to Vercel. The whole flow worked first try — Vite's defaults + Vercel's auto-detection meant the AI only had to give me the right `gh repo create` and `vercel import` recipe.

### Phase 3 — Cloud sync
**Human decision:** Supabase over Firebase (SQL familiarity, generous free tier, RLS by default). Google OAuth over magic link (simplest UX for me).

The plumbing was substantial — `AuthContext`, `LoginScreen`, refactor `useTransactions` to be dual-mode (LocalStorage when unauthed, Supabase when authed), migration prompt when a local user signs in for the first time. Claude wrote the boilerplate; I checked every RLS policy by hand and ran the SQL myself.

What didn't work the first time: I forgot to add `worthit-sigma.vercel.app/**` to Supabase's Redirect URLs. Took 10 minutes to spot. The AI couldn't see my browser, so it couldn't have caught this — but once I pasted the error message, it knew exactly which menu to open.

### Phase 4 — Phase 1 of "next steps"
Monthly chart, budget tracker, CSV export, code splitting. The code-splitting refactor (lazy-loading AdviceScreen + ResultScreen via `React.lazy`) cut the initial bundle by ~45%. AI-suggested optimization that I almost said no to — glad I didn't.

### Phase 5 — Phase 2 of "next steps"
Custom categories with cloud sync, CSV import, recurring transactions, Vitest setup. This was the densest session (~2,900 line diff). The hard part: keeping all four features cleanly orthogonal so they didn't collide. The `getCategoryMeta(label, customs?)` signature — where `customs` is an optional override map — let me move category logic into context without making `scoring.ts` impure.

### Phase 6 — Phase 3 of "next steps"
PWA offline support (vite-plugin-pwa), i18n (ja + en), diagnosis verification, UI fix on budget input button. Skipped push notifications and OAuth verification (called out explicitly as out-of-scope; both are weeks of work for marginal gain).

This is the phase I'm proudest of: **I noticed a small UI overflow** on the budget input at large font sizes, asked for a fix, and **then also asked the AI to verify all 5 personality types worked** before moving on. Both small in code, big in attention-to-detail signal.

---

## What the AI was good at

| Task | Why |
|---|---|
| Boilerplate React + Context | Identical to thousands of training-set examples. Near-zero error rate. |
| Tailwind class composition | Vast surface area, hard to type from memory. AI suggests sane combos faster than docs lookup. |
| SQL + RLS policies | Idempotent migrations + `auth.uid()` patterns are well-trodden. |
| TypeScript narrowing & union types | The AI catches discriminated-union edge cases I'd miss. |
| Test scaffolding | "Write 5 vitest cases for `diagnose()` covering each personality type" → got a usable first draft in seconds. |
| Translating English UI → Japanese & vice versa | The translation file has ~130 keys × 2 locales. Tedious by hand. |
| Diffing my intent against existing code | "Here's the file, change X to Y" is faster than locating & editing manually. |

## What the AI was *not* good at

Listed honestly, because it matters:

- **Naming things.** Many of its first-pass names (`PROCESS.md`, `manageCategoriesSheet`, `BudgetInputControl`) were OK-but-not-great. I renamed a lot.
- **Knowing when to stop.** It will happily generate a 10-feature roadmap when I asked for 3. **Scope discipline came from me, not it.** Asking it explicitly to "split into phases and let me choose" worked well; trusting it to keep its own scope didn't.
- **Aesthetic judgment.** Whether an animation feels right, whether a card looks too noisy, whether a 13px label is too small — I had to drive these myself by actually using the app.
- **Spotting product-level issues.** It built a perfectly correct "log out" button without questioning whether the LocalStorage data should also be cleared. (We decided yes, eventually.)
- **Reading my screen.** Errors I couldn't paste it couldn't see. I had to be the eyes.
- **Knowing this codebase's invariants without me telling them.** It once tried to use `getCategoryMeta()` from a pure scoring function before I established the `customs` parameter convention. Re-establishing the rule once was enough.

## Tools used

- **Editor:** VS Code
- **AI:** Claude Code (Anthropic CLI) — model-level decisions and execution
- **Diff review:** I read every diff before accepting it. This is the *non-negotiable* part of vibe coding.
- **Dev loop:** `npm run dev` (HMR), `npx tsc -p tsconfig.app.json --noEmit` after each step, `npm test` before each commit.

## Prompting style that worked

What I noticed produced the best output:

- **Brief over verbose.** "Cloud sync + Google OAuth, Supabase. Make Statement screen optimistic" beats a 3-paragraph spec.
- **State the trade-off.** "Prefer simplicity over robustness here" gave the AI a yardstick to make sub-decisions with.
- **Tell it what to skip.** "Don't add push notifications now; out of scope for this session." Without this, scope creeps every time.
- **Critique the output specifically.** "The budget save button overflows at font:大. Fix that, then also verify all 5 personality types still classify correctly." Targeted feedback >> "improve everything."

## What this project shows about *me*

Not the AI:

- **I can take a 1-screen prototype and turn it into a multi-screen, cloud-synced, internationalized PWA with 43 tests in a handful of sessions.** Most of that velocity comes from knowing what to skip.
- **I can read code I didn't fully type, judge whether it's correct, and refuse a diff that's not.** This is the actual skill that matters for an AI-augmented workflow.
- **I can decompose a vague aspiration ("add monetization") into a phased plan with explicit non-goals.** Look at how every phase summary spells out *what was deferred*.
- **I care about evidence over claims.** Hence: 43 tests, ADR-style decision log, this honest doc.

## What I'd do differently next time

- **Write a sketch of the data model on paper before the first prompt.** I refactored the `Transaction` shape twice; the second refactor (renaming `expenses` → `transactions`, adding income) cost ~30 minutes of mechanical work I could have skipped.
- **Set up Vitest in week 1**, not week 5. Tests would have caught the scoring-axis bug where `kindOf()` didn't accept custom overrides until I added the parameter.
- **Pre-commit hook running `tsc --noEmit` and `vitest run`.** I would have caught two type errors before they landed in `main`.
- **Take screenshots progressively.** I have a few good shots of the final state, but the *visible* progression — Phase 1 vs Phase 5 — would have been useful for the portfolio.

---

If you're reviewing this for hiring purposes, the honest pitch is: **I'm fast because I trust the tool and verify the output, not because I claim AI built it for me.** That's the workflow that wins in 2026, and I've put the receipts on GitHub.

— [@yukijames25](https://github.com/yukijames25)
