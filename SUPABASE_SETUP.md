# Supabase subscription setup

This repository now includes the initial database schema and signed Stripe webhook receiver for PCCheck Plus.

## 1. Create the database table

In the Supabase dashboard for the PCCheck project, open **SQL Editor**, create a new query, paste the contents of `supabase/migrations/202611150001_subscriptions.sql`, and run it.

The table has row-level security enabled. Signed-in users can read only their own subscription row. Browser clients cannot write subscription state.

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

Copy the endpoint's signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.

## Important current limitation

This is only the database and webhook foundation. Checkout is not yet linked to a signed-in Supabase user, and Plus entitlement checks/customer portal are not complete. Do not switch to live Stripe mode or accept real payments until the remaining authentication, account-linked checkout, server-side entitlement, cancellation portal, and end-to-end tests are implemented and reviewed by the parent/account owner.


## Build Finder trial migration

Apply these migrations in order in the Supabase SQL Editor before using the Build Finder: `supabase/migrations/202611180001_build_finder_trials.sql`, then `supabase/migrations/202611180002_single_free_review.sql`. If migration 001 was already successfully applied earlier, do not rerun it; run migration 002 only.

The first migration creates an account-linked usage counter and a service-role-only atomic function. The second resets the old three-plan beta counter so each existing account receives one fresh full review under the new one-time allowance. Free accounts receive one full generated build review; Plus accounts are checked against the active Stripe-mode subscription and are not charged trial uses. The browser never sends a user ID to grant itself access.

The Build Finder requires the existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` Vercel environment variables. Keep service-role credentials server-side only. Live retailer pricing also requires `APISH_API_KEY` in Vercel Preview. Add it to Production only after the Preview flow is verified and the PR is approved for merge. Keep this key server-side; never paste it into chat or client code. API.SH currently includes 1,000 free credits monthly per account. A parent/guardian should create and manage the provider account, set a monthly key cap, and review its terms. PCCheck uses PCPartPicker product search/detail endpoints and requests fresh lookups only when a build review is generated. The migration does not activate live billing.
