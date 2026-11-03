## Where I left off
Doing: Finish FBX/OBJ + multi-file/folder-drop release and web deployment.
State: Feature verified merged to main; release v1.0.0+build.6 includes Windows installer/portable and Linux AppImage/deb (successful CI). Root AGENTS.md and CLAUDE.md are identical and include synchronization rules; HANDOVER.md absent. Cloudflare Pages glb-viewer now builds main, staging only index.html in web/. Production deployment f54cc99e-fbd3-498e-a9ae-1f4e2a983cad succeeded for ba00bdd7d4ecc30ef56e8139194d4370e4c8523d. Live browser check: FBX/OBJ, folder-drop hint, subfolder toggle and canvas present; no console warnings/errors.
Next step: Smoke-test actual GLB/FBX/OBJ models with external textures and multi-file/folder drop in browser and desktop. Instruction/bookmark commits automatically trigger further desktop releases and Pages builds; no additional feature release is needed for this session.
Blocked by: No model-loading or desktop runtime test performed this session.
Updated: 2026-11-04
