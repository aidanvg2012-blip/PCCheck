# PCCheck account and billing beta test

This is a test-only beta. It is not ready to accept real payments.

## Safe setup

1. Use the Vercel Preview deployment for this branch, not the public production URL. Checkout and Billing Portal return URLs automatically use the current Vercel Preview deployment.
2. Keep Stripe in test mode. Never add a live key to Preview or Production.
3. Confirm the Supabase Preview environment values are configured in Vercel. Do not share secret values in chat.
4. In Stripe test mode, configure the Billing Portal to allow viewing invoices and cancelling subscriptions. Leave payment-method updates disabled unless a parent/guardian has reviewed the flow.
5. In Stripe test mode, configure the webhook endpoint to receive:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. For this branch's lifecycle webhook code, configure a separate Stripe **test-mode** webhook to the stable branch alias `https://pccheck-git-feature-plus-billing-test-suite-aidanvg2012-8929.vercel.app/api/stripe-webhook`. Put that endpoint's own signing secret in Vercel Preview as `STRIPE_WEBHOOK_SECRET`. Do not reuse the Production endpoint's signing secret. Production's existing endpoint remains `https://pccheck.vercel.app/api/stripe-webhook`.
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

## Plus feature Preview checks

The current Preview branch implements the advertised Plus workspace:

- [ ] Sign in with an account whose verified subscription is active. The Plus workspace should unlock.
- [ ] Save at least two used-PC reports. Select them in Saved reports and confirm the side-by-side comparison shows their entered fields and assessment.
- [ ] Select a third report, then confirm a fourth cannot be selected.
- [ ] Use Details on a saved report and confirm its entered fields expand safely.
- [ ] Save a custom build report, change some build inputs, and save another report with the same title. Confirm both dated snapshots appear in Build history with version numbers.
- [ ] Sign out or use a Free account. Plus controls should lock again.
- [ ] Confirm saved reports and build history remain local to the current browser/device; they do not sync across devices or accounts.

## Used-PC parts MSRP comparison

- [ ] Enter a used PC listing with CPU, GPU, RAM, storage, and asking price.
- [ ] Enter original MSRP values for the parts whose launch prices you can verify; leave unknown values blank.
- [ ] Confirm the report lists each entered part, the combined MSRP, and the asking price as a percentage of that total.
- [ ] Confirm the report clearly says MSRP is not current used-market value and that omitted components are excluded.
- [ ] Save the report and reopen it to confirm the MSRP breakdown is retained.

The MSRP fields are user-supplied reference prices, not an automatic live price lookup. Use manufacturer launch pricing or reliable historical sources, and compare used systems with current used listings before deciding what a PC is worth.

## Before any live payment launch

Do not switch live payments on as part of this Preview test. The current checkout endpoint requires an sk_test_ key and the webhook rejects live-mode events by design.

A parent/guardian who owns the Stripe account must complete the financial and business setup directly in Stripe, including identity/business verification, payout bank details, tax information, customer support/refund arrangements, and review of Stripe's terms. Do not send secret keys or private financial information through chat.

Before enabling live billing, the code needs a separate reviewed live-mode path, a live recurring price, a live webhook endpoint with its own signing secret, production-only live environment variables, and an end-to-end test plan. Preview must remain test-only. Also complete privacy/terms review, account deletion and data export, accessibility checks, security review, and a clear support contact.

A successful test checkout or webhook does not prove that live payments are ready.
