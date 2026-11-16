// Vercel serverless function: creates a Stripe Checkout Session in TEST mode only.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_TEST_PRICE_ID;
  const appUrl = (process.env.PCCHECK_APP_URL || 'https://pccheck.vercel.app').replace(/\/$/, '');

  // Deliberately refuse live keys. Live billing requires a separate reviewed release.
  if (!secretKey || !priceId) {
    return res.status(503).json({ error: 'Stripe test checkout is not configured yet. Add the test-mode key and test Price ID in Vercel.' });
  }
  if (!secretKey.startsWith('sk_test_')) {
    return res.status(503).json({ error: 'Checkout is locked to Stripe test mode. A test-mode secret key is required.' });
  }
  if (!priceId.startsWith('price_')) {
    return res.status(503).json({ error: 'The Stripe test Price ID is invalid.' });
  }

  try {
    const priceResponse = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(priceId), {
      headers: { Authorization: 'Bearer ' + secretKey }
    });
    const price = await priceResponse.json();
    if (!priceResponse.ok) {
      return res.status(503).json({ error: 'Stripe could not verify the configured test Price ID.' });
    }
    if (price.livemode !== false || price.active !== true ||
        price.type !== 'recurring' || price.recurring?.interval !== 'month') {
      return res.status(400).json({ error: 'The configured Stripe Price must be an active monthly recurring TEST price.' });
    }

    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('line_items[0][price]', priceId);
    form.set('line_items[0][quantity]', '1');
    form.set('success_url', appUrl + '/?checkout=success&session_id={CHECKOUT_SESSION_ID}');
    form.set('cancel_url', appUrl + '/?checkout=cancelled');
    form.set('billing_address_collection', 'auto');
    form.set('allow_promotion_codes', 'true');
    form.set('client_reference_id', 'pccheck-plus-test');

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + secretKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });
    const session = await sessionResponse.json();
    if (!sessionResponse.ok || !session.url) {
      console.error('Stripe Checkout session creation failed:', session.error?.type || sessionResponse.status);
      return res.status(502).json({ error: 'Stripe could not create a test checkout session.' });
    }
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout endpoint error:', error.message);
    return res.status(500).json({ error: 'Unable to start test checkout right now.' });
  }
};
