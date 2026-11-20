'use strict';
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');
const { execFile } = require('node:child_process');
const si = require('systeminformation');
const APP_URL = process.env.PCCHECK_APP_URL || 'https://pccheck.vercel.app';
const APP_ORIGIN = new URL(APP_URL).origin;
const trustedHosts = new Set(['pccheck.vercel.app','checkout.stripe.com','billing.stripe.com']);
function runPowerShell(command){
 return new Promise(resolve=>{
  execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{timeout:9000,windowsHide:true,maxBuffer:256*1024},(error,stdout)=>{
   if(error)return resolve([]);
   try{const parsed=JSON.parse(stdout.trim()||'[]');resolve(Array.isArray(parsed)?parsed:parsed?[parsed]:[]);}catch{resolve([]);}
  });
 });
}
ipcMain.handle('pccheck:get-rig-snapshot',async event=>{
 let origin='';try{origin=new URL(event.senderFrame.url).origin;}catch{}
 if(origin!==APP_ORIGIN)throw new Error('Hardware scan request came from an untrusted page.');
 if(process.platform!=='win32')throw new Error('The local hardware inventory currently supports Windows 10 and 11.');
 const [cpu,gpu,memory,memoryModules,baseboard,bios,system,os,disks,network,bluetooth]=await Promise.all([
  si.cpu(),si.graphics(),si.mem(),si.memLayout(),si.baseboard(),si.bios(),si.system(),si.osInfo(),si.diskLayout(),si.networkInterfaces(),runPowerShell("Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -and $_.Status -ne 'Error' } | Select-Object @{Name='name';Expression={$_.FriendlyName}},@{Name='status';Expression={$_.Status}} | ConvertTo-Json -Compress")
 ]);
 return {
  scannedAt:new Date().toISOString(),
  cpu:{manufacturer:cpu.manufacturer,brand:cpu.brand,cores:cpu.cores,physicalCores:cpu.physicalCores,speed:cpu.speed},
  gpu:(gpu.controllers||[]).map(g=>({name:g.model||g.name||'Graphics controller',vendor:g.vendor,vram:g.vram,driverVersion:g.driverVersion})),
  memory:{total:memory.total,type:memoryModules[0]?.type||null,speed:memoryModules[0]?.clockSpeed||null,slots:memoryModules.length||null},
  baseboard:{manufacturer:baseboard.manufacturer,model:baseboard.model,version:baseboard.version},
  bios:{version:bios.version,releaseDate:bios.releaseDate},
  system:{manufacturer:system.manufacturer,model:system.model},
  os:{platform:os.platform,distro:os.distro,release:os.release},
  disks:(disks||[]).map(d=>({name:d.name||d.model||d.device||'Drive',model:d.model,type:d.type,size:d.size,interfaceType:d.interfaceType})),
  network:(network||[]).filter(n=>n.iface&&n.internal!==true).map(n=>({iface:n.iface,type:n.type})).slice(0,12),
  bluetooth:bluetooth.map(x=>({name:String(x.name||'Bluetooth device').slice(0,100),status:String(x.status||'Detected').slice(0,30)})).slice(0,30)
 };
});
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:980,minHeight:680,backgroundColor:'#080d16',title:'PCCheck',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(({url})=>{let host='';try{host=new URL(url).hostname;}catch{}if(trustedHosts.has(host))return{action:'allow'};if(url.startsWith('https://'))shell.openExternal(url);return{action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{let host='';try{host=new URL(url).hostname;}catch{}if(!trustedHosts.has(host)){event.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
 win.loadURL(APP_URL);
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});