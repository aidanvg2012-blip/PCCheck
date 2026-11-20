'use strict';
(async()=>{
 const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const formatBytes=n=>{if(!Number.isFinite(Number(n))||Number(n)<=0)return 'Not reported';let v=Number(n),u=['B','KB','GB','TB'];let i=0;while(v>=1024&&i<u.length-1){v/=1024;i++;}return (i===0?v.toFixed(0):v.toFixed(1))+' '+u[i];};
 const access=$('rigAccess'),scan=$('scanRig'),notice=$('desktopNotice');
 function gate(message,cta){access.hidden=false;access.innerHTML='<span class="mini-label">PCHECK PLUS / MEMBER ACCESS</span><h2>'+esc(message)+'</h2><p>My Rig is a Plus feature. Sign in with an active Plus subscription to use local hardware inventory.</p><a class="btn primary" href="'+cta+'">Continue ↗</a>';scan.disabled=true;notice.hidden=true;}
 try{
  if(!window.supabase?.createClient)throw new Error('Account service unavailable. Refresh and try again.');
  const client=window.supabase.createClient('https://rtssojyophcgybdhhqzz.supabase.co','sb_publishable_kK8xaomzreBOVF4DnvyU4Q_uuVvLWH3',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data.session?.access_token){gate('Sign in to unlock My Rig','index.html?returnTo=my-rig.html#account');return;}
  const r=await fetch('/api/plus-status',{headers:{Authorization:'Bearer '+data.session.access_token}}),d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||'Could not verify membership.');
  if(!d.hasPlus){gate('My Rig is part of PCCheck Plus','index.html#plus');return;}
  access.hidden=true;scan.disabled=false;
  if(!window.pccheckDesktop?.getRigSnapshot){notice.hidden=false;$('scanMode').textContent='WEB PREVIEW';scan.disabled=true;$('scanStatus').textContent='Install the Windows desktop app to scan this computer.';return;}
  notice.hidden=true;$('scanMode').textContent='WINDOWS LOCAL SCAN';
  scan.addEventListener('click',async()=>{
   scan.disabled=true;$('scanStatus').textContent='Reading hardware information locally…';
   try{const data=await window.pccheckDesktop.getRigSnapshot();render(data);$('scanStatus').textContent='Scan complete · '+new Date(data.scannedAt).toLocaleString();}
   catch(e){$('scanStatus').textContent=e.message||'The local scan could not complete.';}
   finally{scan.disabled=false;}
  });
 }catch(e){gate(e.message||'Could not verify your PCCheck account.','index.html?returnTo=my-rig.html#account');}
 function card(title,primary,details){return '<article class="rig-card"><div class="rig-card-top"><small>'+esc(title)+'</small><span class="pill">LOCAL</span></div><h3>'+esc(primary||'Not detected')+'</h3>'+(details||[]).map(x=>'<p class="rig-detail">'+esc(x)+'</p>').join('')+'</article>';}
 function render(d){
  const cpu=d.cpu||{},gpu=d.gpu||[],mem=d.memory||{},board=d.baseboard||{},os=d.os||{},system=d.system||{},bios=d.bios||{},disks=d.disks||[],nets=d.network||[];
  const firstGpu=gpu[0]?.name||'No GPU reported';
  $('rigCpuSummary').textContent=cpu.brand||'Not detected';$('rigCpuMeta').textContent=(cpu.cores||'?')+' logical cores · '+(cpu.physicalCores||'?')+' physical';
  $('rigGpuSummary').textContent=firstGpu;$('rigGpuMeta').textContent=gpu.length+' graphics controller(s)';
  $('rigMemorySummary').textContent=formatBytes(mem.total);$('rigMemoryMeta').textContent=(mem.type||'Memory type unknown')+' · '+(mem.slots||'?')+' reported module(s)';
  $('rigStorageSummary').textContent=disks.length+' drive(s)';$('rigStorageMeta').textContent=disks.map(x=>formatBytes(x.size)).join(' + ')||'No drives reported';
  $('rigSummary').hidden=false;$('rigInventory').hidden=false;$('rigBluetooth').hidden=false;
  const cards=[
   card('PROCESSOR',cpu.brand,[cpu.manufacturer||'',(cpu.cores||'?')+' logical cores · '+(cpu.physicalCores||'?')+' physical cores',cpu.speed?cpu.speed+' GHz base speed':'Clock speed not reported'].filter(Boolean)),
   ...gpu.map((g,i)=>card('GRAPHICS '+(i+1),g.name,[g.vendor||'',g.vram?formatBytes(g.vram*1024*1024)+' VRAM':'VRAM not reported',g.driverVersion?'Driver '+g.driverVersion:'Driver version not reported'].filter(Boolean))),
   card('MEMORY',formatBytes(mem.total),[mem.type||'Type not reported',(mem.speed?mem.speed+' MT/s':'Speed not reported'),(mem.slots||'?')+' module(s) reported']),
   ...disks.map((x,i)=>card('STORAGE '+(i+1),x.name||x.model,[x.type||'Drive type not reported',formatBytes(x.size),x.interfaceType||'Interface not reported'].filter(Boolean))),
   card('MOTHERBOARD',[board.manufacturer,board.model].filter(Boolean).join(' ')||'Not reported',[board.version?'Board version '+board.version:'Version not reported']),
   card('SYSTEM',system.model||system.manufacturer||'PC model not reported',[system.manufacturer||'',os.distro||os.platform||'OS not reported',os.release?'Version '+os.release:'',bios.version?'BIOS '+bios.version:''].filter(Boolean)),
   card('NETWORK',nets.length+' adapter(s)',nets.map(x=>x.iface+' · '+(x.type||'network')).slice(0,6))
  ];
  $('rigCards').innerHTML=cards.join('');
  const bt=d.bluetooth||[];$('bluetoothCount').textContent=bt.length+' DEVICES';$('bluetoothItems').innerHTML=bt.length?bt.map(x=>'<div class="bluetooth-device"><span>◉</span><div><b>'+esc(x.name)+'</b><small>'+esc(x.status||'Detected by Windows')+'</small></div></div>').join(''):'<p class="fine">No Bluetooth devices were reported by Windows. Bluetooth may be disabled, unavailable, or hidden by the device driver.</p>';
  $('rigScannedAt').textContent='SCANNED '+new Date(d.scannedAt).toLocaleString();
 }
})();