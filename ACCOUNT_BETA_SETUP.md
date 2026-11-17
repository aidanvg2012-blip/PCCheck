# PCCheck account and billing beta test

This is a test-only beta. It is not ready to accept real payments.

## Safe setup

1. Use the Vercel Preview deployment for this branch, not the public production URL.
2. Keep Stripe in test mode. Never add a live key to Preview or Production.
3. Confirm the Supabase Preview environment values are configured in Vercel. Do not share secret values in chat.
4. In Stripe test mode, configure the Billing Portal to allow viewing invoices and cancelling subscriptions. Leave payment-method updates disabled unless a parent/guardian has reviewed the flow.
5. In Stripe test mode, configure the webhook endpoint to receive:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. The webhook URL should be the endpoint assigned to this environment. Production's existing endpoint is `https://pccheck.vercel.app/api/stripe-webhook`; use the Preview URL for a separate Preview webhook and its own signing secret if testing Preview callbacks directly.
7. Run `node --test tests/stripe-webhook.test.js` locally before merging code.

## Manual test sequence

- [ ] Create an account with an email address you control; confirm the email and sign in.
- [ ] Open Account and verify the initial status is Free.
- [ ] Open Plus preview and start a test checkout. Use Stripe's documented test card details only; never use a real card.
- [ ] Complete checkout and wait for the webhook. Refresh Account; it should show Plus only after the subscription row is stored.
- [ ] Open Manage subscription. Confirm the Stripe test Billing Portal loads and displays the test subscription.
- [ ] Cancel from the portal. If configured for end-of-period cancellation, Plus should remain active until the period ends and the status should show cancellation scheduled.
- [ ] Use Stripe's test subscription simulation/test clock to advance through renewal and cancellation. Confirm the webhook updates Supabase and the app reflects the latest state.
- [ ] Test a failed renewal in a separate test customer/subscription. Confirm Stripe sends `invoice.payment_failed`, the webhook retrieves the subscription's latest state, and Plus is not granted when the subscription becomes `past_due`.
- [ ] Restore a successful test payment if testing recovery; confirm the subscription returns to `active` and Plus returns.
- [ ] Sign out and confirm the account modal returns to the signed-out state.

## What these tests do not prove

A test clock and successful webhook delivery are useful integration checks, but they do not replace parent/guardian review, privacy/terms review, account deletion and data export, support/refund procedures, accessibility checks, or security review. Keep live payments disabled. The currently advertised Plus comparison, expanded-report, and build-history features are still marked as planned and must be implemented before charging anyone.
