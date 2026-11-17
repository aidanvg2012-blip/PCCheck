// Creates a Stripe Checkout Session for the currently authenticated PCCheck user.
// Test mode only. The browser never supplies a user ID or Stripe customer ID.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const stripeMode = process.env.STRIPE_MODE || 'test';
  const isLive = stripeMode === 'live';
  const priceId = isLive ? process.env.STRIPE_LIVE_PRICE_ID : process.env.STRIPE_TEST_PRICE_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL
    : (process.env.PCCHECK_APP_URL || 'https://pccheck.vercel.app').replace(/\/$/, '');

  if (!secretKey || !priceId || !supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Checkout or account service is not configured.' });
  }
  if (!['test', 'live'].includes(stripeMode) || !secretKey.startsWith(isLive ? 'sk_live_' : 'sk_test_')) {
    return res.status(503).json({ error: 'Stripe mode and secret key do not match.' });
  }
  if (!priceId.startsWith('price_')) {
    return res.status(503).json({ error: 'The Stripe test Price ID is invalid.' });
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || token.length > 10000) return res.status(401).json({ error: 'Sign in before starting checkout.' });

  try {
    const userResponse = await fetch(supabaseUrl.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + token }
    });
    if (!userResponse.ok) return res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' });
    const user = await userResponse.json();
    if (!user.id || !user.email || !user.email_confirmed_at) return res.status(403).json({ error: 'Confirm your account email before starting checkout.' });

    const priceResponse = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(priceId), {
      headers: { Authorization: 'Bearer ' + secretKey }
    });
    const price = await priceResponse.json();
    if (!priceResponse.ok) return res.status(503).json({ error: 'Stripe could not verify the configured test Price ID.' });
    if (price.livemode !== isLive || price.active !== true || price.type !== 'recurring' || price.recurring?.interval !== 'month') {
      return res.status(400).json({ error: 'The configured Stripe Price must be an active monthly recurring price in the selected Stripe mode.' });
    }

    const existingQuery = new URLSearchParams({
      user_id: 'eq.' + user.id,
      status: 'in.(active,trialing)',
      livemode: 'eq.' + String(isLive),
      select: 'stripe_subscription_id',
      limit: '1'
    });
    const existingResponse = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/subscriptions?' + existingQuery.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + serviceRoleKey }
    });
    if (!existingResponse.ok) return res.status(502).json({ error: 'Could not verify your current membership.' });
    const existing = await existingResponse.json();
    if (Array.isArray(existing) && existing.length) {
      return res.status(409).json({ error: 'This account already has an active Plus subscription.' });
    }

    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('line_items[0][price]', priceId);
    form.set('line_items[0][quantity]', '1');
    form.set('success_url', appUrl + '/?checkout=success&session_id={CHECKOUT_SESSION_ID}');
    form.set('cancel_url', appUrl + '/?checkout=cancelled');
    form.set('billing_address_collection', 'auto');
    form.set('allow_promotion_codes', 'true');
    form.set('customer_email', user.email);
    form.set('client_reference_id', user.id);
    form.set('metadata[supabase_user_id]', user.id);
    form.set('subscription_data[metadata][supabase_user_id]', user.id);

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secretKey, 'Content-Type': 'application/x-www-form-urlencoded' },
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