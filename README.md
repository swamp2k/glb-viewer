# GLB Viewer

A native desktop (and in-browser) GLB / GLTF / FBX / OBJ 3D model viewer built with Electron and Three.js.

## Features

- Native window, menus, title bar
- File associations: double-click `.glb` / `.gltf` / `.fbx` / `.obj` to open directly
- Drag-and-drop files, a selection of files, or a whole folder; dropping replaces whatever is open
- Dropping several models shows a file list on the left (click, or Up/Down keys, to switch)
- "Include subfolders" toggle controls whether models in subfolders of a dropped folder are listed
- External textures / `.mtl` / `.bin` are looked up relative to the model, then by file name anywhere
  in the dropped set. In the desktop app they are also read from the model's folder on disk, so a
  single dragged or double-clicked file still finds its textures. In a browser a lone file can't see
  its neighbours � drop the folder (or the model together with its textures) instead.
- `Ctrl+O` / File → Open native dialog
- Orbit, pan, zoom (OrbitControls with damping)
- Draco-compressed GLB support
- Animation playback with timeline scrubber
- Wireframe, grid, background cycle, flat/lit toggle
- Model stats: vertices, triangles, meshes, materials, bones

## Requirements

- Node.js 18+
- npm

## Quick start (dev)

```sh
npm install
npm start
```

## Build installers

```sh
# Windows (.exe installer + portable)
npm run build:win

# Linux (.AppImage + .deb)
npm run build:linux

# Both at once
npm run build:both
```

Output goes to `dist/`.

### Windows installer
- `dist/GLB Viewer Setup 1.0.0.exe` — installs with file associations
- `dist/GLB Viewer 1.0.0.exe` — portable, no install needed

### Linux
- `dist/GLB Viewer-1.0.0.AppImage` — portable, run directly
- `dist/glb-viewer_1.0.0_amd64.deb` — installs with file associations

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `O` | Open file |
| `F` | Fit camera to model |
| `W` | Toggle wireframe |
| `G` | Toggle grid |
| `B` | Cycle background (dark → grey → light → white) |
| `L` | Toggle flat/lit shading |
| `Space` | Play / pause animation |