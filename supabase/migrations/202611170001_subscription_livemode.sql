-- Keep test and live Stripe subscriptions isolated for entitlements and billing portal lookups.
alter table public.subscriptions
  add column if not exists livemode boolean not null default false;

create index if not exists subscriptions_user_livemode_updated_idx
  on public.subscriptions (user_id, livemode, updated_at desc);
