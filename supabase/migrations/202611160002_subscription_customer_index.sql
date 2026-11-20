-- A Stripe customer may have more than one subscription over time.
-- Keep subscription IDs unique, but do not make customer IDs unique.
alter table public.subscriptions
  drop constraint if exists subscriptions_stripe_customer_id_key;

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions(stripe_customer_id);
