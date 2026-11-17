const crypto = require('node:crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!signingSecret || !supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Webhook is not configured.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    if (!verifyStripeSignature(rawBody, signature, signingSecret)) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.livemode === true) {
      return res.status(400).json({ error: 'Live-mode events are disabled.' });
    }

    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ];
    const invoiceEvents = ['invoice.paid', 'invoice.payment_failed'];
    if (!subscriptionEvents.includes(event.type) && !invoiceEvents.includes(event.type)) {
      return res.status(200).json({ received: true, ignored: true });
    }

    let subscription = event.data && event.data.object;
    if (invoiceEvents.includes(event.type)) {
      const invoice = subscription;
      const subscriptionId = invoice?.subscription ||
        invoice?.parent?.subscription_details?.subscription ||
        invoice?.lines?.data?.find(line => line.parent?.subscription_item_details?.subscription)
          ?.parent?.subscription_item_details?.subscription;
      if (!subscriptionId) return res.status(200).json({ received: true, ignored: true });
      if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_test_')) {
        return res.status(503).json({ error: 'Test-mode Stripe lookup is not configured.' });
      }
      const lookup = await fetch('https://api.stripe.com/v1/subscriptions/' + encodeURIComponent(subscriptionId), {
        headers: { Authorization: 'Bearer ' + stripeSecretKey }
      });
      const lookupBody = await lookup.json().catch(() => ({}));
      if (!lookup.ok || !lookupBody.id) {
        console.error('Stripe subscription lookup failed:', lookup.status);
        return res.status(502).json({ error: 'Could not retrieve subscription state.' });
      }
      subscription = lookupBody;
    }

    const userId = subscription?.metadata?.supabase_user_id;
    if (!subscription?.id || !userId) {
      console.warn('Stripe subscription missing PCCheck user metadata.');
      return res.status(200).json({ received: true, ignored: true });
    }

    const priceId = subscription.items?.data?.[0]?.price?.id || null;
    const record = {
      user_id: userId,
      stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/subscriptions?on_conflict=stripe_subscription_id', {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: 'Bearer ' + serviceRoleKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(record)
    });
    if (!response.ok) {
      const detail = await response.text();
      const diagnostic = {
        status: response.status,
        statusText: response.statusText,
        detail: detail.slice(0, 1000),
        allow: response.headers.get('allow'),
        contentType: response.headers.get('content-type'),
        server: response.headers.get('server'),
        responseUrl: response.url
      };
      console.error('Supabase subscription upsert failed:', JSON.stringify(diagnostic));
      return res.status(500).json({ error: 'Could not store subscription state.' });
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return res.status(400).json({ error: 'Webhook request could not be processed.' });
  }
};

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(payload, header, secret) {
  if (!header || typeof header !== 'string') return false;
  const parts = header.split(',').map(part => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = crypto.createHmac('sha256', secret)
    .update(timestamp + '.' + payload.toString('utf8'))
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return signatures.some(value => {
    if (!/^[a-f0-9]{64}$/i.test(value)) return false;
    const actual = Buffer.from(value, 'hex');
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
  });
}
