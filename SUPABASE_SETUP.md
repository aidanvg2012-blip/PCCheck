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
