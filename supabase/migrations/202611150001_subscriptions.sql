-- PCCheck subscription foundation
-- Run this in Supabase SQL Editor. The service-role key must stay server-side.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

-- Signed-in users can read only their own subscription state.
drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No client insert/update/delete policies: only trusted server code using
-- the Supabase service-role key can write subscription records.
