const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const handler = require('../api/stripe-webhook.js');
const SECRET = 'whsec_test_for_unit_tests_only';

function signedRequest(event, secret = SECRET) {
  const body = Buffer.from(JSON.stringify(event));
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secret)
    .update(timestamp + '.' + body.toString('utf8'))
    .digest('hex');
  const req = {
    method: 'POST',
    headers: { 'stripe-signature': 't=' + timestamp + ',v1=' + signature },
    on(name, callback) {
      if (name === 'data') queueMicrotask(() => callback(body));
      if (name === 'end') queueMicrotask(callback);
    }
  };
  return req;
}

function responseRecorder() {
  return {
    code: 200, body: null, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function baseEvent(type, object, extra = {}) {
  return { id: 'evt_test_1', type, livemode: false, data: { object }, ...extra };
}

function subscription(status = 'active') {
  return {
    id: 'sub_test_1',
    customer: 'cus_test_1',
    status,
    current_period_end: 1893456000,
    cancel_at_period_end: status === 'active' ? false : true,
    metadata: { supabase_user_id: '00000000-0000-4000-8000-000000000001' },
    items: { data: [{ price: { id: 'price_test_monthly' } }] }
  };
}

async function invoke(event, fetchStub, signatureSecret = SECRET, mode = 'test') {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test';
  process.env.STRIPE_SECRET_KEY = mode === 'live' ? 'sk_live_example' : 'sk_test_example';
  process.env.STRIPE_MODE = mode;
  const originalFetch = global.fetch;
  global.fetch = fetchStub;
  const res = responseRecorder();
  try {
    await handler(signedRequest(event, signatureSecret), res);
    return res;
  } finally {
    global.fetch = originalFetch;
  }
}

test('rejects requests with an invalid signature', async () => {
  const res = await invoke(baseEvent('customer.subscription.created', subscription()), async () => {
    throw new Error('fetch should not be called');
  }, 'wrong_secret');
  assert.equal(res.code, 400);
});

test('ignores unrelated Stripe events', async () => {
  const res = await invoke(baseEvent('checkout.session.completed', { id: 'cs_test_1' }), async () => {
    throw new Error('fetch should not be called');
  });
  assert.equal(res.code, 200);
  assert.equal(res.body.ignored, true);
});

test('stores a new active subscription', async () => {
  let saved;
  const res = await invoke(baseEvent('customer.subscription.created', subscription()), async (url, options) => {
    saved = JSON.parse(options.body);
    return new Response('', { status: 201 });
  });
  assert.equal(res.code, 200);
  assert.equal(saved.status, 'active');
  assert.equal(saved.user_id, subscription().metadata.supabase_user_id);
  assert.equal(saved.stripe_subscription_id, 'sub_test_1');
  assert.equal(saved.livemode, false);
});

test('stores failed-renewal state from the current Stripe subscription', async () => {
  let saved;
  const invoice = { id: 'in_test_1', subscription: 'sub_test_1' };
  const res = await invoke(baseEvent('invoice.payment_failed', invoice), async (url, options) => {
    if (String(url).includes('/v1/subscriptions/')) {
      return Response.json(subscription('past_due'));
    }
    saved = JSON.parse(options.body);
    return new Response('', { status: 201 });
  });
  assert.equal(res.code, 200);
  assert.equal(saved.status, 'past_due');
});

test('stores cancellation state', async () => {
  let saved;
  const res = await invoke(baseEvent('customer.subscription.deleted', subscription('canceled')), async (url, options) => {
    saved = JSON.parse(options.body);
    return new Response('', { status: 201 });
  });
  assert.equal(res.code, 200);
  assert.equal(saved.status, 'canceled');
});

test('rejects live-mode events when configured for test mode', async () => {
  const res = await invoke(baseEvent('customer.subscription.created', subscription(), { livemode: true }), async () => {
    throw new Error('fetch should not be called');
  });
  assert.equal(res.code, 400);
});

test('stores live-mode subscription events separately', async () => {
  let saved;
  const liveEvent = baseEvent('customer.subscription.created', subscription(), { livemode: true });
  const res = await invoke(liveEvent, async (url, options) => {
    saved = JSON.parse(options.body);
    return new Response('', { status: 201 });
  }, SECRET, 'live');
  assert.equal(res.code, 200);
  assert.equal(saved.livemode, true);
  assert.equal(saved.status, 'active');
});
