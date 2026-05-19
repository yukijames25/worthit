-- worthit — Supabase schema
-- このファイル全体を Supabase ダッシュボードの "SQL Editor" にコピペして Run。
-- すべての文は冪等なので、すでに作成済みでも安全に再実行できます。
-- フェーズ2 のセクションを追加するときも、ここを丸ごと再実行すればOK。

-- =============================================================
-- Phase 1: transactions
-- =============================================================
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('income', 'expense')),
  amount        integer not null check (amount >= 0),
  category      text not null,
  memo          text not null default '',
  date          timestamptz not null default now(),
  satisfaction  text not null default 'neutral'
                check (satisfaction in ('good', 'bad', 'neutral')),
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions: select own"   on public.transactions;
drop policy if exists "transactions: insert own"   on public.transactions;
drop policy if exists "transactions: update own"   on public.transactions;
drop policy if exists "transactions: delete own"   on public.transactions;

create policy "transactions: select own"
  on public.transactions for select
  using (auth.uid() = user_id);
create policy "transactions: insert own"
  on public.transactions for insert
  with check (auth.uid() = user_id);
create policy "transactions: update own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Phase 2: categories (ユーザー定義カテゴリ)
-- =============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  emoji       text not null default '🏷️',
  color       text not null default '#A66BFF',
  kind        text not null default 'other'
              check (kind in ('dining','daily','social','self_investment',
                              'hobby','impulse','utility','income','other')),
  created_at  timestamptz not null default now(),
  -- ラベル単位で1ユーザー1件まで (デフォルトを上書きも、新規追加も同じ管理)
  unique (user_id, label)
);

alter table public.categories enable row level security;

drop policy if exists "categories: select own" on public.categories;
drop policy if exists "categories: insert own" on public.categories;
drop policy if exists "categories: update own" on public.categories;
drop policy if exists "categories: delete own" on public.categories;

create policy "categories: select own"
  on public.categories for select
  using (auth.uid() = user_id);
create policy "categories: insert own"
  on public.categories for insert
  with check (auth.uid() = user_id);
create policy "categories: update own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "categories: delete own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Phase 2: recurring_rules (定期取引)
-- =============================================================
create table if not exists public.recurring_rules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('income', 'expense')),
  amount        integer not null check (amount >= 0),
  category      text not null,
  memo          text not null default '',
  day_of_month  integer not null check (day_of_month between 1 and 31),
  active        boolean not null default true,
  last_run      timestamptz,
  next_due      timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists recurring_rules_user_idx
  on public.recurring_rules (user_id, next_due);

alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_rules: select own" on public.recurring_rules;
drop policy if exists "recurring_rules: insert own" on public.recurring_rules;
drop policy if exists "recurring_rules: update own" on public.recurring_rules;
drop policy if exists "recurring_rules: delete own" on public.recurring_rules;

create policy "recurring_rules: select own"
  on public.recurring_rules for select
  using (auth.uid() = user_id);
create policy "recurring_rules: insert own"
  on public.recurring_rules for insert
  with check (auth.uid() = user_id);
create policy "recurring_rules: update own"
  on public.recurring_rules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "recurring_rules: delete own"
  on public.recurring_rules for delete
  using (auth.uid() = user_id);
