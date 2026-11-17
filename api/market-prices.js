const BASE = 'https://raw.githubusercontent.com/pricify-ai/pc-hardware-prices/main/latest/json/';
const CATEGORIES = {
  cpu: ['cpu.live.json'],
  gpu: ['rtx.live.json', 'vga.live.json'],
  ram: ['rams.live.json'],
  storage: ['ssd.live.json', 'hdd.live.json'],
  motherboard: ['motherboards.live.json'],
  psu: ['psu.live.json'],
  case: ['pccase.live.json']
};
const STOP = new Set(['amd','intel','nvidia','geforce','radeon','graphics','card','gpu','cpu','processor','ryzen','core','rtx','rx','arc','xt','the','and','with','memory','ram','ddr3','ddr4','ddr5','gb','tb','ssd','nvme','hdd','drive','storage','motherboard','mainboard','board','psu','power','supply','atx','case','tower','mid','full','mini','itx','w','80','plus','gold','bronze','platinum','white','black','edition','series','kit','1','3','5','7','9']);

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function matchProduct(query, products) {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(' ').filter(token => token && !STOP.has(token) && !/^\\d+(?:\\.\\d+)?(?:gb|tb|mb|w|mhz)$/.test(token));
  if (!tokens.length) return null;
  const candidates = (products || []).map(product => {
    const text = normalize([product.name, product.maker, product.model, product.part_number, product.upc].filter(Boolean).join(' '));
    const found = tokens.filter(token => text.split(' ').includes(token));
    const score = found.length / tokens.length;
    return { product, score, exact: text.includes(normalizedQuery) };
  }).filter(item => item.score === 1);
  candidates.sort((a,b) => Number(b.exact)-Number(a.exact)
    || Number(b.product.retailers_in_stock_end || 0)-Number(a.product.retailers_in_stock_end || 0)
    || Number(b.product.days_in_stock || 0)-Number(a.product.days_in_stock || 0));
  return candidates[0]?.product || null;
}
function queryValue(query, key) {
  const value = query?.[key];
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const query = req.query || Object.fromEntries(new URL(req.url || '/', 'http://localhost').searchParams);
  const requested = Object.entries(CATEGORIES)
    .map(([key, files]) => ({ key, query: queryValue(query, key), files }))
    .filter(item => item.query.trim());
  if (!requested.length) return res.status(400).json({ error: 'Enter at least one exact component model.' });
  if (requested.some(item => item.query.length > 120)) return res.status(400).json({ error: 'A component model is too long.' });

  try {
    const neededFiles = [...new Set(requested.flatMap(item => item.files))];
    const docs = await Promise.all(neededFiles.map(async file => {
      const response = await fetch(BASE + file, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Market data source unavailable (' + response.status + ').');
      return [file, await response.json()];
    }));
    const byFile = Object.fromEntries(docs);
    const matches = {};
    for (const item of requested) {
      const products = item.files.flatMap(file => byFile[file]?.products || []);
      const product = matchProduct(item.query, products);
      if (!product) {
        matches[item.key] = {
          found: false,
          query: item.query,
          message: 'No exact product match in this week’s tracked catalog. Enter the full brand and model number; broad descriptions are not priced.'
        };
        continue;
      }
      const sourceDoc = item.files.map(file => byFile[file]).find(doc => doc?.products?.some(p => p.product_id === product.product_id));
      const latestDay = Array.isArray(product.daily) ? product.daily[product.daily.length - 1] : null;
      matches[item.key] = {
        found: true,
        query: item.query,
        name: product.name,
        maker: product.maker || null,
        partNumber: product.part_number || null,
        typicalPrice: Number(product.typical_price_end || product.week_close || 0) || null,
        lowestPrice: Number(latestDay?.low || product.week_close || 0) || null,
        lowestRetailer: latestDay?.low_store || product.lowest_store_end || null,
        weekLow: Number(product.week_low || 0) || null,
        weekHigh: Number(product.week_high || 0) || null,
        changePct: Number.isFinite(Number(product.change_vs_prev_week_pct)) ? Number(product.change_vs_prev_week_pct) : null,
        retailers: Number(product.retailers_in_stock_end || 0),
        daysInStock: Number(product.days_in_stock || 0),
        launchPrice: Number(product.launch_price || 0) || null,
        asOf: sourceDoc?.to || null,
        generated: sourceDoc?.generated || null,
        sourceUrl: product.url || null
      };
    }
    const firstDoc = docs[0]?.[1];
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({
      source: 'Pricify (pricify.ai)',
      license: 'CC BY 4.0',
      attributionUrl: 'https://github.com/pricify-ai/pc-hardware-prices',
      week: firstDoc?.week || null,
      generated: firstDoc?.generated || null,
      matches
    });
  } catch (error) {
    console.error('Market price lookup failed:', error.message);
    return res.status(502).json({ error: 'Live market data is temporarily unavailable. Your assessment can still be completed.' });
  }
};
module.exports._matchProduct = matchProduct;
