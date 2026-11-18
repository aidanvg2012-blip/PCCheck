# Supabase subscription setup

This repository includes the Supabase account/subscription schema, signed Stripe webhook receiver, account-linked test checkout, server-side Plus entitlement checks, and Build Finder trial tracking.

## 1. Create the database table

In the Supabase dashboard for the PCCheck project, open **SQL Editor**, create a new query, paste the contents of `supabase/migrations/202611150001_subscriptions.sql`, and run it.

The table has row-level security enabled. Signed-in users can read only their own subscription row. Browser clients cannot write subscription state.

After the base table exists, run these migrations once, in order:

1. `supabase/migrations/202611160002_subscription_customer_index.sql` — allows a Stripe customer to have more than one subscription over time.
2. `supabase/migrations/202611170001_subscription_livemode.sql` — adds the `livemode` field used to keep test and live entitlements separate.

The second migration is required by the current Plus-status and Build Finder APIs. If it is missing, membership checks can return a database schema error.

## 2. Add server-only Vercel environment variables

In Vercel → PCCheck → Settings → Environment Variables, add these for **Production and Preview** as appropriate:

- `SUPABASE_URL`: the project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase secret/service-role key (never put this in browser code or GitHub)
- `STRIPE_WEBHOOK_SECRET`: signing secret created by the Stripe webhook endpoint

Do not put secret values in chat, source files, or GitHub.

## 3. Register the Stripe webhook (test mode)

In Stripe test mode, create a webhook endpoint:

`https://pccheck.vercel.app/api/stripe-webhook`

Subscribe to:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy the endpoint's signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.

## Current billing status

Account-linked checkout, server-side Plus entitlement checks, webhook synchronization, and the Stripe Billing Portal are implemented for testing. Keep `STRIPE_MODE=test` and use Stripe test credentials only. Do not enable live Stripe payments until the parent/account owner has reviewed the legal, privacy, tax, refund, cancellation, and support requirements and the complete live-mode flow has been tested. Browser checkout redirects alone never grant Plus; a verified webhook subscription record is required.


## Build Finder trial migration

Apply these migrations in the Supabase SQL Editor before using the free Build Finder trial: `supabase/migrations/202611180001_build_finder_trials.sql`, then `supabase/migrations/202611180002_single_free_review.sql`. If migration 001 was already successfully applied earlier, do not rerun it; run migration 002 only. If neither has been run, run 001 first and then 002.

The first migration creates an account-linked usage counter and a service-role-only atomic function. The second resets the old three-plan beta counter so each existing account receives one fresh full review under the new one-time allowance. Free accounts receive one full generated build review; Plus accounts are checked against the active Stripe-mode subscription and are not charged trial uses. The browser never sends a user ID to grant itself access.

The Build Finder requires the existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` Vercel environment variables. Keep service-role credentials server-side only. Live retailer pricing requires `APISH_API_KEY` in Vercel. Add it to Preview first, set a provider-side monthly usage cap, and test the live offers before adding it to Production. If the key is absent, Build Finder still creates a shortlist from weekly reference prices and does not consume the free live-price review. Keep this key server-side; never paste it into chat or client code. API.SH currently includes 1,000 free credits monthly per account. A parent/guardian should create and manage the provider account, set a monthly key cap, and review its terms. PCCheck uses PCPartPicker product search/detail endpoints and requests fresh lookups only when a build review is generated. These migrations do not activate live billing.
