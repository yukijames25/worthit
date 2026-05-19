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

-- =============================================================
-- Phase 6: subscriptions (Stripe)
-- =============================================================
-- Stripe Webhook が service_role でアップサートする。クライアントは自分の行を読むだけ。
create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text not null default 'inactive',
              -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'inactive'
  plan                    text not null default 'free', -- 'free' | 'pro'
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: select own" on public.subscriptions;

-- 読み取りのみクライアントに許可。書き込みは service_role (Webhook) のみ。
create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- =============================================================
-- Phase 7 (F1): Receipt image attachments
-- =============================================================
-- 1) transactions に image_path 列を追加
alter table public.transactions
  add column if not exists image_path text;

-- 2) Storage bucket `receipts` の作成 (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- 3) Storage RLS — 自分のフォルダ ({user_id}/...) しかアクセスできない
drop policy if exists "receipts: upload own"  on storage.objects;
drop policy if exists "receipts: read own"    on storage.objects;
drop policy if exists "receipts: delete own"  on storage.objects;
drop policy if exists "receipts: update own"  on storage.objects;

create policy "receipts: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts: read own"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts: update own"
  on storage.objects for update
  using (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================
-- Phase 8 (F3): Household sharing
-- =============================================================
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table if not exists public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_invitations (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  token         text not null unique,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  used_at       timestamptz,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz default now()
);

-- transactions に household_id を追加 (idempotent)
alter table public.transactions
  add column if not exists household_id uuid references public.households(id) on delete cascade;
create index if not exists tx_household_idx on public.transactions (household_id, date desc);

-- =============================================================
-- RLS for households / members / invitations
-- =============================================================
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;

drop policy if exists "households: select if member" on public.households;
drop policy if exists "households: insert as owner" on public.households;
drop policy if exists "households: update if owner" on public.households;
drop policy if exists "households: delete if owner" on public.households;

create policy "households: select if member"
  on public.households for select
  using (
    id IN (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );
create policy "households: insert as owner"
  on public.households for insert
  with check (auth.uid() = owner_id);
create policy "households: update if owner"
  on public.households for update
  using (auth.uid() = owner_id);
create policy "households: delete if owner"
  on public.households for delete
  using (auth.uid() = owner_id);

drop policy if exists "members: select if same household" on public.household_members;
drop policy if exists "members: insert self only" on public.household_members;
drop policy if exists "members: delete self only" on public.household_members;

create policy "members: select if same household"
  on public.household_members for select
  using (
    household_id IN (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );
-- メンバー追加は service_role 経由のみ (invite フロー)。
-- 自分自身の脱退はクライアントから可能。
create policy "members: delete self only"
  on public.household_members for delete
  using (user_id = auth.uid());

drop policy if exists "invitations: select own" on public.household_invitations;
create policy "invitations: select own"
  on public.household_invitations for select
  using (auth.uid() = created_by);
-- invitation の insert / update は service_role からのみ。

-- =============================================================
-- transactions RLS を Household 対応に書き換え
-- =============================================================
drop policy if exists "transactions: select own"   on public.transactions;
drop policy if exists "transactions: insert own"   on public.transactions;
drop policy if exists "transactions: update own"   on public.transactions;
drop policy if exists "transactions: delete own"   on public.transactions;
drop policy if exists "transactions: select own or household" on public.transactions;
drop policy if exists "transactions: update own or household" on public.transactions;

create policy "transactions: select own or household"
  on public.transactions for select
  using (
    auth.uid() = user_id
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

create policy "transactions: insert own"
  on public.transactions for insert
  with check (
    auth.uid() = user_id
    AND (
      household_id IS NULL
      OR household_id IN (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

-- 共同編集: 同じ世帯の他人の取引でも 👍👎 を付けられる
create policy "transactions: update own or household"
  on public.transactions for update
  using (
    auth.uid() = user_id
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

-- 削除は作者本人のみ
create policy "transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- =============================================================
-- receipts ストレージ: 家族メンバーも閲覧可能に
-- =============================================================
drop policy if exists "receipts: read own" on storage.objects;
drop policy if exists "receipts: read own or household" on storage.objects;
create policy "receipts: read own or household"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] IN (
        select user_id::text from public.household_members
        where household_id IN (
          select household_id from public.household_members where user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================
-- Phase 9 (F4): Notion auto-sync
-- =============================================================
create table if not exists public.notion_integrations (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  api_token    text not null,
  database_id  text not null,
  enabled      boolean default true,
  last_synced  timestamptz,
  last_error   text,
  created_at   timestamptz default now()
);

alter table public.notion_integrations enable row level security;

drop policy if exists "notion: select own" on public.notion_integrations;
drop policy if exists "notion: insert own" on public.notion_integrations;
drop policy if exists "notion: update own" on public.notion_integrations;
drop policy if exists "notion: delete own" on public.notion_integrations;

create policy "notion: select own"
  on public.notion_integrations for select
  using (auth.uid() = user_id);
create policy "notion: insert own"
  on public.notion_integrations for insert
  with check (auth.uid() = user_id);
create policy "notion: update own"
  on public.notion_integrations for update
  using (auth.uid() = user_id);
create policy "notion: delete own"
  on public.notion_integrations for delete
  using (auth.uid() = user_id);

-- =============================================================
-- Phase 10 (F5): AI Coach usage tracking
-- =============================================================
create table if not exists public.ai_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- "YYYY-MM" 形式の月キー。 月単位で集計するため
  month_key   text not null,
  count       integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage: select own" on public.ai_usage;
create policy "ai_usage: select own"
  on public.ai_usage for select
  using (auth.uid() = user_id);
-- insert / update は service_role (API) のみ
