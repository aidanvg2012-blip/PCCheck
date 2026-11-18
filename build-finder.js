'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const SUPABASE_URL = 'https://rtssojyophcgybdhhqzz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_kK8xaomzreBOVF4Dnvy4UQ_uuVvLWH3';
  const FREE_LIMIT = 1;
  let client = null, session = null, access = null, catalog = null, lastBuilds = [];

  const CPU_RANK = [
    ['9950X3D',115],['9800X3D',110],['9950X',108],['9900X3D',105],['7950X3D',104],['7950X',101],['9900X',99],['7900X3D',98],['7900X',95],['7800X3D',101],['9700X',92],['7700X',89],['9600X',86],['7600X',82],['7600',80],['5900X',79],['5800X3D',82],['5700X',72],['5600X',69],['5600',66],['285K',108],['265K',96],['14900K',107],['14700K',101],['14600K',92],['13700K',94],['13600K',88],['13400F',80],['12700K',88],['12400F',74]
  ];
  const GPU_RANK = [
    ['RTX 5090',125],['RTX 5080',112],['RTX 5070 TI',104],['RTX 5070',96],['RTX 5060 TI',84],['RTX 5060',76],['RTX 4090',122],['RTX 4080 SUPER',110],['RTX 4080',106],['RTX 4070 TI SUPER',103],['RTX 4070 TI',98],['RTX 4070 SUPER',95],['RTX 4070',88],['RTX 4060 TI',78],['RTX 4060',70],['RX 9070 XT',106],['RX 9070',99],['RX 7900 XTX',111],['RX 7900 XT',103],['RX 7800 XT',92],['RX 7700 XT',83],['RX 7600 XT',72],['RX 7600',67],['RX 6800 XT',91],['RX 6700 XT',80],['RX 6600 XT',68],['RX 6600',62]
  ];
  const money = n => Number(n).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
  const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const price = p => Number(p?.lowestPrice) > 0 ? Number(p.lowestPrice) : Infinity;
  function score(name, list) { const n=String(name||'').toUpperCase().replace(/[^A-Z0-9]+/g,' '); const row=list.find(([key])=>n.includes(key)); return row?.[1] || 0; }
  function cpuMeta(p) {
    const n=p.name.toUpperCase();
    if (/RYZEN/.test(n)) {
      if (/(5600|5700X|5800X3D|5900X|5950X)/.test(n)) return {socket:'AM4',ram:'DDR4',watts:/5900|5950/.test(n)?142:105};
      return {socket:'AM5',ram:'DDR5',watts:/9950|7950|9900/.test(n)?170:/7900|9800X3D|7800X3D/.test(n)?120:90};
    }
    if (/CORE ULTRA/.test(n)) return {socket:'LGA1851',ram:'DDR5',watts:180};
    if (/CORE I[579]/.test(n)) return {socket:'LGA1700',ram:'DDR5',watts:/I9|14900|13900/.test(n)?253:/I7|14700|13700/.test(n)?200:150};
    return null;
  }
  function socketBoard(name,socket,size='any') {
    const n=name.toUpperCase();
    let chipset=false;
    if(socket==='AM5') chipset=/A620|B650|B850|X670|X870/.test(n);
    else if(socket==='AM4') chipset=/A520|B450|B550|X470|X570/.test(n);
    else if(socket==='LGA1700') chipset=/B760|Z790|Z690|H770|B660/.test(n) && !/DDR4|D4\b/.test(n);
    else if(socket==='LGA1851') chipset=/B860|Z890/.test(n);
    if(!chipset) return false;
    const matx=/\b(?:A620M|B650M|B850M|A520M|B550M|B760M|B660M|H610M)\b|MICRO.?ATX|M-ATX|MORTAR/.test(n);
    const mini=/MINI.?ITX|\bITX\b/.test(n);
    if(size==='compact') return matx||mini;
    if(size==='atx') return !matx&&!mini;
    return true;
  }
  function ramFits(p,type,capacity) {
    const n=p.name.toUpperCase();
    const gen=n.includes(type);
    const cap=(n.match(/(?:^|\D)(8|16|24|32|48|64|96|128)\s*GB/)||[])[1];
    return gen && Boolean(cap) && Number(cap)>=capacity;
  }
  function storageFits(p,capacity) {
    const n=p.name.toUpperCase();
    const isNvme=/NVME|M\.2/.test(n);
    const match=n.match(/(?:^|\D)(256|500|512|1|2|4|8)\s*TB?/);
    if(!isNvme||!match) return false;
    let size=Number(match[1]); if(size<=8 && /TB/.test(n)) size*=1000;
    if(size<=8 && size<10) size*=1000;
    return size>=capacity;
  }
  function psuWatts(p) {
    const n=p.name.toUpperCase();
    const m=n.match(/(?:RM|GX|GF|FOCUS|PURE POWER|MAG|TUF|CORE|LEADEX)[\s-]*(\d{3,4})\s*W?/);
    const explicit=n.match(/(\d{3,4})\s*W/);
    return Number((explicit||m||[])[1]||0);
  }
  function knownBrand(p,kind) {
    const n=p.name.toLowerCase();
    const brands={
      motherboard:/asus|msi|gigabyte|asrock/,
      ram:/corsair|kingston|g skill|g\.skill|crucial|teamgroup|patriot|adata/,
      storage:/samsung|western digital|wd |crucial|kingston|solidigm|sk hynix|seagate|lexar/,
      psu:/corsair|seasonic|be quiet|super flower|msi mag|thermaltake toughpower|evga supernova/,
      case:/corsair|fractal|lian li|nzxt|montech|phanteks|be quiet|cooler master/
    };
    return brands[kind]?.test(n) || false;
  }
  function pickCheapest(list,predicate) { return (list||[]).filter(p=>price(p)<Infinity&&predicate(p)).sort((a,b)=>price(a)-price(b))[0]||null; }
  function componentsFor(cpu,gpu,prefs,products) {
    const meta=cpuMeta(cpu); if(!meta) return null;
    const gpuWatts= /RTX 5090/.test(gpu.name)?575:/RTX 5080|RX 7900 XTX/.test(gpu.name)?360:/RTX 5070|RX 9070|RX 7900 XT|RX 7800 XT/.test(gpu.name)?280:/RTX 5060|RX 7600|RX 7700|RX 6700|RX 6600/.test(gpu.name)?190:230;
    const board=pickCheapest(products.motherboard,p=>knownBrand(p,'motherboard')&&socketBoard(p.name,meta.socket,prefs.size));
    const ram=pickCheapest(products.ram,p=>knownBrand(p,'ram')&&ramFits(p,meta.ram,Number(prefs.ram)));
    const storage=pickCheapest(products.storage,p=>knownBrand(p,'storage')&&storageFits(p,Number(prefs.storage)));
    const targetPsu=Math.ceil((gpuWatts+meta.watts+100)*1.3/50)*50;
    const psu=pickCheapest(products.psu,p=>knownBrand(p,'psu')&&psuWatts(p)>=targetPsu);
    const caseFit=prefs.size==='compact'?/mini.?itx|micro.?atx|m.?atx|compact/i:prefs.size==='atx'?/atx|mid tower|full tower/i:/mid tower|atx|micro.?atx|airflow|mesh/i;
    const kase=pickCheapest(products.case,p=>knownBrand(p,'case')&&caseFit.test(p.name));
    const parts=[['CPU',cpu],['GPU',gpu],['Motherboard',board],['Memory',ram],['Storage',storage],['Power supply',psu],['Case',kase]];
    const complete=parts.every(x=>x[1]);
    const total=parts.reduce((sum,x)=>sum+(x[1]?price(x[1]):0),0);
    return {parts,complete,total,targetPsu,socket:meta.socket,ramType:meta.ram,gpuWatts,estimatedSystemWatts:gpuWatts+meta.watts+100};
  }
  function buildOptionsFor(prefs) {
    const products=catalog.products;
    const cpus=(products.cpu||[]).filter(p=>cpuMeta(p)&&score(p.name,CPU_RANK)>0&&(!prefs.platform||prefs.platform==='any'||(prefs.platform==='amd'?/ryzen/i.test(p.name):/core/i.test(p.name))));
    const gpus=(products.gpu||[]).filter(p=>score(p.name,GPU_RANK)>0);
    const gpuWeight=prefs.use==='creator'||prefs.use==='workstation'?0.95:prefs.resolution==='4k'?1.25:prefs.resolution==='none'?0.45:prefs.resolution==='1080'?0.85:1.05;
    const cpuWeight=prefs.use==='creator'||prefs.use==='workstation'?1.3:prefs.use==='streaming'?1.12:1;
    const variants=[
      {key:'value',title:'Value build',budget:Math.round(prefs.budget*.82),multiplier:1,desc:'Prioritizes the lowest total while keeping the main platform balanced.'},
      {key:'recommended',title:'Recommended build',budget:prefs.budget,multiplier:1.1,desc:'Balances performance, budget, and the workload you selected.'},
      {key:'stretch',title:'Performance option',budget:Math.round(prefs.budget*1.12),multiplier:1.25,desc:'Explores a stronger parts mix; may exceed your stated budget.'}
    ];
    return variants.map(variant=>{
      let best=null;
      for(const cpu of cpus) for(const gpu of gpus) {
        const parts=componentsFor(cpu,gpu,prefs,products);
        if(!parts?.complete) continue;
        const cost=parts.total;
        const cpuScore=score(cpu.name,CPU_RANK)*cpuWeight;
        const gpuScore=score(gpu.name,GPU_RANK)*gpuWeight;
        let scoreValue=cpuScore+gpuScore;
        if(prefs.priority==='value') scoreValue=scoreValue/(Math.max(cost,1)/1000);
        if(prefs.priority==='quiet') scoreValue-=(parts.estimatedSystemWatts||0)*.035;
        if(prefs.priority==='upgrade'&&parts.socket==='AM5') scoreValue+=9;
        if(prefs.priority==='performance') scoreValue+=cpuScore*.08+gpuScore*.12;
        const within=cost<=variant.budget;
        const adjusted=scoreValue-(within?0:((cost-variant.budget)/variant.budget)*95);
        if(!best||adjusted>best.adjusted||(adjusted===best.adjusted&&cost<best.parts.total)) best={parts,cpu,gpu,adjusted,within,scoreValue};
      }
      if(!best) return {...variant,unavailable:true,reason:'The current catalog did not contain a complete, priced set of compatible parts for this option.'};
      return {...variant,...best.parts,unavailable:false,withinBudget:best.within,scoreValue:best.scoreValue};
    });
  }
  function partMarkup(label,p) {
    if(!p)return '<div class="build-part"><div class="build-part-top"><span>'+escape(label)+'</span><b>Not found</b></div><p class="part-unavailable">No exact tracked part price. Choose a verified model manually.</p></div>';
    const live=p.livePrice||null,offers=Array.isArray(live?.offers)?live.offers:[];
    const offerMarkup=offers.length?'<details class="live-offers"><summary>'+offers.length+' current retailer offers</summary><div>'+offers.map(offer=>'<div class="live-offer"><span><b>'+escape(offer.merchant)+'</b><small>'+escape(offer.availability||'Availability not confirmed')+(offer.shipping?' · '+escape(offer.shipping):'')+(offer.tax?' · tax '+escape(offer.tax):'')+'</small></span><strong>'+money(offer.price)+'</strong><a href="'+escape(offer.url)+'" target="_blank" rel="noopener noreferrer">Open ↗</a></div>').join('')+'</div></details>':'<p class="part-unavailable">'+(live?.found?'No current retailer offers were returned.':'No exact live retailer match; no current price assigned.')+'</p>';
    const priceLabel=live?.lowestPrice?money(live.lowestPrice):'No live price';
    return '<div class="build-part"><div class="build-part-top"><span>'+escape(label)+'</span><b>'+priceLabel+'</b></div><p class="build-part-name">'+escape(p.name)+'</p><div class="build-part-prices"><span>Live lowest: <strong>'+escape(live?.lowestRetailer||'Not available')+'</strong></span><span>Weekly reference: '+money(p.lowestPrice)+'</span><span>Checked: '+escape(live?.checkedAt?new Date(live.checkedAt).toLocaleString():'not checked')+'</span></div>'+(live?.productUrl?'<a href="'+escape(live.productUrl)+'" target="_blank" rel="noopener noreferrer">PCPartPicker product ↗</a>':p.sourceUrl?'<a href="'+escape(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Weekly source ↗</a>':'')+offerMarkup+'</div>';
  }
  function optionMarkup(o,index) {
    if(o.unavailable)return '<article class="build-option"><span class="mini-label">'+escape(o.title.toUpperCase())+'</span><h3>Not enough verified data</h3><p>'+escape(o.reason)+'</p></article>';
    const parts=o.parts.map(([label,p])=>partMarkup(label,p)).join('');
    const warnings=['Exact motherboard CPU/BIOS support still needs checking.','Case and GPU/cooler physical clearance are not verified from this catalog.','PSU wattage is estimated; quality, connectors, and transient behavior must be checked against manufacturer guidance.','CPU cooler is not included in this parts subtotal. Check whether the selected CPU includes a stock cooler or budget for a compatible cooler.','Retailer prices can change; shipping and tax may be missing.'];
    const budgetNote=o.liveComplete?(o.withinBudget?'Within target budget':'Above this option’s target budget'):'Partial estimate — '+o.livePricedCount+' of '+o.parts.length+' parts priced; unpriced parts are excluded';
    const liveTotalText=o.livePricedCount?money(o.liveSubtotal):'No live prices';
    return '<article class="build-option '+(index===1?'recommended':'')+'"><div class="build-option-head"><span>'+escape(o.title.toUpperCase())+'</span><span>'+(index===1?'BEST FIT':'ALTERNATIVE')+'</span></div><h3>'+escape(o.socket)+' platform</h3><p>'+escape(o.desc||'')+'</p><div class="build-total"><small>LIVE PARTS ESTIMATE · '+o.livePricedCount+'/'+o.parts.length+' PRICED</small><b>'+money(o.liveSubtotal)+'</b><em>'+escape(budgetNote)+'</em></div><div class="build-parts">'+parts+'</div><div class="build-warning">'+warnings.map(escape).join('<br>')+'</div><button class="btn ghost" type="button" data-export-option="'+index+'">Export this parts list ↓</button></article>';
  }
  async function getUsage(method='GET') {
    const response=await fetch('/api/build-finder-usage',{method,headers:{Authorization:'Bearer '+session.access_token,Accept:'application/json'}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Could not verify Build Finder access.');
    return data;
  }
  function renderUsage(data) {
    access=data;
    $('accessTitle').textContent=data.hasPlus?'PCCheck Plus · unlimited reviews':'Free account · one-time review';
    $('usageCount').textContent=data.hasPlus?'∞':String(data.remaining);
    $('usageLabel').textContent=data.hasPlus?'unlimited reviews':(data.remaining>0?'free review remaining':'free review used');
    $('accessCopy').textContent=data.hasPlus?'Your Plus membership unlocks unlimited researched build reviews.':'Your account includes one full parts plan, live retailer price check, and compatibility review. Plus removes the limit.';
    $('accountLink').textContent='Account & membership ↗';
    $('accountLink').href='index.html#account';
    if(!data.hasPlus&&data.remaining<=0){
      $('finderWizard').hidden=true;
      $('finderResults').hidden=false;
      $('buildOptions').innerHTML='<div class="finder-locked"><h3>Your free build review has been used</h3><p>You have used your one included build review. PCCheck Plus is designed for unlimited research. Your existing saved/exported reports remain yours.</p><a class="btn ghost" href="index.html#account">View account and Plus information ↗</a></div>';
    } else $('finderWizard').hidden=false;
  }
  function readPrefs(){return {use:$('needUse').value,resolution:$('needResolution').value,budget:Number($('needBudget').value),priority:$('needPriority').value,ram:Number($('needRam').value),storage:Number($('needStorage').value),platform:$('needPlatform').value,size:$('needSize').value};}
  async function generate(){
    const button=$('generateBuilds'), status=$('finderStatus');
    button.disabled=true;button.textContent='Researching component catalog…';status.textContent='Loading tracked parts and checking your free-plan access…';
    try{
      await ensureCatalog();
      let usage=await getUsage('GET');
      if(!usage.hasPlus&&usage.remaining<=0){renderUsage(usage);throw new Error('You have used your one free Build Finder review. Plus unlocks unlimited reviews.');}
      const liveConfigResponse=await fetch('/api/live-part-prices',{headers:{Accept:'application/json'}});
      const liveConfig=await liveConfigResponse.json().catch(()=>({}));
      if(!liveConfigResponse.ok||!liveConfig.configured)throw new Error(liveConfig.error||'Live retailer pricing is not configured yet. A parent/guardian must add APISH_API_KEY to Vercel.');
      const prefs=readPrefs();lastBuilds=buildOptionsFor(prefs);
      const usable=lastBuilds.filter(x=>!x.unavailable);
      if(!usable.length)throw new Error('The weekly catalog did not contain enough exact, compatible parts for this budget. Try a larger budget or another platform. No free review was used.');
      const uniqueParts=new Map();
      lastBuilds.filter(x=>!x.unavailable).forEach(option=>option.parts.forEach(([label,part])=>{
        if(!part)return;
        const model=part.model||part.name;
        const key=part.category+':'+(part.partNumber||model||part.name);
        if(!uniqueParts.has(key))uniqueParts.set(key,{key,category:part.category,name:part.name,model});
      }));
      const liveResponse=await fetch('/api/live-part-prices',{
        method:'POST',
        headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({parts:[...uniqueParts.values()]})
      });
      const liveData=await liveResponse.json().catch(()=>({}));
      if(!liveResponse.ok)throw new Error(liveData.error||'Live retailer prices could not be checked. Your free review was not used.');
      const liveMatches=Object.values(liveData.matches||{});
      if(!liveMatches.some(match=>match?.lowestPrice))throw new Error('No exact live retailer offers matched the selected parts. Check the component models and try again; your free review was not used.');
      const checkedAt=liveData.checkedAt||new Date().toISOString();
      for(const option of lastBuilds.filter(x=>!x.unavailable)){
        let subtotal=0,priced=0;
        option.parts.forEach(([label,part])=>{
          if(!part)return;
          const model=part.model||part.name;
          const key=part.category+':'+(part.partNumber||model||part.name);
          const live=liveData.matches?.[key]||null;
          part.livePrice=live;
          if(live?.lowestPrice){subtotal+=Number(live.lowestPrice);priced++;}
        });
        option.liveSubtotal=subtotal;
        option.livePricedCount=priced;
        option.liveComplete=priced===option.parts.length;
        option.total=subtotal;
        option.withinBudget=option.liveComplete?subtotal<=option.budget:null;
      }
      usage=await getUsage('POST');
      if(!usage.allowed&&!usage.hasPlus){renderUsage(usage);throw new Error(usage.error||'Your one free build review has already been used.');}
      renderUsage(usage);
      $('resultsSummary').textContent=prefs.use+' · '+(prefs.resolution==='none'?'general workloads':prefs.resolution+'p target')+' · '+money(prefs.budget)+' parts budget. Each option includes exact-model retailer checks and a price subtotal for the offers found.';
      $('buildOptions').innerHTML=lastBuilds.map(optionMarkup).join('');
      $('datasetStamp').textContent='Live retailer check: '+liveData.source+' · checked '+new Date(checkedAt).toLocaleString()+' · candidate catalog: '+catalog.source+' '+catalog.week;
      $('finderResults').hidden=false;$('finderResults').scrollIntoView({behavior:'smooth',block:'start'});
      status.textContent=usage.hasPlus?'Plus access verified. Your live parts review is ready.':'Your one free build review is ready.';
    }catch(error){status.textContent=error.message||'Could not generate a build.';}
    finally{button.disabled=false;button.innerHTML='Research my PC builds <b>↗</b>';}
  }
  function exportOption(index){
    const o=lastBuilds[index];if(!o||o.unavailable)return;
    const payload={title:o.title,createdAt:new Date().toISOString(),priceSource:'PCPartPicker via API.SH',parts:o.parts.map(([category,p])=>({category,product:p?.name||null,weeklyReferencePrice:p?.lowestPrice||null,livePrice:p?.livePrice?.lowestPrice||null,lowestRetailer:p?.livePrice?.lowestRetailer||null,checkedAt:p?.livePrice?.checkedAt||null,offers:p?.livePrice?.offers||[],productUrl:p?.livePrice?.productUrl||null})),liveSubtotal:o.liveSubtotal,priceEstimateComplete:o.liveComplete,notes:['Retailer prices are refreshed when the report is generated but can change before checkout.','Totals use returned retailer offer totals where provided; shipping or tax may be missing.','Unpriced components are excluded from partial subtotals, not estimated.','Windows, peripherals, and CPU cooler may be additional.','Verify exact CPU support, BIOS, dimensions, PSU quality/connectors, and manufacturer requirements.']};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='pccheck-build-research.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function ensureCatalog(){
    if(catalog) return catalog;
    const response=await fetch('/api/build-catalog',{headers:{Accept:'application/json'}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'The component catalog is unavailable.');
    catalog=data;
    return catalog;
  }
  function renderPartsExplorer(){
    if(!catalog) return;
    const category=$('partsCategory').value, query=$('partsSearch').value.trim().toLowerCase(), order=$('partsSort').value;
    const labels={cpu:'CPU',gpu:'GPU',motherboard:'MOTHERBOARD',ram:'MEMORY',storage:'STORAGE',psu:'POWER SUPPLY',case:'CASE'};
    let rows=Object.values(catalog.products||{}).flat();
    if(category!=='all') rows=rows.filter(p=>p.category===category);
    if(query) rows=rows.filter(p=>[p.name,p.maker,p.model,p.partNumber].filter(Boolean).join(' ').toLowerCase().includes(query));
    rows.sort((a,b)=>order==='asc'?a.lowestPrice-b.lowestPrice:b.lowestPrice-a.lowestPrice);
    const total=rows.length;
    rows=rows.slice(0,24);
    $('partsExplorerStatus').textContent=total+' matching products · '+catalog.week+' dataset · showing '+rows.length;
    $('partsExplorerResults').innerHTML=rows.map(p=>'<article class="parts-result"><div class="parts-result-top"><span>'+escape(labels[p.category]||p.category)+'</span><b>'+money(p.lowestPrice)+'</b></div><h3>'+escape(p.name)+'</h3><p>Typical tracked price: '+(p.typicalPrice?money(p.typicalPrice):'Not available')+'</p><div class="parts-result-meta"><span>Lowest: '+escape(p.lowestRetailer||'Retailer not named')+'</span><span>'+Number(p.retailers||0)+' retailers</span><span>As of '+escape(p.asOf||'date unavailable')+'</span></div>'+(p.sourceUrl?'<a href="'+escape(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">View retailer price page ↗</a>':'')+'</article>').join('')||'<div class="finder-locked"><b>No matching parts found</b><p>Try a shorter model name or choose another category.</p></div>';
  }
  async function loadPartsExplorer(){
    const button=$('loadPartsCatalog');
    button.disabled=true;button.textContent='Loading tracked parts…';
    try{await ensureCatalog();renderPartsExplorer();}
    catch(error){$('partsExplorerStatus').textContent=error.message||'Could not load the parts catalog.';}
    finally{button.disabled=false;button.textContent='Refresh parts catalog ↗';}
  }
  function init(){
    $('generateBuilds').addEventListener('click',generate);
    $('loadPartsCatalog').addEventListener('click',loadPartsExplorer);
    ['partsCategory','partsSearch','partsSort'].forEach(id=>$(id).addEventListener(id==='partsSearch'?'input':'change',()=>{if(catalog)renderPartsExplorer();}));
    $('newSearch').addEventListener('click',()=>{$('finderResults').hidden=true;$('finderWizard').scrollIntoView({behavior:'smooth'});});
    $('buildOptions').addEventListener('click',e=>{const b=e.target.closest('[data-export-option]');if(b)exportOption(Number(b.dataset.exportOption));});
    $('downloadBuilds').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({generatedAt:new Date().toISOString(),source:catalog?.source,week:catalog?.week,options:lastBuilds},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='pccheck-build-research.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    if(!window.supabase?.createClient){$('accessTitle').textContent='Account service unavailable';$('accessCopy').textContent='Refresh the page or sign in from the main PCCheck site.';return;}
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.getSession().then(async({data,error})=>{
      if(error)throw error;session=data.session;
      if(!session?.access_token){$('accessTitle').textContent='Sign in for your one free build review';$('accessCopy').textContent='Create a free PCCheck account or sign in on the main site. Your account includes one full build review.';$('usageCount').textContent='1';$('usageLabel').textContent='review after sign-in';$('finderWizard').hidden=true;return;}
      const usage=await getUsage('GET');renderUsage(usage);
    }).catch(error=>{$('accessTitle').textContent='Could not verify account';$('accessCopy').textContent=error.message||'Please sign in again.';$('finderWizard').hidden=true;});
  }
  init();
})();