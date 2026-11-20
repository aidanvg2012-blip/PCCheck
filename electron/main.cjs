'use strict';
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const APP_URL = process.env.PCCHECK_APP_URL || 'https://pccheck.vercel.app';
const trustedHosts = new Set(['pccheck.vercel.app','checkout.stripe.com','billing.stripe.com']);
function createWindow(){
 const win=new BrowserWindow({width:1440,height:940,minWidth:980,minHeight:680,backgroundColor:'#101416',title:'PCCheck',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(({url})=>{let host='';try{host=new URL(url).hostname;}catch{}if(trustedHosts.has(host))return{action:'allow'};if(url.startsWith('https://'))shell.openExternal(url);return{action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{let host='';try{host=new URL(url).hostname;}catch{}if(!trustedHosts.has(host)){event.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
 win.loadURL(APP_URL);
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});