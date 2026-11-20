'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pccheckDesktop',Object.freeze({
 getRigSnapshot:()=>ipcRenderer.invoke('pccheck:get-rig-snapshot')
}));