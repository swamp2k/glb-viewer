# GLB Viewer (web)

Browser version of the [Electron GLB Viewer](https://github.com/swamp2k/glb-viewer) —
single static `index.html`, no build step, deployable straight to Cloudflare Pages.

## Features

Same viewer as the desktop app, minus native-OS integration:

- Drag-and-drop `.glb` / `.gltf` onto the page, or click to browse
- Orbit / pan / zoom, Draco-compressed GLB support
- Animation playback with timeline scrubber
- Wireframe, grid, background cycle, flat/lit toggle
- Model stats: vertices, triangles, meshes, materials, bones
- Shareable links: `?model=https://example.com/model.glb` auto-loads a model from a URL

**Not included** (desktop-only): native window/menu, file associations, `Ctrl+O` dialog —
those need Electron. Use the [desktop app](https://github.com/swamp2k/glb-viewer) for that.

## Deploy to Cloudflare Pages

### Via dashboard
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Select this repo, set root directory to `web`
3. Build command: (none) — leave empty
4. Build output directory: `/` (relative to root directory, i.e. `web`)
5. Deploy

### Via Wrangler CLI
```sh
cd web
npm install -g wrangler
wrangler pages deploy . --project-name=glb-viewer
```

No build step, no dependencies — it's one static HTML file that loads Three.js from
a CDN at runtime.

## Local dev

Just open `index.html` in a browser, or serve it:

```sh
npx serve .
```

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
