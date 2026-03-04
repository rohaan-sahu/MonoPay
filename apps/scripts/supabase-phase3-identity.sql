-- MonoPay Phase 3: Wallet identity + tag provisioning schema
-- Run in Supabase SQL Editor (dev first).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  wallet_address text unique,
  monopay_tag text unique,
  metaplex_card_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monopay_tags (
  tag text primary key,
  wallet_address text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_identities (
  wallet_address text primary key,
  owner_user_id uuid references auth.users(id) on delete set null,
  display_name text,
  monopay_tag text not null,
  metaplex_card_id text not null,
  metaplex_card_status text not null default 'active' check (metaplex_card_status in ('active', 'deactivated')),
  metaplex_network text not null default 'solana-devnet' check (metaplex_network in ('solana-devnet', 'solana-testnet', 'solana-mainnet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wallet_identities_monopay_tag_key on public.wallet_identities(monopay_tag);

alter table public.profiles enable row level security;
alter table public.monopay_tags enable row level security;
alter table public.wallet_identities enable row level security;

-- Authenticated users can read public identity fields.
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated" on public.profiles
for select to authenticated using (true);

drop policy if exists "monopay_tags_read_authenticated" on public.monopay_tags;
create policy "monopay_tags_read_authenticated" on public.monopay_tags
for select to authenticated using (true);

drop policy if exists "wallet_identities_read_authenticated" on public.wallet_identities;
create policy "wallet_identities_read_authenticated" on public.wallet_identities
for select to authenticated using (true);

-- Users can manage their own rows.
drop policy if exists "profiles_self_write" on public.profiles;
create policy "profiles_self_write" on public.profiles
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "monopay_tags_self_write" on public.monopay_tags;
create policy "monopay_tags_self_write" on public.monopay_tags
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "wallet_identities_self_write" on public.wallet_identities;
create policy "wallet_identities_self_write" on public.wallet_identities
for all to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);
