'use strict';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'pccheck_reports_v5';
const APP_VERSION = '2.4.0';


// Curated recognition catalog. Aliases are intentionally explicit to avoid guessing.
const HARDWARE_CATALOG = {
  cpu: [
    ['AMD Ryzen 7 7800X3D',['ryzen 7 7800x3d','7800x3d','r7 7800x3d']],
    ['AMD Ryzen 7 9800X3D',['ryzen 7 9800x3d','9800x3d']],
    ['AMD Ryzen 5 5600X',['ryzen 5 5600x','5600x','r5 5600x']],
    ['AMD Ryzen 5 5600',['ryzen 5 5600','r5 5600']],
    ['AMD Ryzen 5 7600',['ryzen 5 7600','r5 7600']],
    ['AMD Ryzen 5 7600X',['ryzen 5 7600x','7600x']],
    ['AMD Ryzen 7 5700X',['ryzen 7 5700x','5700x']],
    ['AMD Ryzen 7 5800X3D',['ryzen 7 5800x3d','5800x3d']],
    ['AMD Ryzen 7 7700X',['ryzen 7 7700x','7700x']],
    ['AMD Ryzen 9 5900X',['ryzen 9 5900x','5900x']],
    ['AMD Ryzen 9 7900X',['ryzen 9 7900x','7900x']],
    ['AMD Ryzen 9 7950X',['ryzen 9 7950x','7950x']],
    ['Intel Core i5-12400F',['core i5 12400f','i5 12400f','12400f']],
    ['Intel Core i5-12600K',['core i5 12600k','i5 12600k','12600k']],
    ['Intel Core i5-13400F',['core i5 13400f','i5 13400f','13400f']],
    ['Intel Core i5-13600K',['core i5 13600k','i5 13600k','13600k']],
    ['Intel Core i5-14600K',['core i5 14600k','i5 14600k','14600k']],
    ['Intel Core i7-12700K',['core i7 12700k','i7 12700k','12700k']],
    ['Intel Core i7-13700K',['core i7 13700k','i7 13700k','13700k']],
    ['Intel Core i7-14700K',['core i7 14700k','i7 14700k','14700k']],
    ['Intel Core i9-12900K',['core i9 12900k','i9 12900k','12900k']],
    ['Intel Core i9-13900K',['core i9 13900k','i9 13900k','13900k']],
    ['Intel Core i9-14900K',['core i9 14900k','i9 14900k','14900k']],
    ['Intel Core Ultra 7 265K',['core ultra 7 265k','ultra 7 265k','265k']],
    ['Intel Core Ultra 9 285K',['core ultra 9 285k','ultra 9 285k','285k']]
  ],
  gpu: [
    ['NVIDIA GeForce RTX 5090',['rtx 5090','geforce rtx 5090']],
    ['NVIDIA GeForce RTX 5080',['rtx 5080','geforce rtx 5080']],
    ['NVIDIA GeForce RTX 5070 Ti',['rtx 5070 ti','5070ti']],
    ['NVIDIA GeForce RTX 5070',['rtx 5070']],
    ['NVIDIA GeForce RTX 5060 Ti',['rtx 5060 ti','5060ti']],
    ['NVIDIA GeForce RTX 5060',['rtx 5060']],
    ['NVIDIA GeForce RTX 4090',['rtx 4090']],
    ['NVIDIA GeForce RTX 4080 Super',['rtx 4080 super','4080s']],
    ['NVIDIA GeForce RTX 4080',['rtx 4080']],
    ['NVIDIA GeForce RTX 4070 Ti Super',['rtx 4070 ti super','4070tis']],
    ['NVIDIA GeForce RTX 4070 Ti',['rtx 4070 ti','4070ti']],
    ['NVIDIA GeForce RTX 4070 Super',['rtx 4070 super','4070s']],
    ['NVIDIA GeForce RTX 4070',['rtx 4070']],
    ['NVIDIA GeForce RTX 4060 Ti',['rtx 4060 ti','4060ti']],
    ['NVIDIA GeForce RTX 4060',['rtx 4060']],
    ['NVIDIA GeForce RTX 3090',['rtx 3090']],
    ['NVIDIA GeForce RTX 3080',['rtx 3080']],
    ['NVIDIA GeForce RTX 3070',['rtx 3070']],
    ['NVIDIA GeForce RTX 3060 Ti',['rtx 3060 ti','3060ti']],
    ['NVIDIA GeForce RTX 3060',['rtx 3060']],
    ['NVIDIA GeForce RTX 3050',['rtx 3050']],
    ['NVIDIA GeForce GTX 1660 Super',['gtx 1660 super','1660s']],
    ['NVIDIA GeForce GTX 1660 Ti',['gtx 1660 ti','1660ti']],
    ['NVIDIA GeForce GTX 1660',['gtx 1660']],
    ['NVIDIA GeForce GTX 1650 Super',['gtx 1650 super','1650super']],
    ['NVIDIA GeForce GTX 1650',['gtx 1650']],
    ['AMD Radeon RX 9070 XT',['rx 9070 xt','9070xt']],
    ['AMD Radeon RX 9070',['rx 9070']],
    ['AMD Radeon RX 7900 XTX',['rx 7900 xtx','7900xtx']],
    ['AMD Radeon RX 7900 XT',['rx 7900 xt','7900xt']],
    ['AMD Radeon RX 7800 XT',['rx 7800 xt','7800xt']],
    ['AMD Radeon RX 7700 XT',['rx 7700 xt','7700xt']],
    ['AMD Radeon RX 7600 XT',['rx 7600 xt','7600xt']],
    ['AMD Radeon RX 7600',['rx 7600']],
    ['AMD Radeon RX 6950 XT',['rx 6950 xt','6950xt']],
    ['AMD Radeon RX 6900 XT',['rx 6900 xt','6900xt']],
    ['AMD Radeon RX 6800 XT',['rx 6800 xt','6800xt']],
    ['AMD Radeon RX 6700 XT',['rx 6700 xt','6700xt']],
    ['AMD Radeon RX 6600 XT',['rx 6600 xt','6600xt']],
    ['AMD Radeon RX 6600',['rx 6600']]
  ]
};
function normalizeHardwareText(value) {
  return clean(value).toLowerCase().replace(/\b(amd|intel|nvidia|geforce|radeon)\b/g,' ').replace(/[^a-z0-9]/g,'');
}
function findCatalogMatch(text, type) {
  const normalized = normalizeHardwareText(text);
  const entries = HARDWARE_CATALOG[type] || [];
  const matches = [];
  for (const [canonical, aliases] of entries) {
    for (const alias of aliases) {
      const key = normalizeHardwareText(alias);
      if (key.length >= 4 && normalized.includes(key)) {
        matches.push({canonical, alias, length:key.length});
        break;
      }
    }
  }
  matches.sort((a,b)=>b.length-a.length);
  return matches[0] || null;
}
function populateHardwareSuggestions() {
  for (const type of ['cpu','gpu']) {
    const list = $(`${type}Suggestions`);
    if (list) list.innerHTML = HARDWARE_CATALOG[type].map(([name])=>`<option value="${escapeHTML(name)}">`).join('');
  }
}
function extractListingSpecs(text) {
  const source = clean(text);
  const cpu = findCatalogMatch(source,'cpu') || (() => {
    const m = source.match(/\b(?:amd\s*)?ryzen\s*[3579]\s*[- ]?(\d{4,5})(\s*x3d|\s*x)?\b/i);
    if (m) return {canonical:`AMD Ryzen ${source.match(/ryzen\s*([3579])/i)?.[1] || ''} ${m[1]}${(m[2]||'').replace(/\s/g,'').toUpperCase()}`.trim()};
    const i = source.match(/\b(?:intel\s*)?(?:core\s*)?i([3579])\s*[- ]?(\d{4,5})([a-z]{0,2})\b/i);
    return i ? {canonical:`Intel Core i${i[1]}-${i[2]}${i[3].toUpperCase()}`} : null;
  })();
  const gpu = findCatalogMatch(source,'gpu') || (() => {
    const m = source.match(/\b(rtx|gtx|rx)\s*[- ]?(\d{3,4})(?:\s*(ti|super|xt|xtx))?\b/i);
    if (!m) return null;
    const brand = m[1].toUpperCase(), suffix = m[3] ? ` ${m[3].toUpperCase()}` : '';
    return {canonical: brand === 'RX' ? `AMD Radeon RX ${m[2]}${suffix}` : `NVIDIA GeForce ${brand} ${m[2]}${suffix}`};
  })();
  const ramMatch = source.match(/\b(ddr\s*[345])\s*(8|16|24|32|48|64|96|128|256)\s*gb\b/i)
    || source.match(/\b(8|16|24|32|48|64|96|128|256)\s*gb\s*(?:ram|memory)?\s*(?:of\s*)?(ddr\s*[345])\b/i)
    || source.match(/\b(8|16|24|32|48|64|96|128|256)\s*gb\s*(?:ram|memory)\s*(?:ddr\s*[345])?\b/i)
    || source.match(/\b(ddr\s*[345])\s*(8|16|24|32|48|64|96|128|256)\s*gb\b/i);
  const ram = ramMatch ? (String(ramMatch[1]).toLowerCase().startsWith('ddr') ? `${ramMatch[2]}GB ${String(ramMatch[1]).replace(/\s/g,'').toUpperCase()}` : String(ramMatch[2] || '').toLowerCase().startsWith('ddr') ? `${ramMatch[1]}GB ${String(ramMatch[2]).replace(/\s/g,'').toUpperCase()}` : `${ramMatch[1]}GB ${ramMatch[2] ? String(ramMatch[2]).replace(/\s/g,'').toUpperCase() : '(type unknown)'}`) : null;
  let storageMatch = source.match(/\b(256|500|512|1000|1024|2000|2048|4000|4096|1|2|4)\s*(gb|tb)\s*(?:m\.2\s*)?(nvme|ssd|hdd|hard\s*drive)\b/i)
    || source.match(/\b(nvme|ssd|hdd)\s*(256|500|512|1000|1024|2000|2048|4000|4096|1|2|4)\s*(gb|tb)\b/i);
  let storage = '';
  if (storageMatch) {
    if (/^(nvme|ssd|hdd)$/i.test(storageMatch[1])) storage = `${storageMatch[2]} ${storageMatch[3].toUpperCase()} ${storageMatch[1].toUpperCase()}`;
    else storage = `${storageMatch[1]} ${storageMatch[2].toUpperCase()} ${storageMatch[3].toUpperCase().replace(/\s/g,'')}`;
  } else {
    const capacity = source.match(/\b(256|500|512|1000|1024|2000|2048|4000|4096|1|2|4)\s*(gb|tb)\b/i);
    const kind = source.match(/\b(nvme|m\.2|ssd|hdd|hard\s*drive)\b/i);
    if (capacity && kind) storage = `${capacity[1]} ${capacity[2].toUpperCase()} ${kind[1].toUpperCase().replace('M.2','M.2')}`;
  }
  return {cpu:cpu?.canonical || '',gpu:gpu?.canonical || '',ram:ram || '',storage,found:[cpu&&'CPU',gpu&&'GPU',ram&&'RAM',storage&&'Storage'].filter(Boolean)};
}

let reports = loadReports();
let activeReport = null;

function loadReports() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem('pccheck_reports_v4') || localStorage.getItem('pccheck_reports_v3');
    const value = JSON.parse(current || legacy || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function persistReports() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    $('storageStatus').textContent = 'Saved on this device';
  } catch {
    $('storageStatus').textContent = 'Browser storage is full or unavailable';
  }
}

/* Mobile app-style tab navigation. Desktop continues to show the complete dashboard. */
(() => {
  const mobileQuery = window.matchMedia('(max-width: 700px)');
  const tabButtons = [...document.querySelectorAll('.mobile-tabs [data-tab]')];
  const tabTargets = {home: '.hero', analyze: '#analyze', build: '#build', saved: '#saved', guides: '#guides'};
  const activateTab = (tab, updateHash = false) => {
    if (!tabTargets[tab]) return;
    document.body.classList.toggle('mobile-app-view', mobileQuery.matches);
    document.body.dataset.mobileTab = tab;
    tabButtons.forEach(button => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (updateHash && mobileQuery.matches) history.replaceState(null, '', tab === 'home' ? location.pathname : '#' + tab);
    if (mobileQuery.matches) window.scrollTo({top: 0, behavior: 'smooth'});
  };
  tabButtons.forEach(button => button.addEventListener('click', () => activateTab(button.dataset.tab, true)));
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const tab = link.getAttribute('href').slice(1);
    if (tab === 'top') activateTab('home');
    else if (['analyze','build','saved','guides'].includes(tab)) activateTab(tab);
  }));
  const syncLayout = () => {
    if (mobileQuery.matches) {
      const requested = location.hash.slice(1);
      activateTab(['analyze','build','saved','guides'].includes(requested) ? requested : 'home');
    } else {
      document.body.classList.remove('mobile-app-view');
      document.body.removeAttribute('data-mobile-tab');
    }
  };
  mobileQuery.addEventListener?.('change', syncLayout);
  syncLayout();
})();


/* Non-payment Plus preview: measures interest without collecting payment data. */
(() => {
 const open = document.getElementById('proPreviewButton');
 const close = document.getElementById('closeProPreview');
 const panel = document.getElementById('proPreview');
 if (!open || !close || !panel) return;
 open.addEventListener('click', () => {
   panel.hidden = false;
   open.textContent = 'Preview open ✓';
   panel.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest'});
 });
 close.addEventListener('click', () => {
   panel.hidden = true;
   open.textContent = 'Preview Plus ↗';
 });
})();

/* Stripe Checkout: test mode only. Paid access is not granted by a redirect. */
(() => {
 const button = document.getElementById('plusCheckoutButton');
 const status = document.getElementById('plusCheckoutStatus');
 if (!button || !status) return;
 button.addEventListener('click', async () => {
   button.disabled = true;
   status.textContent = 'Preparing secure test checkout…';
   try {
     const response = await fetch('/api/create-checkout-session', {
       method: 'POST',
       headers: {'Content-Type':'application/json'},
       body: JSON.stringify({})
     });
     const data = await response.json().catch(() => ({}));
     if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is not configured yet.');
     window.location.assign(data.url);
   } catch (error) {
     status.textContent = error.message || 'Unable to start checkout. Please try again.';
     button.disabled = false;
   }
 });
})();

renderReports();
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
function clean(value) { return String(value ?? '').trim(); }
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}) : 'Not provided';
}
function showMessage(element, text, type='info') {
  element.hidden = false;
  element.className = `message ${type}`;
  element.textContent = text;
}
function recognizeField(type, value) {
  const match = findCatalogMatch(value, type);
  return match ? match.canonical : clean(value);
}
function wireHardwareRecognition() {
  populateHardwareSuggestions();
  const extractButton = $('extractSpecs');
  if (extractButton) extractButton.addEventListener('click', () => {
    const text = $('listingText').value;
    const found = extractListingSpecs(text);
    const fields = $('manualForm');
    for (const key of ['cpu','gpu','ram','storage']) {
      const input = fields.elements.namedItem(key);
      if (found[key]) input.value = found[key];
    }
    const status = $('extractStatus');
    status.textContent = found.found.length
      ? `Found: ${found.found.join(', ')}. Review every field before analyzing.`
      : 'No known components found. Try copying more of the listing description or enter details manually.';
    status.className = found.found.length ? 'fine success-text' : 'fine';
    $('manualForm').scrollIntoView({behavior:'smooth',block:'center'});
  });
  for (const type of ['cpu','gpu']) {
    const input = $('manualForm').elements.namedItem(type);
    input.addEventListener('change', () => {
      const match = findCatalogMatch(input.value, type);
      if (match) input.value = match.canonical;
    });
  }
  const pasteButton = $('pasteClipboard');
  pasteButton?.addEventListener('click', async () => {
    const status = $('extractStatus');
    if (!navigator.clipboard?.readText) {
      status.textContent = 'Clipboard access is unavailable here. Click the listing box and press Ctrl+V instead.';
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) { status.textContent = 'Your clipboard is empty. Copy the listing details first.'; return; }
      $('listingText').value = clip;
      status.textContent = 'Clipboard text added. Select Extract hardware to review the detected parts.';
      $('listingText').focus();
    } catch {
      status.textContent = 'Clipboard permission was blocked. Click the listing box and press Ctrl+V instead.';
    }
  });

  const imageInput=$('listingImage'), preview=$('imagePreview'), ocrButton=$('analyzeScreenshot'), ocrText=$('ocrText');
  let previewUrl = '';
  imageInput?.addEventListener('change',()=>{
    const file=imageInput.files?.[0];
    if (!file) { ocrButton.disabled=true; preview.hidden=true; return; }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size>8*1024*1024) {
      $('ocrStatus').textContent='Choose a PNG, JPG, or WEBP image under 8 MB.'; imageInput.value=''; ocrButton.disabled=true; return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=URL.createObjectURL(file); preview.src=previewUrl; preview.hidden=false; ocrButton.disabled=false; $('ocrStatus').textContent='Image ready. Select Read screenshot.';
  });
  ocrButton?.addEventListener('click',async()=>{
    const file=imageInput.files?.[0]; if(!file) return;
    ocrButton.disabled=true; $('ocrStatus').textContent='Loading screenshot text reader…';
    try {
      if(!window.Tesseract?.recognize){
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
          script.onload=resolve; script.onerror=()=>reject(new Error('OCR library could not load'));
          document.head.appendChild(script);
        });
      }
      if(!window.Tesseract?.recognize) throw new Error('OCR library unavailable');
      $('ocrStatus').textContent='Reading image… this can take a little while.';
      const result=await Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text') $('ocrStatus').textContent=`Reading text… ${Math.round((m.progress||0)*100)}%`;}});
      ocrText.value=result.data.text.trim(); $('extractOcrText').disabled=!ocrText.value;
      $('ocrStatus').textContent=ocrText.value?'Text recognized. Review it, then extract the specs.':'No readable text found. Try a clearer screenshot.';
    } catch(err) { $('ocrStatus').textContent='OCR could not load or read this image. Check your connection, try a clearer screenshot, or paste the listing text manually.'; }
    finally { ocrButton.disabled=false; }
  });
  $('extractOcrText')?.addEventListener('click',()=>{
    $('listingText').value=ocrText.value;
    $('extractSpecs').click();
    $('extractStatus').textContent='Screenshot text sent to hardware parser. Review the filled fields.';
  });
}

function classifyRam(value) {
  const s = clean(value).toUpperCase();
  if (/DDR5/.test(s)) return 'DDR5';
  if (/DDR4/.test(s)) return 'DDR4';
  if (/DDR3/.test(s)) return 'DDR3';
  return null;
}
function getGpuTier(value) {
  const s = clean(value).toLowerCase();
  const rules = [
    [/rtx\s*50(90|80|70|60|50)/, 'High-end current generation'],
    [/rtx\s*40(90|80|70|60|50)/, 'High-end to midrange recent generation'],
    [/rtx\s*30(90|80|70|60|50)/, 'Older high-end to midrange generation'],
    [/rtx\s*20(80|70|60|50)/, 'Older midrange to high-end generation'],
    [/gtx\s*16(60|50|50)/, 'Entry to midrange older generation'],
    [/gtx\s*10(80|70|60|50)/, 'Older generation'],
    [/rx\s*9[07]00|rx\s*8[07]00/, 'Recent AMD Radeon generation'],
    [/rx\s*7[89]00|rx\s*77[0-9]0/, 'Upper-midrange AMD Radeon generation'],
    [/rx\s*6[789]00|rx\s*66[0-9]0/, 'Older midrange to high-end AMD generation'],
    [/rx\s*5[789]00|rx\s*56[0-9]0/, 'Older AMD Radeon generation']
  ];
  const found = rules.find(([regex]) => regex.test(s));
  return found ? found[1] : (s ? 'Not in PCCheck reference list' : 'Not provided');
}
function getCpuFamily(value) {
  const s = clean(value).toLowerCase();
  if (/ryzen\s*[9 7 5 3]/.test(s)) return 'AMD Ryzen';
  if (/core\s*(ultra|i[3579])|i[3579]-\d/.test(s)) return 'Intel Core';
  if (/athlon|fx-/.test(s)) return 'Older AMD';
  if (/xeon/.test(s)) return 'Intel Xeon';
  return s ? 'Unrecognized / other' : 'Not provided';
}
function getPriceComparison(d) {
  const asking = Number(d.price);
  const comps = [d.comp1,d.comp2,d.comp3].map(Number).filter(n => Number.isFinite(n) && n > 0);
  if (!(asking > 0) || comps.length < 2) return {available:false,asking,comps};
  const sorted = [...comps].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length/2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
  const ratio = asking / median;
  let verdict, detail;
  if (ratio <= .85) { verdict='Below comparable prices'; detail='The asking price is at least 15% below the median of your comparable listings. Check condition and missing parts carefully; unusually low prices can have a reason.'; }
  else if (ratio <= 1.10) { verdict='In line with comparables'; detail='The asking price is within about 10% of the median of your comparable listings.'; }
  else { verdict='Above comparable prices'; detail=`The asking price is ${Math.round((ratio-1)*100)}% above the median. Consider negotiating or comparing more closely matched systems.`; }
  return {available:true,asking,comps,median,low:Math.min(...comps),high:Math.max(...comps),ratio,verdict,detail};
}
function priceChartMarkup(price) {
  if (!price.available) return `<div class="price-analysis"><h4>Price comparison</h4><p class="report-note">Enter an asking price and at least two comparable prices from similar PCs to generate a chart and recommendation. Compare similar specs, condition, and included accessories.</p></div>`;
  const values=[...price.comps,price.asking];
  const max=Math.max(...values)*1.12;
  const rows=values.map((v,i)=>`<div class="price-bar-row"><span>${i===values.length-1?'This PC':`Comparable ${i+1}`}</span><div class="price-track"><i class="${i===values.length-1?'asking':''}" style="width:${Math.max(3,v/max*100)}%"></i></div><b>${money(v)}</b></div>`).join('');
  return `<div class="price-analysis"><h4>Price comparison</h4><div class="price-verdict"><b>${escapeHTML(price.verdict)}</b><span>Median comparable: ${money(price.median)}</span></div><p class="report-note">${escapeHTML(price.detail)} Comparable range: ${money(price.low)}–${money(price.high)}. Based on ${price.comps.length} asking prices you entered. Use closely matched systems and exclude listings with very different condition or parts.</p><div class="price-chart" role="img" aria-label="Bar chart comparing this PC price with comparable listing prices">${rows}</div><p class="report-note">This is a comparison of asking prices you supplied, not verified sold prices or an automatic live market valuation. It does not adjust for exact model, condition, warranty, or location.</p></div>`;
}

function buildUsedAssessment(d) {
  const warnings = [];
  const positives = [];
  const missing = [];
  const required = [['CPU',d.cpu],['GPU',d.gpu],['RAM',d.ram],['Storage',d.storage]];
  required.forEach(([label,value]) => { if (!clean(value)) missing.push(label); });
  if (!clean(d.psu)) warnings.push('Power supply model and wattage are missing. Ask for the exact PSU model; a generic wattage label is not enough.');
  if (!clean(d.motherboard)) warnings.push('Motherboard model is missing, so CPU support and upgrade options cannot be checked.');
  if (!clean(d.condition)) warnings.push('Condition details are missing. Ask for recent photos, a video test, and proof the PC works under load.');
  if (!clean(d.age)) warnings.push('Age / purchase date is unknown. Ask for a receipt or approximate build date.');
  if (clean(d.ram) && !classifyRam(d.ram)) warnings.push('RAM generation was not recognized. Confirm whether it is DDR4 or DDR5.');
  if (clean(d.storage) && !/ssd|nvme|m\.2|hdd|hard drive/i.test(d.storage)) warnings.push('Storage type is unclear. Confirm whether it is an SSD or hard drive.');
  if (clean(d.condition) && /doesn't work|not working|broken|for parts|untested|no display/i.test(d.condition)) warnings.push('The seller notes a fault or says the PC is untested. Treat it as a repair project, not a ready-to-use gaming PC.');
  if (clean(d.psu) && /no name|generic|unknown|unbranded/i.test(d.psu)) warnings.push('The PSU is described as generic or unknown. Ask for its exact make and model before considering the PC.');
  if (clean(d.condition) && /tested|working|runs well|no issues/i.test(d.condition)) positives.push('The notes say the system has been tested or is working. Request a current demonstration anyway.');
  if (clean(d.storage) && /nvme|ssd/i.test(d.storage)) positives.push('The listing reports solid-state storage. Verify its capacity and health.');

  const completeness = Math.round(((required.length - missing.length) / required.length) * 100);
  const cpuFamily = getCpuFamily(d.cpu);
  const gpuTier = getGpuTier(d.gpu);
  const ramType = classifyRam(d.ram);
  let verdict = 'More information needed';
  let verdictText = 'PCCheck does not have enough verified information to make a confident buying assessment.';
  if (warnings.some(w => /fault|repair project|generic or unknown/.test(w))) {
    verdict = 'High caution';
    verdictText = 'The details entered include a fault or an important power-supply concern. Resolve these issues before treating this as a normal used gaming PC.';
  } else if (completeness === 100 && warnings.length <= 2) {
    verdict = 'Details look promising';
    verdictText = 'The core specifications are present. This is not a guarantee of condition, performance, compatibility, or fair price.';
  }
  const priceComparison = getPriceComparison(d);
  return {
    kind:'used', priceComparison, title:`Used PC · ${clean(d.gpu) || 'GPU not entered'}`,
    summary:`${clean(d.cpu)||'CPU unknown'} / ${clean(d.ram)||'RAM unknown'} / ${clean(d.storage)||'storage unknown'} · ${money(d.price)}`,
    input:d, verdict, verdictText, completeness, warnings, positives, missing,
    insights:[`CPU family: ${cpuFamily}`,`GPU generation guide: ${gpuTier}`,`Memory type: ${ramType || 'Not confirmed'}`],
    createdAt:new Date().toISOString()
  };
}
function normalizeSocket(value) {
  const s = clean(value).toUpperCase().replace(/\s+/g,'');
  if (!s || /other|unknown/.test(s)) return '';
  const aliases = {'AM5':'AM5','AM4':'AM4','LGA1700':'LGA1700','LGA1851':'LGA1851','LGA1200':'LGA1200','LGA1151':'LGA1151'};
  return aliases[s] || s;
}
function estimateGpuPower(gpu) {
  const s = clean(gpu).toLowerCase();
  const match = s.match(/(?:rtx|rx)\s*(\d{4})/);
  if (!match) return null;
  const n = Number(match[1]);
  if (/rtx/.test(s)) {
    if (n >= 5090) return 575; if (n >= 5080) return 360; if (n >= 5070) return 250; if (n >= 5060) return 180;
    if (n >= 4090) return 450; if (n >= 4080) return 320; if (n >= 4070) return 220; if (n >= 4060) return 115;
    if (n >= 3090) return 350; if (n >= 3080) return 320; if (n >= 3070) return 220; if (n >= 3060) return 170;
    if (n >= 2080) return 215; if (n >= 2070) return 175; if (n >= 2060) return 160;
  }
  if (/rx/.test(s)) {
    if (n >= 7900) return 350; if (n >= 7800) return 263; if (n >= 7700) return 245;
    if (n >= 6900) return 300; if (n >= 6800) return 250; if (n >= 6700) return 230; if (n >= 6600) return 132;
  }
  return null;
}
function buildCompatibility(d) {
  const checks = [];
  const issues = [];
  const add = (name, status, detail, issue='') => {
    checks.push({name,status,detail});
    if (issue) issues.push(issue);
  };
  const cpuSocket = normalizeSocket(d.cpuSocket);
  const boardSocket = normalizeSocket(d.boardSocket);
  if (cpuSocket && boardSocket) {
    const ok = cpuSocket === boardSocket;
    add('CPU and motherboard socket', ok?'pass':'fail', ok?`Both are ${cpuSocket}. Socket match is necessary, but exact CPU support and BIOS still need checking.`:`CPU socket is ${cpuSocket}, but the motherboard socket is ${boardSocket}.`, ok?'':'The CPU and motherboard sockets do not match.');
  } else add('CPU and motherboard socket','unknown','Select both sockets. A matching socket alone does not guarantee that the board supports the exact CPU.');

  const ramA = classifyRam(d.ramType), ramB = classifyRam(d.boardRam);
  if (ramA && ramB) {
    const ok = ramA === ramB;
    add('RAM generation',ok?'pass':'fail',ok?`Both are ${ramA}. Check the board's supported speeds and memory configuration.`:`The selected memory is ${ramA}, while the board supports ${ramB}.`,'The RAM generation does not match the motherboard.');
  } else add('RAM generation','unknown','Choose the installed RAM type and the motherboard-supported type. DDR4 and DDR5 are not interchangeable.');

  const ramCap = Number(d.ramCapacity), maxRam = Number(d.boardMaxRam);
  if (ramCap > 0 && maxRam > 0) {
    const ok = ramCap <= maxRam;
    add('Memory capacity',ok?'pass':'fail',ok?`${ramCap}GB is within the entered ${maxRam}GB board limit.`:`${ramCap}GB exceeds the entered ${maxRam}GB board limit.`,ok?'':'The planned RAM capacity exceeds the motherboard limit entered.');
  } else add('Memory capacity','unknown',"Optional: enter planned RAM capacity and the motherboard maximum supported capacity.");

  const board = clean(d.boardForm).toLowerCase(), c = clean(d.caseForm).toLowerCase();
  if (board && c) {
    const fits = board === c || (board === 'micro-atx' && c === 'atx') || (board === 'mini-itx' && ['atx','micro-atx','mini-itx'].includes(c));
    add('Motherboard and case size',fits?'pass':'fail',fits?'The selected case category generally supports this board size. Verify the exact case specification.':'The selected case category does not normally support this motherboard size.','The motherboard may not fit the selected case.');
  } else add('Motherboard and case size','unknown','Select both sizes. Exact case model specifications take priority.');

  const gpuW = Number(d.gpuPower), cpuW = Number(d.cpuPower), psuW = Number(d.psuWatts);
  if (gpuW > 0 && psuW > 0) {
    const estimatedLoad = gpuW + (cpuW > 0 ? cpuW : 100) + 75;
    const target = Math.ceil(estimatedLoad * 1.3 / 50) * 50;
    const status = psuW >= target ? 'pass' : 'warn';
    add('Power capacity (user-entered estimates)',status,`Estimated load is about ${Math.round(estimatedLoad)}W and PCCheck's conservative planning target is about ${target}W. Entered PSU: ${psuW}W. This rough screen does not assess PSU quality, age, transient spikes, or connectors.`,status==='warn'?'The PSU wattage entered is below this rough planning target. Check the exact GPU and PSU manufacturer guidance before buying.':'');
  } else add('Power capacity','unknown','Enter GPU power and PSU wattage. CPU power is optional; PCCheck uses a modest default if it is blank. Use manufacturer specifications rather than guessing.');

  const gpuLen=Number(d.gpuLength), caseGpu=Number(d.caseGpuMax);
  if (gpuLen>0 && caseGpu>0) {
    const ok=gpuLen<=caseGpu;
    add('GPU physical clearance',ok?'pass':'fail',ok?`GPU length ${gpuLen}mm is within the entered ${caseGpu}mm limit. Check width and radiator/fan clearance too.`:`GPU length ${gpuLen}mm exceeds the entered ${caseGpu}mm limit.`,'The GPU is longer than the case clearance entered.');
  } else add('GPU physical clearance','unknown',"Optional: compare the exact GPU length with the case maximum GPU clearance.");

  const coolerH=Number(d.coolerHeight), caseCooler=Number(d.caseCoolerMax);
  if (coolerH>0 && caseCooler>0) {
    const ok=coolerH<=caseCooler;
    add('CPU cooler clearance',ok?'pass':'fail',ok?`Cooler height ${coolerH}mm is within the entered ${caseCooler}mm limit. Verify mounting support and RAM clearance.`:`Cooler height ${coolerH}mm exceeds the entered ${caseCooler}mm limit.`,'The CPU cooler is taller than the case clearance entered.');
  } else add('CPU cooler clearance','unknown',"Optional: compare the cooler height with the case maximum CPU cooler height.");

  add('Exact CPU / BIOS support','warn','Not verified. Check the motherboard CPU support list for the exact CPU model and the minimum required BIOS version.','');
  add('PSU quality and connectors','warn','Not verified. Confirm the exact PSU model, age, independent reviews, and the native power connectors required by the GPU.','');
  add('Storage and M.2 details','warn','Not verified. Check drive interface, M.2 slot support, lane sharing, heatsink clearance, and available SATA ports.','');

  const failed=checks.filter(c=>c.status==='fail').length;
  const warnings=checks.filter(c=>c.status==='warn').length;
  const unknown=checks.filter(c=>c.status==='unknown').length;
  const passed=checks.filter(c=>c.status==='pass').length;
  const status=failed?'Compatibility conflicts found':unknown?'Partially checked':warnings?'Basic checks passed · verification needed':'Basic checks passed';
  return {kind:'build',title:`Custom build · ${clean(d.gpu)||'GPU not entered'}`,summary:`${clean(d.cpu)||'CPU not entered'} / ${clean(d.ramType)||'RAM not entered'} / ${clean(d.storage)||'storage not entered'} · ${money(d.price)} budget`,input:d,status,checks,issues,passed,failed,warnings,unknown,createdAt:new Date().toISOString()};
}

function reportMarkup(report) {
  const isUsed = report.kind === 'used';
  const status = isUsed ? report.verdict : report.status;
  const tone = /High caution|conflicts found|problems found/.test(status) ? 'bad' : /promising|checks passed/.test(status) ? 'good' : 'neutral';
  let body = '';
  if (isUsed) {
    body += `<div class="report-meter"><div><span>Specification completeness</span><b>${report.completeness}%</b></div><div class="meter"><i style="width:${report.completeness}%"></i></div></div>`;
    body += `<h4>Hardware overview</h4><ul>${report.insights.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`;
    if (report.missing.length) body += `<h4>Missing core details</h4><ul>${report.missing.map(x=>`<li>${escapeHTML(x)} not entered</li>`).join('')}</ul>`;
    if (report.warnings.length) body += `<h4>Buyer checks</h4><ul class="warning-list">${report.warnings.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`;
    if (report.positives.length) body += `<h4>Potential positives to verify</h4><ul>${report.positives.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`;
    body += `<p class="report-note">Asking price: <b>${money(report.input.price)}</b>.</p>${priceChartMarkup(report.priceComparison || getPriceComparison(report.input))}`;
  } else {
    body += `<div class="check-list">${report.checks.map(c=>`<div class="check-row"><span class="check-dot ${c.status}">${c.status==='pass'?'✓':c.status==='fail'?'!':c.status==='warn'?'!':'?'}</span><div><b>${escapeHTML(c.name)}</b><p>${escapeHTML(c.detail)}</p></div></div>`).join('')}</div>`;
    if (report.issues.length) body += `<h4>Fix before buying parts</h4><ul class="warning-list">${report.issues.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`;
    body += `<p class="report-note">${report.passed} passed · ${report.failed} conflict(s) · ${report.warnings} warnings · ${report.unknown} not checked.</p>`;
    body += `<p class="report-note">These are basic checks only. They do not verify BIOS support, physical clearances, connector availability, cooler fit, or every model-specific requirement.</p>`;
  }
  return `<div class="report-result"><div class="report-top"><div><span class="mini-label">PCHECK REPORT</span><h3>${escapeHTML(report.title)}</h3></div><span class="verdict ${tone}">${escapeHTML(status)}</span></div><p class="report-summary">${escapeHTML(report.summary)}</p>${body}${source}<div class="report-actions"><button class="btn ghost" type="button" id="saveCurrent">Save report</button><button class="btn ghost" type="button" id="printReport">Print / PDF</button><button class="btn ghost" type="button" id="exportReport">Export JSON</button><button class="text-button" type="button" id="closeReport">Close</button></div></div>`;
}
function openReport(report) {
  activeReport = report;
  const target = report.kind === 'build' ? $('buildReportOutput') : $('reportOutput');
  target.innerHTML = reportMarkup(report);
  target.hidden = false;
  $('saveCurrent')?.addEventListener('click', () => saveReport(report));
  $('closeReport')?.addEventListener('click', () => { target.hidden = true; activeReport = null; });
  $('printReport')?.addEventListener('click', () => { window.print(); });
  $('exportReport')?.addEventListener('click', () => downloadJSON(report, 'pccheck-report.json'));
  target.scrollIntoView({behavior:'smooth',block:'start'});
}
function saveReport(report) {
  const copy = {...report, id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), savedAt:new Date().toISOString()};
  reports.unshift(copy);
  persistReports();
  $('saveCurrent').textContent = 'Saved ✓';
  $('saveCurrent').disabled = true;
}
function renderReports() {
  const host = $('savedReports');
  if (!reports.length) { host.innerHTML = '<div class="empty">No saved reports yet. Create and save a report to see it here.</div>'; return; }
  host.innerHTML = reports.map(r => `<article class="saved-card"><div><h4>${escapeHTML(r.title)}</h4><p>${escapeHTML(r.summary)} · ${new Date(r.savedAt || r.createdAt).toLocaleDateString()}</p></div><div class="saved-actions"><button type="button" data-open="${escapeHTML(r.id)}">View</button><button type="button" data-delete="${escapeHTML(r.id)}">Delete</button></div></article>`).join('');
}
$('savedReports').addEventListener('click', event => {
  const openId = event.target.dataset.open;
  const deleteId = event.target.dataset.delete;
  if (openId) { const report = reports.find(r=>r.id===openId); if (report) openReport(report); }
  if (deleteId) { reports = reports.filter(r=>r.id!==deleteId); persistReports(); }
});

$('manualForm').addEventListener('submit', event => {
  event.preventDefault();
  const d = formData(event.currentTarget);
  if (!d.cpu.trim() || !d.gpu.trim() || !d.ram.trim() || !d.storage.trim()) return;
  d.cpu = recognizeField('cpu', d.cpu);
  d.gpu = recognizeField('gpu', d.gpu);
  openReport(buildUsedAssessment(d));
});
$('buildForm').addEventListener('submit', event => {
  event.preventDefault();
  const d = formData(event.currentTarget);
  d.cpu = recognizeField('cpu', d.cpu);
  d.gpu = recognizeField('gpu', d.gpu);
  openReport(buildCompatibility(d));
});


function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('exportAll')?.addEventListener('click',()=>downloadJSON(reports,'pccheck-saved-reports.json'));
$('clearSaved')?.addEventListener('click',()=>{
  if (!reports.length) return;
  if (confirm('Delete every saved PCCheck report from this browser? This cannot be undone.')) { reports=[]; persistReports(); }
});

renderReports();
wireHardwareRecognition();

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.Capacitor?.isNativePlatform?.()) navigator.serviceWorker.register('./sw.js').catch(()=>{});
