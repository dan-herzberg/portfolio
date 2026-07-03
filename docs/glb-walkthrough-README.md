# GLB Walkthrough

A single-file WebXR viewer that turns any `.glb` model into a walkable, interactive environment. Runs on desktop browsers, phones, and Meta Quest 2. No build step, no dependencies to install — everything lives in `viewer.html`.

## Quick start

**Desktop / mobile:** open `viewer.html` (Chrome or Edge recommended). Click **Demo room** to test, or **Load .glb** / drag-and-drop your model.

**Quest 2 (VR):** WebXR requires HTTPS, which GitHub Pages already provides. Open the site's `viewer.html` URL in the Quest browser and press **ENTER VR**.

## How the app classifies your model

Roles come from **node names** at load time:

| Name contains | Becomes |
|---|---|
| `door`, `gate`, `hatch`, `portal` | Swinging door (hinge auto-placed on a vertical edge) |
| `button`, `btn` | Press button (toggles nearby lights within 6 m) |
| `switch`, `lever`, `toggle` | Throw lever (same light behavior) |
| anything else, top-level, under 5 m | Grabbable part with snap-back |
| top-level, over 5 m | Static architecture |

**Name your parts in CAD before export.** A model full of `Mesh_001` nodes produces zero doors and zero switches. In SolidWorks, component and feature names carry through to the GLB exporter.

## Controls

**Desktop:** click canvas to lock the mouse. WASD move, Space jump (walk) or up (fly), C down (fly). Click = interact/teleport. E grab/release, mouse wheel push/pull, R snap home, T edit aimed part, 1/2/3 switch mode.

**Mobile:** left stick moves, drag the right half to look. Buttons: Interact, Grab, Snap, Jump, Edit. Up/Down buttons appear in fly mode.

**Quest 2:** left stick moves, right stick snap-turns. Trigger = interact or teleport. Grip = grab/release. A cycles mode, X resets all parts.

## Grab and snap-back

Grab any registered part, carry it, release it. Release within 0.6 m and ~30° of its original pose and it snaps home automatically. **R** (or the Snap button) forces a snap. **Reset parts** restores every part, closes every door, and turns every switch off.

## In-situ editing (T key / Edit button)

Aim the reticle at a part and press **T**. A panel shows the part's current role with five buttons: door, switch, button, grabbable, static. Pick one and the scene rebuilds with the new role (a second or two on large models). Doors get a **Flip hinge** button to swap the hinge edge.

Edits are stored as an overrides map keyed by node path. They are **not** saved automatically:

- **Export edits** downloads `<model>.overrides.json`.
- **Import edits** (or drag the JSON onto the window) re-applies them.
- Keep the overrides file next to your GLB. Re-exporting the model from CAD keeps the overrides valid as long as node names stay the same.

Overrides file format:

```json
{
  "roles": {
    "Assembly1/Panel_3": { "role": "door", "hinge": "right" },
    "Gear_A": { "role": "grabbable" }
  },
  "settings": { "walkSpeed": 3.6, "flySpeed": 6.5 }
}
```

## Claude command bar (AI button, bottom right)

Type natural-language commands like:

- "make Panel_3 a door hinged on the right"
- "turn every part on the workbench grabbable"
- "open all doors and switch to fly mode"
- "slow walking to 2 m/s"

Claude receives the scene inventory (node paths, roles, states) and returns a structured list of operations, which the app applies and merges into the same overrides map as the manual editor. Free-form code execution is deliberately not allowed — structured ops keep behavior predictable.

**Setup:** press **Key** in the bar and paste an Anthropic API key (console.anthropic.com → API keys). The key lives in page memory only and clears on reload — nothing is written to disk or storage.

**Security notes:**
- Only paste your key on a page you host and trust. Anyone who controls the page's code controls the key while the page is open.
- For a public deployment, put the key behind a small proxy (a Cloudflare Worker holding the key server-side) instead of pasting client-side. The fetch call in `runCommand()` is the only place to change.
- Browser calls use the `anthropic-dangerous-direct-browser-access` header, which Anthropic requires for direct client-side requests.

## Known limits

- Hinge inference assumes a roughly box-shaped door with a vertical hinge on the wide axis. Sliding doors, curved gates, and off-axis doors need the manual hinge flip or won't look right.
- Node paths use names for stability. Unnamed twin nodes fall back to child indices, which shift if the hierarchy changes. Name your parts.
- Collision uses raycasts (ground plus two wall rays), not full physics. Thin geometry can be walked through at high speed.
- Switches toggle lights within 6 m by proximity, not by explicit wiring.
- Quest 2 comfortable range: under ~1M triangles and ~100 MB. Decimate in CAD or gltf-transform (`npx gltf-transform optimize in.glb out.glb`) before loading.
- Edit mode and the Claude bar are flat-screen features. Make your edits on desktop, export the overrides, and the same file drives the VR session.
