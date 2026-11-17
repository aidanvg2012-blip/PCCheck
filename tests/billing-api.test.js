const test = require('node:test');
const assert = require('node:assert/strict');

const plusStatus = require('../api/plus-status.js');
const portalSession = require('../api/create-portal-session.js');

function responseRecorder() {
  return {
    code: 200, body: null, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

async function call(handler, { method = 'GET', authorization = 'Bearer valid-user-token', fetchStub, secretKey = 'sk_test_example' } = {}) {
  const originalFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test';
  process.env.STRIPE_SECRET_KEY = secretKey;
  process.env.PCCHECK_APP_URL = 'https://preview.example.vercel.app';
  global.fetch = fetchStub;
  const req = { method, headers: authorization ? { authorization } : {} };
  const res = responseRecorder();
  try { await handler(req, res); return res; }
  finally { global.fetch = originalFetch; }
}

test('Plus status grants access to an active, unexpired subscription', async () => {
  const res = await call(plusStatus, { fetchStub: async url => {
    if (String(url).includes('/auth/v1/user')) return Response.json({ id: 'user-1' });
    return Response.json([{ status: 'active', current_period_end: '2099-01-01T00:00:00.000Z', cancel_at_period_end: false, stripe_customer_id: 'cus_test_1' }]);
  }});
  assert.equal(res.code, 200);
  assert.equal(res.body.hasPlus, true);
  assert.equal(res.body.hasCustomer, true);
});

test('Plus status denies access when subscription is past due', async () => {
  const res = await call(plusStatus, { fetchStub: async url => {
    if (String(url).includes('/auth/v1/user')) return Response.json({ id: 'user-1' });
    return Response.json([{ status: 'past_due', current_period_end: '2099-01-01T00:00:00.000Z', stripe_customer_id: 'cus_test_1' }]);
  }});
  assert.equal(res.code, 200);
  assert.equal(res.body.hasPlus, false);
  assert.equal(res.body.status, 'past_due');
});

test('billing portal requires an authenticated user', async () => {
  const res = await call(portalSession, { method: 'POST', authorization: '', fetchStub: async () => { throw new Error('fetch should not be called'); } });
  assert.equal(res.code, 401);
});

test('billing portal creates a session for the signed-in user customer', async () => {
  const requests = [];
  const res = await call(portalSession, { method: 'POST', fetchStub: async (url, options = {}) => {
    requests.push({ url: String(url), options });
    if (String(url).includes('/auth/v1/user')) return Response.json({ id: 'user-1' });
    if (String(url).includes('/rest/v1/subscriptions')) return Response.json([{ stripe_customer_id: 'cus_test_1' }]);
    return Response.json({ url: 'https://billing.stripe.test/session' });
  }});
  assert.equal(res.code, 200);
  assert.equal(res.body.url, 'https://billing.stripe.test/session');
  const stripeRequest = requests.find(item => item.url.includes('/v1/billing_portal/sessions'));
  assert.ok(stripeRequest);
  assert.match(stripeRequest.options.body, /customer=cus_test_1/);
});

test('billing portal refuses live Stripe keys', async () => {
  const res = await call(portalSession, { method: 'POST', secretKey: 'sk_live_not_allowed', fetchStub: async () => { throw new Error('fetch should not be called'); } });
  assert.equal(res.code, 503);
});
