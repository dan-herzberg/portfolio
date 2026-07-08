# GLB Viewer — Project Notes

## Repository Setup

- **Remote:** `https://dan-herzberg@github.com/dan-herzberg/portfolio.git`
- **Hosting:** GitHub Pages (static)
- **Auth:** Fine-grained PAT stored in Windows Credential Manager (`git:https://dan-herzberg@github.com`)

### Git Credential Fix

Kiro's built-in `GIT_ASKPASS` was authenticating as `BostonSWUG` (a different GitHub account) for all git operations. The fix:

1. Embed username in remote URL: `git remote set-url origin https://dan-herzberg@github.com/dan-herzberg/portfolio.git`
2. Store a fine-grained PAT via: `cmdkey /generic:git:https://dan-herzberg@github.com /user:dan-herzberg /pass:<token>`
3. When pushing from Kiro's terminal, unset the IDE's askpass: `$env:GIT_ASKPASS = ""`

This avoids signing out of Kiro (which uses Amazon Midway, not GitHub) while ensuring git operations authenticate as `dan-herzberg`.

---

## Architecture

### Single-File App

Everything lives in `viewer.html` (~5000+ lines). No build step, no npm, no bundler. Three.js loaded from CDN. Deployed directly to GitHub Pages.

### Tech Stack

- **Three.js** (v0.160.0) — 3D rendering
- **Rapier** (v0.19.3, Wasm) — rigid-body physics (merged from `claude/physics-rapier`)
- **WebXR API** — VR support (Meta Quest 2 & 3)
- **Vanilla ES6 modules** — no framework
- **Anthropic API** (optional, client-side) — natural language scene control

### Key State

| Variable | Purpose |
|----------|---------|
| `worldRoot` | Scene graph root for loaded GLB |
| `held` | Map of holder → grabbed part record |
| `dropping[]` | Parts in free-fall (Rapier bodies) |
| `composites[]` | Snap-together assemblies |
| `interactables[]` | Doors + switches with state |
| `grabbables[]` | Registered liftable parts |
| `lightSources[]` | Point light records |
| `overrides` | User edits (roles + settings), exportable as JSON |

---

## Branch History

| Branch | Status | Purpose |
|--------|--------|---------|
| `main` | Active | Production branch with Rapier physics |
| `claude/physics-rapier` | Merged into main | Rapier engine integration |
| `claude/physics-cannon` | **Deleted** | Abandoned Cannon.js attempt |
| `claude/portfolio-website-v2-vdseao` | Active | Portfolio site redesign |

### Rapier Merge (July 2026)

- Conflict was in the animation loop — duplicated subsystem calls (old `updateDropping()` vs new `physicsStep()`)
- Resolution: kept Rapier's `physicsStep(dt)` as the sole physics driver
- Old hand-rolled contact-geometry sim (~200 lines) is now dead code within the Rapier branch but was superseded by `physicsStep()` which calls `physWorld.step()`

---

## Feature Status

### Implemented & Stable

- ✅ GLB loading (file picker, drag-drop, URL)
- ✅ Role assignment (door, switch, button, grabbable, light, static)
- ✅ Desktop input (pointer lock, WASD, E grab, wheel push/pull, R reset)
- ✅ Mobile input (on-screen joystick + buttons, touch-drag look)
- ✅ VR (Meta Quest 2 & 3 — controllers, grip grab, trigger interact, teleport, snap-turn)
- ✅ Drop physics via Rapier (throw momentum, multi-body collision, realistic settle)
- ✅ Assembly hierarchy (snap-together composites, weld/unweld by proximity)
- ✅ Simplification slider (hides smallest N% of parts by bounding-box volume)
- ✅ Depth lines (carry-height visualization)
- ✅ Ghost preview (snap-slot indicator near home position)
- ✅ Light toggling (switches control nearby lights within 6m)
- ✅ Force opaque (strip transparency from all materials)
- ✅ Override export/import (`.overrides.json`)
- ✅ AI command bridge (Claude natural-language → structured ops)
- ✅ Demo room (nested assembly with pedestal)
- ✅ Resilient animation loop (subsystem errors don't freeze the view)

### Still To Implement

| Feature | Notes |
|---------|-------|
| **Color assignment** | No color picker in editor UI; materials are read-only. Need to add a color swatch/picker to the edit panel and a `setColor` override type. |
| **Memory release on simplification** | Slider sets `visible=false` only — geometry, textures, and GPU buffers remain allocated. For true release: `geometry.dispose()`, `material.dispose()`, remove from scene graph, null refs. Re-loading from GLB buffer needed when slider moves back. Important for Quest 2 memory constraints. |
| **Assign properties at any hierarchy level** | Editor navigates parent/child but `setRoleOverride()` doesn't always resolve correctly for intermediate group nodes vs leaf meshes. `editPath` resolution needs to respect user's selected hierarchy level. |

---

## Module Split Considerations

The app is a candidate for splitting into separate JS modules for maintainability, but this involves tradeoffs:

### Benefits
- Easier navigation and merge conflict avoidance
- Testable units (physics, roles, UI separately)
- Lazy loading (defer Rapier Wasm, AI bridge until needed)

### Risks
- Breaks `file://` double-click-to-run (CORS blocks ES module imports)
- Requires a local dev server or bundler
- Shared mutable state needs careful architecture to avoid circular deps
- More HTTP requests at startup (mitigated by HTTP/2 on GitHub Pages)

### Recommended Approach (if pursued)
1. Split source into modules (`js/physics.js`, `js/roles.js`, `js/vr.js`, `js/ui.js`, etc.)
2. Add a simple build script (concatenation, not transpilation) that produces the single `viewer.html` for deploy
3. Keep `viewer.html` as the deployment artifact — end users still get zero-dependency single-file
4. Develop against `npx serve .` locally

---

## Device Targets & Constraints

| Device | Key Constraints |
|--------|-----------------|
| Desktop (Chrome/Edge) | None — full performance |
| Mobile (phone/tablet) | Touch input, smaller viewport, HUD starts collapsed |
| Meta Quest 2 | <1M tris, <100MB recommended; foveation enabled; WebXR requires HTTPS |
| Meta Quest 3 | Same as Quest 2 with better GPU headroom |

### Touch Detection Logic
```javascript
const isTouch = uaMobile || (primaryPointerCoarse && maxTouchPoints > 0);
```
A touchscreen laptop with a mouse reads as desktop (correct behavior).

---

## Role Classification (Auto-Detection by Name)

| Node name contains | Becomes |
|---|---|
| `door`, `gate`, `hatch`, `portal` | Swinging door (hinge on vertical edge) |
| `button`, `btn` | Press button (toggles nearby lights) |
| `switch`, `lever`, `toggle` | Throw lever (same light behavior) |
| anything else | Static (until manually edited) |

**Important:** Name parts in CAD before export. A model full of `Mesh_001` produces zero auto-classified interactables.

---

## Physics (Rapier Integration)

### How It Works
- Dynamic import: `await RAPIER.init()` from CDN
- Single `physWorld` with gravity + static/dynamic bodies
- Static colliders: floor + every scene mesh (rebuilt on world rebuild)
- Dynamic bodies: one per dropped part (rigid body + cuboid collider)
- Each frame: `physWorld.step()` → sync Three.js node transforms from Rapier bodies

### Key Functions
| Function | Purpose |
|----------|---------|
| `physicsStep(dt)` | Advance world, sync nodes |
| `physicsDropPart(rec, vel, angVel)` | Spawn dynamic body on release |
| `physicsRemovePart(rec)` | Destroy body (snap-home, re-grab) |
| `physicsClearDynamic()` | Clear all bodies on reset |
| `physicsMarkStaticDirty()` | Flag static colliders for rebuild |

### Legacy (Superseded)
The old hand-rolled sim used 26-direction contact point sampling + custom settlement heuristics. Code still exists in the file but `physicsStep()` is the active path. Can be cleaned up.
