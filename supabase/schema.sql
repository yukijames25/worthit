-- worthit — Supabase schema
-- 1. Supabase ダッシュボードの "SQL Editor" にこのファイル全体を貼り付けて Run。
-- 2. 既存テーブルが無いことを前提にしているので、再実行時は冪等。

-- =============================================================
-- transactions テーブル
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

-- ユーザーごと・日付降順での読み取りが多いのでインデックス
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- =============================================================
-- Row Level Security — 自分の行しか触れないように
-- =============================================================
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
