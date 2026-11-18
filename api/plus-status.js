// Returns the authenticated user's Plus entitlement. Never trusts a client-supplied user ID.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!supabaseUrl || !serviceRoleKey) return res.status(503).json({ error: 'Account service is not configured.' });
  if (!token || token.length > 10000) return res.status(401).json({ error: 'Sign in to check Plus access.' });

  try {
    const userResponse = await fetch(supabaseUrl.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + token }
    });
    if (!userResponse.ok) return res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' });
    const user = await userResponse.json();
    const stripeMode = process.env.STRIPE_MODE || 'test';
    if (!['test', 'live'].includes(stripeMode)) return res.status(503).json({ error: 'Stripe mode is not configured correctly.' });
    const query = new URLSearchParams({
      user_id: 'eq.' + user.id,
      livemode: 'eq.' + String(stripeMode === 'live'),
      select: 'status,current_period_end,cancel_at_period_end,stripe_customer_id',
      order: 'updated_at.desc',
      limit: '1'
    });
    const subscriptionResponse = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/subscriptions?' + query.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: 'Bearer ' + serviceRoleKey }
    });
    if (!subscriptionResponse.ok) {
      const detail = await subscriptionResponse.text().catch(() => '');
      console.error('Plus status lookup failed:', subscriptionResponse.status, detail.slice(0, 700));
      const schemaOutOfDate = /column .*livemode.* does not exist|livemode.*schema cache/i.test(detail);
      return res.status(502).json({
        error: schemaOutOfDate
          ? 'PCCheck billing database needs its latest migration. Please try again after the database is updated.'
          : 'Could not check membership right now.'
      });
    }
    const rows = await subscriptionResponse.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const allowedStatus = row && ['active', 'trialing'].includes(row.status);
    const notExpired = !row?.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
    return res.status(200).json({
      hasPlus: Boolean(allowedStatus && notExpired),
      hasCustomer: Boolean(row?.stripe_customer_id),
      status: row?.status || 'free',
      currentPeriodEnd: row?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end)
    });
  } catch (error) {
    console.error('Plus status endpoint error:', error.message);
    return res.status(500).json({ error: 'Could not check membership right now.' });
  }
};