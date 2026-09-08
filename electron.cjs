'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// ── Single-instance lock ───────────────────────────────────────────────────────
// This ensures double-clicking a second .glb focuses the existing window
// and opens the file there, rather than launching a second process.
const isPrimary = app.requestSingleInstanceLock();
if (!isPrimary) { app.quit(); process.exit(0); }

let win = null;
let pendingFile = extractGlbArg(process.argv); // from CLI / file association

app.on('second-instance', (_, argv) => {
  const file = extractGlbArg(argv);
  if (file) sendFile(file);
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

// macOS: file opened via Finder
app.on('open-file', (e, filePath) => {
  e.preventDefault();
  if (win) sendFile(filePath);
  else pendingFile = filePath;
});

// ── App ready ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Custom protocol: lets the renderer load arbitrary local files by path
  // without disabling webSecurity. Converts localfile:///path → file:///path.
  protocol.handle('localfile', (request) => {
    let p = decodeURIComponent(request.url.replace(/^localfile:\/\//, ''));
    // On Windows the path arrives as /C:/foo.glb — strip the leading slash
    if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(p)) p = p.slice(1);
    return net.fetch(pathToFileURL(p).href);
  });

  win = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) win = createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const w = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#0f1114',
    title: 'GLB Viewer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,          // preload needs Node APIs
    },
  });

  Menu.setApplicationMenu(buildMenu(w));
  w.loadFile('index.html');

  // Open file that was queued before the window finished loading
  w.webContents.on('did-finish-load', () => {
    if (pendingFile) { sendFile(pendingFile); pendingFile = null; }
  });

  w.on('closed', () => { win = null; });
  return w;
}

// ── Application menu ──────────────────────────────────────────────────────────
function buildMenu(w) {
  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openDialog(w),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]);
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('open-dialog', (e) =>
  openDialog(BrowserWindow.fromWebContents(e.sender))
);

ipcMain.on('set-title', (e, title) => {
  BrowserWindow.fromWebContents(e.sender)?.setTitle(title);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function openDialog(w) {
  if (!w) return;
  const { canceled, filePaths } = await dialog.showOpenDialog(w, {
    title: 'Open 3D Model',
    filters: [
      { name: '3D Models', extensions: ['glb', 'gltf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (!canceled && filePaths[0]) sendFile(filePaths[0]);
}

function sendFile(filePath) {
  if (!win) return;
  // Normalise to forward slashes for the renderer
  const norm = filePath.replace(/\\/g, '/');
  win.webContents.send('open-file', norm);
  win.setTitle(path.basename(filePath) + ' — GLB Viewer');
}

function extractGlbArg(argv) {
  return (argv || [])
    .slice(app.isPackaged ? 1 : 2)
    .find((a) => /\.(glb|gltf)$/i.test(a)) || null;
}