'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, protocol, net } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// ── Single-instance lock ───────────────────────────────────────────────────────
// This ensures double-clicking a second .glb focuses the existing window
// and opens the file there, rather than launching a second process.
const isPrimary = app.requestSingleInstanceLock();
if (!isPrimary) { app.quit(); process.exit(0); }

// Let the renderer fetch() localfile:// URLs (models and sibling textures)
protocol.registerSchemesAsPrivileged([
  { scheme: 'localfile', privileges: { supportFetchAPI: true, corsEnabled: true, bypassCSP: true } },
]);

const MODEL_EXTS = ['glb', 'gltf', 'fbx', 'obj'];

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
    return net.fetch(pathToFileURL(findFile(p)).href);
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

// FBX files usually reference textures by bare name ("colormap.png") even when
// they sit in a sub-folder such as Textures/. If the path doesn't exist, look
// one level down in the same folder.
function findFile(p) {
  if (fs.existsSync(p)) return p;
  const dir = path.dirname(p), base = path.basename(p).toLowerCase();
  try {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const hit = fs.readdirSync(path.join(dir, d.name)).find((f) => f.toLowerCase() === base);
      if (hit) return path.join(dir, d.name, hit);
    }
  } catch { /* fall through */ }
  return p;
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
      { name: '3D Models', extensions: MODEL_EXTS },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });
  if (!canceled && filePaths.length) sendFiles(filePaths);
}

function sendFile(filePath) { sendFiles([filePath]); }

function sendFiles(filePaths) {
  if (!win) return;
  // Normalise to forward slashes for the renderer
  win.webContents.send('open-file', filePaths.map((p) => p.replace(/\\/g, '/')));
  win.setTitle(path.basename(filePaths[0]) + ' — GLB Viewer');
}

function extractGlbArg(argv) {
  return (argv || [])
    .slice(app.isPackaged ? 1 : 2)
    .find((a) => /\.(glb|gltf|fbx|obj)$/i.test(a)) || null;
}