'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const SUPABASE_URL = 'https://rtssojyophcgybdhhqzz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_kK8xaomzreBOVF4DnvyU4Q_uuVvLWH3';
  const WATCH_KEY = 'pccheck-price-watch-v1';
  const labels = {cpu:'CPU',gpu:'GPU',motherboard:'MOTHERBOARD',ram:'MEMORY',storage:'STORAGE',psu:'POWER SUPPLY',case:'CASE'};
  const money = n => Number(n).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client=null, session=null, catalog=null, products=[], watchlist=readWatchlist(), providerReady=false;
  function readWatchlist(){try{const v=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return[];}}
  function saveWatchlist(){localStorage.setItem(WATCH_KEY,JSON.stringify(watchlist));renderWatchlist();}
  function setProvider(ready,title,copy){providerReady=ready;$('providerTitle').textContent=title;$('providerCopy').textContent=copy;$('providerPill').textContent=ready?'AVAILABLE':'NOT READY';}
  async function loadProvider(){try{const r=await fetch('/api/live-part-prices');const d=await r.json();if(r.ok&&d.configured)setProvider(true,'Live retailer lookups are configured','Exact-model retailer offers can be checked for eligible Plus accounts.');else setProvider(false,'Weekly prices are available; live offers are not configured',d.error||'A parent or guardian must configure the retailer provider key on the server.');}catch{setProvider(false,'Live pricing status unavailable','The weekly catalog can still be browsed.');}}
  async function loadCatalog(){
    $('catalogStatus').textContent='Loading weekly component data…';
    try{const r=await fetch('/api/build-catalog',{headers:{Accept:'application/json'}});const d=await r.json();if(!r.ok)throw new Error(d.error||'Catalog unavailable');catalog=d;products=Object.values(d.products||{}).flat();$('catalogWeek').textContent=d.week?'WEEK '+d.week:'WEEKLY DATA';$('catalogStatus').textContent=products.length+' tracked components · '+(d.week||'latest dataset');renderProducts();}
    catch(e){$('catalogStatus').textContent=e.message||'Could not load catalog.';$('priceProducts').innerHTML='<div class="price-empty">The parts catalog is temporarily unavailable. Try again shortly.</div>';}
  }
  function filteredProducts(){
    const category=$('priceCategory').value,q=$('priceSearch').value.trim().toLowerCase(),sort=$('priceSort').value;
    let rows=products.filter(p=>(category==='all'||p.category===category)&&(!q||[p.name,p.maker,p.model,p.partNumber].filter(Boolean).join(' ').toLowerCase().includes(q)));
    rows.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='high'?(b.lowestPrice||0)-(a.lowestPrice||0):(a.lowestPrice||Infinity)-(b.lowestPrice||Infinity));
    return rows;
  }
  function renderProducts(){
    if(!catalog)return;
    const rows=filteredProducts(),shown=rows.slice(0,48);
    $('catalogStatus').textContent=rows.length+' matching components · '+(catalog.week||'latest week')+' · showing '+shown.length;
    $('priceProducts').innerHTML=shown.map((p,i)=>'<article class="price-product"><div class="price-product-top"><span>'+esc(labels[p.category]||p.category)+'</span><span>WEEKLY REF.</span></div><h3>'+esc(p.name)+'</h3><div class="price-product-price">'+(p.lowestPrice?money(p.lowestPrice):'Not priced')+'</div><div class="price-product-meta"><span>Typical '+(p.typicalPrice?money(p.typicalPrice):'—')+'</span><span>'+(p.retailers||0)+' retailers</span><span>'+(p.asOf?'As of '+esc(p.asOf):'Date unavailable')+'</span></div><div class="price-product-actions"><button class="btn primary" type="button" data-check="'+i+'">Check live offers</button><button class="btn ghost" type="button" data-save="'+i+'">☆ Watch</button>'+(p.sourceUrl?'<a class="btn ghost" href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'')+'</div></article>').join('')||'<div class="price-empty">No matching products. Try a shorter model name or another category.</div>';
    window._pccheckVisiblePriceProducts=shown;
  }
  function renderWatchlist(){
    $('watchlistItems').innerHTML=watchlist.length?watchlist.map((p,i)=>'<article class="watch-item"><b>'+esc(p.name)+'</b><small>Weekly reference: '+(p.weeklyPrice?money(p.weeklyPrice):'—')+(p.lastLivePrice?' · Last live: '+money(p.lastLivePrice):' · Not checked live yet')+'</small><div class="watch-item-actions"><button class="btn ghost" data-watch-check="'+i+'" type="button">Check offers</button><button class="btn ghost" data-watch-remove="'+i+'" type="button">Remove</button></div></article>').join(''):'<p class="fine">No saved products yet. Add a component from the catalog.</p>';
  }
  function addWatch(p){
    if(watchlist.some(x=>x.id===p.id&&x.category===p.category)){ $('catalogStatus').textContent='Already on your watchlist.';return; }
    watchlist.push({id:p.id,category:p.category,name:p.name,weeklyPrice:p.lowestPrice||null,lastLivePrice:null,lastCheckedAt:null});
    saveWatchlist();$('catalogStatus').textContent='Saved to your device watchlist.';
  }
  async function requirePlus(){
    if(!client)throw new Error('Account service is unavailable. Refresh and try again.');
    const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session;
    if(!session?.access_token){throw new Error('Sign in first. Live retailer price checks are a PCCheck Plus feature.');}
    const r=await fetch('/api/plus-status',{headers:{Authorization:'Bearer '+session.access_token}}),d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'Could not verify Plus access.');
    if(!d.hasPlus)throw new Error('Live price tracking requires an active PCCheck Plus subscription. Weekly reference prices remain free to browse.');
    return session.access_token;
  }
  async function checkProduct(p){
    if(!providerReady)throw new Error('Live retailer pricing is not configured yet. Weekly reference prices are still available.');
    const token=await requirePlus();
    $('liveResults').hidden=false;$('liveTitle').textContent=p.name;$('liveMeta').textContent='Checking exact model against current retailer listings…';$('liveOffers').innerHTML='<div class="price-empty">Looking for exact retailer matches…</div>';
    $('liveResults').scrollIntoView({behavior:'smooth',block:'start'});
    const r=await fetch('/api/live-part-prices',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({priceSearch:true,parts:[{key:'tracker:'+p.category+':'+p.id,category:p.category,model:p.name}]})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Live price lookup failed.');
    const match=Object.values(d.matches||{})[0];
    if(!match||!match.found){$('liveMeta').textContent='No exact retailer model match. PCCheck did not assign a live price.';$('liveOffers').innerHTML='<div class="price-empty">'+esc(match?.message||'No exact match found.')+'</div>';return;}
    const previous=watchlist.find(x=>x.id===p.id&&x.category===p.category);
    if(previous){previous.lastLivePrice=match.lowestPrice||null;previous.lastCheckedAt=match.checkedAt||d.checkedAt;previous.weeklyPrice=p.lowestPrice||previous.weeklyPrice;saveWatchlist();}
    $('liveMeta').textContent='Checked '+new Date(match.checkedAt||d.checkedAt||Date.now()).toLocaleString()+' · '+(match.cached?'Provider cache':'Fresh provider lookup')+'. Verify final checkout details with the retailer.';
    $('liveOffers').innerHTML=(match.offers||[]).map(o=>'<article class="live-offer"><div><b>'+esc(o.merchant)+'</b><small>'+esc(o.availability||'Availability not confirmed')+(o.shipping?' · Shipping '+esc(o.shipping):'')+'</small></div><strong>'+money(o.price)+'</strong><a href="'+esc(o.url)+'" target="_blank" rel="noopener noreferrer">View offer ↗</a></article>').join('')||'<div class="price-empty">The exact model matched, but no current in-stock retailer offers were returned.</div>';
  }
  function handleError(error){$('catalogStatus').textContent=error.message||'Could not complete that action.';if(!session?.access_token&&/sign in/i.test(error.message||''))window.location.href='index.html?returnTo=price-tracker.html#account';}
  $('priceCategory').addEventListener('change',renderProducts);$('priceSearch').addEventListener('input',renderProducts);$('priceSort').addEventListener('change',renderProducts);
  $('checkManualPrice').addEventListener('click',async()=>{const category=$('priceCategory').value,name=$('priceSearch').value.trim();if(category==='all'||name.length<3){$('catalogStatus').textContent='Choose a component category and enter at least three characters of the exact model name.';return;}try{await checkProduct({id:'manual-'+category+'-'+name,category,name});}catch(error){handleError(error);}});
  $('refreshCatalog').addEventListener('click',loadCatalog);$('closeLive').addEventListener('click',()=>{$('liveResults').hidden=true;});
  $('priceProducts').addEventListener('click',async e=>{
    const check=e.target.closest('[data-check]'),save=e.target.closest('[data-save]'),rows=window._pccheckVisiblePriceProducts||[];
    if(check){const p=rows[Number(check.dataset.check)];if(!p)return;check.disabled=true;check.textContent='Checking…';try{await checkProduct(p);}catch(error){handleError(error);}finally{check.disabled=false;check.textContent='Check live offers';}}
    if(save){const p=rows[Number(save.dataset.save)];if(p)addWatch(p);}
  });
  $('watchlistItems').addEventListener('click',async e=>{
    const check=e.target.closest('[data-watch-check]'),remove=e.target.closest('[data-watch-remove]');
    if(remove){watchlist.splice(Number(remove.dataset.watchRemove),1);saveWatchlist();}
    if(check){const p=watchlist[Number(check.dataset.watchCheck)];if(!p)return;try{await checkProduct(p);}catch(error){handleError(error);}}
  });
  if(window.supabase?.createClient)client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  renderWatchlist();loadProvider();loadCatalog();
})();