'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, typed API surface to the renderer.
// contextIsolation keeps Node/Electron out of the page's JS scope;
// everything the renderer can do must go through this bridge.
contextBridge.exposeInMainWorld('electronAPI', {
  /** Trigger the native open-file dialog */
  openFile: () => ipcRenderer.invoke('open-dialog'),

  /** Register a callback for when the main process wants to open a file */
  onOpenFile: (cb) => {
    ipcRenderer.on('open-file', (_, filePath) => cb(filePath));
  },

  /** Update the native window title bar */
  setTitle: (title) => ipcRenderer.send('set-title', title),
});