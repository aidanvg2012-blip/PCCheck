# PCCheck account beta setup

This branch adds Supabase email/password authentication and connects the Plus test checkout to the signed-in Supabase user.

## Before testing

1. In Supabase, open **Authentication → Providers → Email** and make sure Email sign-in is enabled.
2. Keep email confirmation enabled. Checkout rejects accounts whose email has not been confirmed.
3. In **Authentication → URL Configuration**, set the Site URL to:
   - `https://pccheck.vercel.app`
4. Add the preview redirect pattern `https://*.vercel.app/**` as an allowed redirect URL, or add the exact preview URL you are testing. Vercel preview URLs can change after each deployment.
5. In Supabase SQL Editor, run the additional migration in `supabase/migrations/202611160002_subscription_customer_index.sql`. It removes the unique constraint on Stripe customer IDs so one customer can have multiple subscriptions over time.
6. In Stripe **test mode**, configure the Billing Portal to allow customers to view invoices and update/cancel subscriptions as appropriate. Keep the portal in test mode.
7. Add the same test-mode variables to Vercel **Preview** (not only Production) so the preview can call the backend. Confirm the existing Vercel **Production** environment has:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (must remain `sk_test_`)
   - `STRIPE_TEST_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `PCCHECK_APP_URL`

The browser-side Supabase publishable key in `auth.js` is intended to be public. Never put the service-role key or Stripe secret key in browser code, GitHub, or chat.

## Test flow (after parent/guardian review)

1. Open the preview deployment and create a test account using an email inbox you control.
2. Follow the Supabase confirmation email.
3. Sign in and confirm the account modal shows a Free account.
4. Test checkout only with Stripe test data. The checkout request must include the signed-in session; the server verifies the user with Supabase before creating a Stripe Checkout Session.
5. The Checkout Session and subscription metadata include the verified `supabase_user_id`. The existing signed webhook uses that metadata to write the subscription record.
6. After Stripe delivers a valid subscription event, reopen the account modal. Plus should appear only if the stored subscription status is `active` or `trialing`.

## Current limitations

- This is a beta foundation, not a public-ready account or payment system.
- Vercel Preview environment variables are not configured by this change; Preview API requests can return a configuration error. Production variables are separate.
- Account deletion, report cloud sync, and complete data export are not implemented. A test-mode customer portal endpoint is included, but it cannot work until the Stripe test Billing Portal is configured and the webhook has linked a customer.
- The Stripe webhook destination and its signing secret still need a successful delivery test.
- Do not enable live Stripe keys or accept real payments. The endpoint code explicitly rejects live Stripe secret keys.
- Have a parent/guardian review the privacy policy, terms, account lifecycle, and payment setup before broad public registration.
