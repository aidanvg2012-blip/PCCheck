// Creates a Stripe Billing Portal session for the signed-in account.
// Restricted to Stripe test mode until the complete billing flow is reviewed.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const stripeMode = process.env.STRIPE_MODE || 'test';
  const isLive = stripeMode === 'live';
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL
    : (process.env.PCCHECK_APP_URL || 'https://pccheck.vercel.app').replace(/\/$/, '');
  if (!secretKey || !supabaseUrl || !serviceRoleKey) return res.status(503).json({ error: 'Billing service is not configured.' });
  if (!['test', 'live'].includes(stripeMode) || !secretKey.startsWith(isLive ? 'sk_live_' : 'sk_test_')) return res.status(503).json({ error: 'Stripe mode and secret key do not match.' });

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || token.length > 10000) return res.status(401).json({ error: 'Sign in before managing billing.' });

  try {
    const base = supabaseUrl.replace(/\/$/, '');
    const userResponse = await fetch(base + '/auth/v1/user', {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + token }
    });
    if (!userResponse.ok) return res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' });
    const user = await userResponse.json();

    const query = new URLSearchParams({
      user_id: 'eq.' + user.id,
      livemode: 'eq.' + String(isLive),
      select: 'stripe_customer_id',
      order: 'updated_at.desc',
      limit: '1'
    });
    const subscriptionResponse = await fetch(base + '/rest/v1/subscriptions?' + query.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + serviceRoleKey }
    });
    if (!subscriptionResponse.ok) return res.status(502).json({ error: 'Could not look up your billing account.' });
    const rows = await subscriptionResponse.json();
    const customerId = Array.isArray(rows) ? rows.find(row => row.stripe_customer_id)?.stripe_customer_id : null;
    if (!customerId) return res.status(404).json({ error: 'No Stripe billing account is linked to this PCCheck account yet.' });

    const form = new URLSearchParams();
    form.set('customer', customerId);
    form.set('return_url', appUrl + '/?billing=returned');
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secretKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    const session = await response.json();
    if (!response.ok || !session.url) {
      console.error('Stripe Billing Portal session failed:', session.error?.type || response.status);
      return res.status(502).json({ error: 'Stripe could not open billing management. The test-mode portal may need to be configured.' });
    }
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Billing portal endpoint error:', error.message);
    return res.status(500).json({ error: 'Unable to open billing management right now.' });
  }
};