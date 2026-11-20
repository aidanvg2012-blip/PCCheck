'use strict';
(() => {
  const host=window.location.hostname;
  const config=window.PCCHECK_ADSENSE_CONFIG||{};
  const client=String(config.client||'').trim();
  const validClient=/^ca-pub-\d{16}$/.test(client);
  // Ads are deliberately disabled on previews and until the parent-managed AdSense site is approved.
  if(host!=='pccheck.vercel.app'||!validClient)return;
  const slots=[...document.querySelectorAll('[data-ad-slot-key]')];
  const ready=slots.filter(el=>/^\d{6,20}$/.test(String(config.slots?.[el.dataset.adSlotKey]||'')));
  if(!ready.length)return;
  const script=document.createElement('script');
  script.async=true;
  script.crossOrigin='anonymous';
  script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);
  script.onload=()=>{
    ready.forEach(el=>{
      const slot=String(config.slots[el.dataset.adSlotKey]);
      const ins=document.createElement('ins');
      ins.className='adsbygoogle';
      ins.style.display='block';
      ins.style.minHeight='100px';
      ins.dataset.adClient=client;
      ins.dataset.adSlot=slot;
      ins.dataset.adFormat='auto';
      ins.dataset.fullWidthResponsive='true';
      el.appendChild(ins);
      try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}
      el.hidden=false;
    });
  };
  script.onerror=()=>{};
  document.head.appendChild(script);
})();