-- MonoPay Phase 3: Payments ledger schema
-- Run in Supabase SQL Editor (dev first).

create extension if not exists pgcrypto;

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  client_reference text not null unique,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_wallet_address text not null,
  sender_handle text,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_wallet_address text not null,
  recipient_input text not null,
  recipient_normalized text not null,
  recipient_tag text,
  asset_symbol text not null,
  asset_mint text,
  amount_ui numeric(38, 12) not null,
  amount_raw text,
  memo text,
  rail text not null check (rail in ('sol_public', 'spl_public')),
  network text not null default 'solana-devnet' check (network in ('solana-devnet', 'solana-testnet', 'solana-mainnet')),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'confirmed', 'failed')),
  tx_signature text unique,
  explorer_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_intents_sender_wallet_idx on public.payment_intents(sender_wallet_address);
create index if not exists payment_intents_recipient_wallet_idx on public.payment_intents(recipient_wallet_address);
create index if not exists payment_intents_status_idx on public.payment_intents(status);
create index if not exists payment_intents_updated_at_idx on public.payment_intents(updated_at desc);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'submitted', 'confirmed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_intent_idx on public.payment_events(payment_intent_id);
create index if not exists payment_events_created_at_idx on public.payment_events(created_at desc);

alter table public.payment_intents enable row level security;
alter table public.payment_events enable row level security;

-- Reads: authenticated users (aligned with current profiles/tag read policies).
drop policy if exists "payment_intents_read_authenticated" on public.payment_intents;
create policy "payment_intents_read_authenticated" on public.payment_intents
for select to authenticated using (true);

drop policy if exists "payment_events_read_authenticated" on public.payment_events;
create policy "payment_events_read_authenticated" on public.payment_events
for select to authenticated using (true);

-- Writes: allow sender-owned rows, plus nullable sender_user_id for local/dev flows.
drop policy if exists "payment_intents_insert_authenticated" on public.payment_intents;
create policy "payment_intents_insert_authenticated" on public.payment_intents
for insert to authenticated
with check (sender_user_id is null or sender_user_id = auth.uid());

drop policy if exists "payment_intents_update_authenticated" on public.payment_intents;
create policy "payment_intents_update_authenticated" on public.payment_intents
for update to authenticated
using (sender_user_id is null or sender_user_id = auth.uid())
with check (sender_user_id is null or sender_user_id = auth.uid());

drop policy if exists "payment_events_insert_authenticated" on public.payment_events;
create policy "payment_events_insert_authenticated" on public.payment_events
for insert to authenticated
with check (
  exists (
    select 1
    from public.payment_intents pi
    where pi.id = payment_events.payment_intent_id
      and (pi.sender_user_id is null or pi.sender_user_id = auth.uid())
  )
);
