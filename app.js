'use strict';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'pccheck_reports_v4';
const APP_VERSION = '2.1.0';
const knownHosts = [
  ['facebook.com', 'Facebook Marketplace'], ['fb.com', 'Facebook'],
  ['ebay.com', 'eBay'], ['craigslist.org', 'Craigslist'], ['offerup.com', 'OfferUp']
];


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
  const cpu = findCatalogMatch(text,'cpu');
  const gpu = findCatalogMatch(text,'gpu');
  const ram = clean(text).match(/\b(8|16|24|32|48|64|96|128|256)\s*gb\s*(?:of\s*)?(ddr\s*[345])\b/i);
  const storage = clean(text).match(/\b(256|500|512|1000|1024|2000|2048|4000|4096)\s*(gb|tb)\s*(?:m\.2\s*)?(nvme|ssd|hdd|hard\s*drive)\b/i)
    || clean(text).match(/\b(\d+)\s*(tb|gb)\s*(nvme|ssd|hdd)\b/i);
  return {
    cpu:cpu?.canonical || '',
    gpu:gpu?.canonical || '',
    ram:ram ? `${ram[1]}GB ${ram[2].replace(/\s/g,'').toUpperCase()}` : '',
    storage:storage ? `${storage[1]}${storage[2].toUpperCase()} ${storage[3].toUpperCase().replace(/\s/g,'')}` : '',
    found:[cpu&&'CPU',gpu&&'GPU',ram&&'RAM',storage&&'Storage'].filter(Boolean)
  };
}

let reports = loadReports();
let activeReport = null;

function loadReports() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem('pccheck_reports_v3');
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
  renderReports();
}
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
function detectMarketplace(raw) {
  let url;
  try { url = new URL(raw); } catch { return {error:'Enter a complete URL, including https://'}; }
  if (!['http:', 'https:'].includes(url.protocol)) return {error:'Only http and https links are accepted.'};
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const match = knownHosts.find(([domain]) => host === domain || host.endsWith(`.${domain}`));
  return {url:url.href, host, source:match ? match[1] : 'Other website'};
}

$('urlForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const result = detectMarketplace($('listingUrl').value.trim());
  const box = $('linkMessage');
  if (result.error) { showMessage(box, result.error, 'error'); return; }
  $('sourceUrl').value = result.url;
  $('sourceName').value = result.source;
  showMessage(box, `${result.source} link recognized. PCCheck cannot reliably read product pages directly because many sites block automated access. Copy the listing title/specifications into the Paste Listing Details box below, or enter them manually. The source link will be attached to your report.`, 'success');
  $('manualForm').scrollIntoView({behavior:'smooth', block:'start'});
});


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
  return {
    kind:'used', title:`Used PC · ${clean(d.gpu) || 'GPU not entered'}`,
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
    body += `<p class="report-note">Asking price: <b>${money(report.input.price)}</b>. PCCheck does not have live market-price data in this version, so it cannot say whether the asking price is fair.</p>`;
  } else {
    body += `<div class="check-list">${report.checks.map(c=>`<div class="check-row"><span class="check-dot ${c.status}">${c.status==='pass'?'✓':c.status==='fail'?'!':c.status==='warn'?'!':'?'}</span><div><b>${escapeHTML(c.name)}</b><p>${escapeHTML(c.detail)}</p></div></div>`).join('')}</div>`;
    if (report.issues.length) body += `<h4>Fix before buying parts</h4><ul class="warning-list">${report.issues.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`;
    body += `<p class="report-note">${report.passed} passed · ${report.failed} conflict(s) · ${report.warnings} warnings · ${report.unknown} not checked.</p>`;
    body += `<p class="report-note">These are basic checks only. They do not verify BIOS support, physical clearances, connector availability, cooler fit, or every model-specific requirement.</p>`;
  }
  const source = report.input.sourceUrl ? `<p class="report-note">Listing source: <a href="${escapeHTML(report.input.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(report.input.sourceName || 'Open listing')}</a></p>` : '';
  return `<div class="report-result"><div class="report-top"><div><span class="mini-label">PCHECK REPORT</span><h3>${escapeHTML(report.title)}</h3></div><span class="verdict ${tone}">${escapeHTML(status)}</span></div><p class="report-summary">${escapeHTML(report.summary)}</p>${body}${source}<div class="report-actions"><button class="btn ghost" type="button" id="saveCurrent">Save report</button><button class="btn ghost" type="button" id="printReport">Print / PDF</button><button class="btn ghost" type="button" id="exportReport">Export JSON</button><button class="text-button" type="button" id="closeReport">Close</button></div></div>`;
}
function openReport(report) {
  activeReport = report;
  const target = report.kind === 'build' ? $('buildReportOutput') : $('reportOutput');
  target.innerHTML = reportMarkup(report);
  target.hidden = false;
  $('saveCurrent').addEventListener('click', () => saveReport(report));
  $('closeReport').addEventListener('click', () => { target.hidden = true; activeReport = null; });
  $('printReport').addEventListener('click', () => { window.print(); });
  $('exportReport').addEventListener('click', () => downloadJSON(report, 'pccheck-report.json'));
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
$('exportAll').addEventListener('click',()=>downloadJSON(reports,'pccheck-saved-reports.json'));
$('clearSaved').addEventListener('click',()=>{
  if (!reports.length) return;
  if (confirm('Delete every saved PCCheck report from this browser? This cannot be undone.')) { reports=[]; persistReports(); }
});

const modal = $('accountModal');
$('accountBtn').addEventListener('click', () => { modal.hidden = false; });
$('closeModal').addEventListener('click', () => { modal.hidden = true; });
$('modalOk').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });
renderReports();
wireHardwareRecognition();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
