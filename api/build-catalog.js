'use strict';
const BASE = 'https://raw.githubusercontent.com/pricify-ai/pc-hardware-prices/main/latest/json/';
const FILES = {
  cpu: ['cpu.live.json'],
  gpu: ['rtx.live.json', 'vga.live.json'],
  ram: ['rams.live.json'],
  storage: ['ssd.live.json'],
  motherboard: ['motherboards.live.json'],
  psu: ['psu.live.json'],
  case: ['pccase.live.json']
};
function productRow(product, doc, category) {
  const daily = Array.isArray(product.daily) ? product.daily : [];
  const latest = daily[daily.length - 1] || null;
  let sourceUrl = null;
  try {
    const url = new URL(product.url);
    if (url.protocol === 'https:') sourceUrl = url.toString();
  } catch {}
  return {
    id: String(product.product_id || product.part_number || product.name),
    category,
    name: String(product.name || ''),
    maker: product.maker || null,
    model: product.model || null,
    partNumber: product.part_number || null,
    lowestPrice: Number(latest?.low ?? product.week_close ?? product.week_low) || null,
    typicalPrice: Number(product.typical_price_end || product.week_close || 0) || null,
    lowestRetailer: latest?.low_store || product.lowest_store_end || null,
    retailers: Number(product.retailers_in_stock_end || 0),
    inStockDays: Number(product.days_in_stock || 0),
    weekLow: Number(product.week_low || 0) || null,
    weekHigh: Number(product.week_high || 0) || null,
    asOf: doc.to || null,
    generated: doc.generated || null,
    week: doc.week || null,
    sourceUrl
  };
}
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const files = [...new Set(Object.values(FILES).flat())];
    const docs = await Promise.all(files.map(async file => {
      const response = await fetch(BASE + file, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Retail dataset unavailable: ' + response.status);
      return [file, await response.json()];
    }));
    const byFile = Object.fromEntries(docs);
    const products = {};
    for (const [category, names] of Object.entries(FILES)) {
      products[category] = names.flatMap(file => {
        const doc = byFile[file];
        return (doc?.products || []).map(p => productRow(p, doc, category));
      }).filter(p => p.name && p.lowestPrice && p.sourceUrl)
        .sort((a,b) => a.lowestPrice - b.lowestPrice);
    }
    const first = docs[0]?.[1] || {};
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({
      source: 'Pricify (pricify.ai)',
      attributionUrl: 'https://github.com/pricify-ai/pc-hardware-prices',
      license: 'CC BY 4.0',
      week: first.week || null,
      generated: first.generated || null,
      products
    });
  } catch (error) {
    console.error('Build catalog unavailable:', error.message);
    return res.status(502).json({ error: 'The component price catalog is temporarily unavailable. Try again later.' });
  }
};
