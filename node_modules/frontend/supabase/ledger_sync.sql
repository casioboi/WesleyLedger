-- Run in Supabase SQL editor after creating a project.
-- Stores one JSON snapshot per user for offline-first sync (new device = sign in + pull).

create table if not exists public.user_ledger_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_ledger_data_updated_at_idx
  on public.user_ledger_data (updated_at desc);

alter table public.user_ledger_data enable row level security;

create policy "user_ledger_data_select_own"
  on public.user_ledger_data for select
  using (auth.uid() = user_id);

create policy "user_ledger_data_insert_own"
  on public.user_ledger_data for insert
  with check (auth.uid() = user_id);

create policy "user_ledger_data_update_own"
  on public.user_ledger_data for update
  using (auth.uid() = user_id);
