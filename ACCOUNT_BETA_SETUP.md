# PCCheck account beta setup

This branch adds Supabase email/password authentication and connects the Plus test checkout to the signed-in Supabase user.

## Before testing

1. In Supabase, open **Authentication → Providers → Email** and make sure Email sign-in is enabled.
2. Keep email confirmation enabled. Checkout rejects accounts whose email has not been confirmed.
3. In **Authentication → URL Configuration**, set the Site URL to:
   - `https://pccheck.vercel.app`
4. Add the exact preview URL you are testing as an allowed redirect URL. Vercel preview URLs can change after each deployment.
5. Confirm the existing Vercel **Production** environment has:
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
- Account deletion, report cloud sync, customer portal/cancellation, and complete data export are not implemented.
- The Stripe webhook destination and its signing secret still need a successful delivery test.
- Do not enable live Stripe keys or accept real payments.
- Have a parent/guardian review the privacy policy, terms, account lifecycle, and payment setup before broad public registration.
