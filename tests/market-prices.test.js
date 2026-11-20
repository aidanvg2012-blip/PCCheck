const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/market-prices.js');

function responseRecorder() {
  return {
    code: 200, body: null, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('matches an exact CPU model and ignores generic descriptions', () => {
  const products = [
    { name: 'AMD Ryzen 5 5600X 6-Core Processor', maker: 'AMD', model: 'Ryzen 5 5600X' },
    { name: 'AMD Ryzen 5 5600GT', maker: 'AMD', model: 'Ryzen 5 5600GT' }
  ];
  assert.equal(handler._matchProduct('Ryzen 5 5600X', products).name, products[0].name);
  const genericParts = [
    { name: 'PNY Performance 16GB DDR4-3200 CL22', maker: 'PNY' },
    { name: 'Samsung 870 EVO 1TB 2.5 SATA', maker: 'Samsung' }
  ];
  assert.equal(handler._matchProduct('16GB DDR4', genericParts), null);
  assert.equal(handler._matchProduct('1TB NVMe SSD', genericParts), null);
  assert.equal(handler._matchProduct('Ryzen 5', products), null);
});

test('returns sourced current retail benchmarks for an exact query', async () => {
  const originalFetch = global.fetch;
  global.fetch = async url => {
    assert.match(String(url), /cpu\.live\.json$/);
    return Response.json({
      week: '2026-W46', generated: '2026-11-16T06:27:29Z', to: '2026-11-15',
      products: [{
        product_id: 1, name: 'AMD Ryzen 5 5600X', maker: 'AMD', model: 'Ryzen 5 5600X',
        typical_price_end: 129.99, week_close: 119.99, week_low: 119.99, week_high: 129.99,
        days_in_stock: 7, retailers_in_stock_end: 3, lowest_store_end: 'Newegg',
        daily: [{ date: '2026-11-15', low: 119.99, low_store: 'Newegg' }],
        url: 'https://cpu.live/cpus/amd-ryzen-5-5600x'
      }]
    });
  };
  try {
    const req = { method: 'GET', query: { cpu: 'Ryzen 5 5600X' } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.matches.cpu.found, true);
    assert.equal(res.body.matches.cpu.typicalPrice, 129.99);
    assert.equal(res.body.matches.cpu.lowestPrice, 119.99);
    assert.equal(res.body.matches.cpu.asOf, '2026-11-15');
    assert.equal(res.body.source, 'Pricify (pricify.ai)');
    assert.match(res.headers['Cache-Control'], /s-maxage/);
  } finally { global.fetch = originalFetch; }
});

test('requires at least one component query', async () => {
  const res = responseRecorder();
  await handler({ method: 'GET', query: {} }, res);
  assert.equal(res.code, 400);
});
