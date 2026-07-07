# GLB Walkthrough

A single-file WebXR viewer that turns any `.glb` model into a walkable, interactive environment. Runs on desktop browsers, phones, and Meta Quest 2. No build step, no dependencies to install — everything lives in `viewer.html`.

## Quick start

**Desktop / mobile:** open `viewer.html` (Chrome or Edge recommended). Open the **Load** menu and pick **Load Demo Room** to test, or **Load .glb file** / drag-and-drop your model.

**Quest 2 (VR):** WebXR requires HTTPS, which GitHub Pages already provides. Open the site's `viewer.html` URL in the Quest browser and press **Enter VR** in the top right (only shown when the browser reports VR support). See the standalone [VR instructions page](../vr-instructions.html) for the full walkthrough.

## How the app classifies your model

Doors and switches come from **node names** at load time; everything else is static until you say otherwise:

| Name contains | Becomes |
|---|---|
| `door`, `gate`, `hatch`, `portal` | Swinging door (hinge auto-placed on a vertical edge) |
| `button`, `btn` | Press button (toggles nearby lights within 6 m) |
| `switch`, `lever`, `toggle` | Throw lever (same light behavior) |
| anything else | Static architecture |

Nothing is grabbable by default — see **Grabbing parts** below.

**Name your parts in CAD before export.** A model full of `Mesh_001` nodes produces zero doors and zero switches. In SolidWorks, component and feature names carry through to the GLB exporter.

## Controls

**Desktop:** click canvas to lock the mouse. WASD move, Space or Up arrow to jump (walk) or ascend (fly), C, Shift, or Down arrow to descend (fly). Click = interact/teleport. E grab/release, mouse wheel push/pull, R reset the aimed/held part, T edit aimed part, 1/2/3 switch mode.

**Mobile:** left stick moves, drag the right half to look. Buttons: Interact, Grab, Reset, Jump, Edit. Up/Down buttons appear in fly mode.

**Quest 2:** left stick moves, right stick snap-turns. Trigger = interact or teleport. Grip = grab/release. A cycles mode, X resets the whole scene (parts, doors, switches, and your position).

**Touch detection:** the app decides whether to show the on-screen joystick using the primary pointing device's precision (`pointer: coarse`) plus a mobile user-agent/client-hints check, not just "is a touchscreen present" - so a touchscreen laptop with a mouse attached still reads as desktop.

**Collapsing the panels:** the small circular button above the Scene panel minimizes the whole left-side panel stack down to just that button, leaving the full view unobstructed — click it again to bring the panels back. It starts collapsed by default on touch devices, since the panel stack eats a lot of a phone screen.

**Teleport mode** shows a ring on the floor wherever you're currently aiming, so you can see exactly where you'll land before you click/trigger.

**Button availability:** on touch devices, the on-screen Interact / Grab / Reset / Edit buttons light up when aiming at something that action currently applies to, and the Grab button reads **Release** while you're holding a part. In teleport mode, the Interact button reads **Teleport** while aiming at a spot you can actually teleport to.

**Light/dark environment:** the **Light mode / Dark mode** button in the Scene panel swaps the surrounding environment (sky, fog, ground plane, lighting intensity) between a dark studio look and a bright one. Loaded models keep their own materials either way.

## Grabbing parts

Nothing is grabbable by default. Aim at a part and press **T** (or the Edit button), then pick the **grabbable** role to make it liftable — this works on any named part at any depth, not just top-level ones.

Carrying a part tracks its actual recent motion (from the mouse, the wheel push/pull, or a VR controller), so throwing it imparts real momentum in the direction you were moving it — this glide decays quickly rather than sailing across the room, while the fall itself is driven by ordinary, uniform gravity. On impact the part rotates about its own center of mass and tumbles realistically from one contact to the next (an off-center hit spins it, a flat landing doesn't), rather than following a canned bounce-and-decay curve. It settles once it's bounced at least twice, has three points simultaneously resting on the floor or another object — every mesh is faceted, so even a sphere or cylinder eventually gets three vertices down — and is essentially motionless. The motion requirement is what lets a part that lands tilted keep tipping under gravity to its lowest-energy resting pose instead of freezing mid-tumble; once it truly stops, it freezes exactly there, with no forced re-orientation to any prescribed pose, home or otherwise.

While carrying a part, a thin vertical line drops from the part to whatever is below it, as a depth cue — judging carry height is otherwise hard, especially in VR. Returning a part home is distance-based only: get it within one bounding-box diagonal of its home spot and release, and it snaps back regardless of how it's rotated.

While carrying a part, a translucent ghost of it appears at its home slot as soon as you're close enough (position and angle) that releasing would snap it back — a preview of where it's about to land.

Small real `.glb` loads (longest dimension under 24 in) get a pedestal placed next to them automatically, for a part with nothing else nearby to rest on. Large models skip it. The demo room has its own pedestal regardless of this, since it's built around showcasing small parts.

## The demo box assembly (snap-together parts)

The demo pedestal carries a nested assembly for exercising multi-level grabbing and snapping: a lidded box (`Box_Assembly` → `Box_Lid`, `Box_Body`) containing a two-half `Object` (`Half_A` + `Half_B`, red and blue hemispheres that mate into a sphere).

- **Grab the lid** to open the box; release it near the box and it snaps back on — wherever the box currently is, including in your other hand.
- **Grab the assembled Object** (aim at either half while it's whole) to take it out; grabbing the box body grabs the entire assembly.
- **Pull it apart** (VR): while holding the Object in one hand, grab a half with the other controller to detach it.
- **Snap it together**: bring one half close to the other — whether the other half is in your second hand or resting on a surface — and they weld back into one Object, which ends up in the hand that made the move. Distance is all that matters; orientation corrects itself on the snap.
- The connected Object snaps home into the box, the lid onto the box, and the box assembly onto the pedestal, each within one bounding-box diagonal of its home spot.

## Locked doors

In the part editor, a door also gets a **Lock** toggle. A locked door won't open on interact (the reticle turns red when you aim at one), and the Claude command bar has a matching `setLocked` op ("lock the front door").

## Lights

Set a part's role to **light** to attach a point light at its center and tint its material so it visually reads as a light source. The light's color is taken from the part's own material (falling back to a warm white if none is found), so a red part casts red light and so on. A light created this way is automatically eligible to be toggled by any switch/button within 6 m, same as a light already in the source model.

## Force opaque / Simplify

Two more Scene-panel tools:
- **Force opaque** — strips transparency from every material in the loaded scene. If a part looks see-through and turning this on makes it solid, the transparency is coming from the source model's export (an alpha value or `BLEND` alphaMode in the GLB), not the viewer.
- **Simplify** — a notched slider (3% per notch) that hides the smallest N% of parts by physical size (bounding-box volume). CAD exports often carry a disproportionate share of their triangle budget in tiny fasteners and rounded-edge detail; hiding the smallest parts first is usually the cheapest way to cut a scene down. It's non-destructive — hidden parts come back the moment you move the slider down (or reload the model).

## Grab and reset

Grab any registered part, carry it, release it. Release within one bounding-box diagonal of its original position (so bigger parts get a proportionally bigger snap zone) and it returns home automatically — distance only, orientation doesn't matter. **R** (or the Reset button) forces this for the currently aimed/held part. **Reset scene** restores every part, closes every door, turns every switch off, and puts you back at your spawn point.

For nested parts, the home target follows the parent: a lid snaps onto its box wherever the box currently is, even if the box is in your other hand.

## In-situ editing (T key / Edit button)

Aim the reticle at a part and press **T**. By default this selects the most specific named node under the reticle; use the **Parent**/**Child** buttons in the panel to step up or down the hierarchy if you want to edit a containing assembly or a nested sub-part instead — the `(n/total)` counter shows where you are in that chain.

The panel shows the part's current role with six buttons: door, switch, button, grabbable, static, light. Pick one and the scene rebuilds with the new role (a second or two on large models). Doors get a **Flip hinge** button to swap the hinge edge.

Edits are stored as an overrides map keyed by node path. They are **not** saved automatically:

- **Export edits** downloads `<model>.overrides.json`.
- **Import edits** (or drag the JSON onto the window) re-applies them.
- Keep the overrides file next to your GLB. Re-exporting the model from CAD keeps the overrides valid as long as node names stay the same.

Overrides file format:

```json
{
  "roles": {
    "Assembly1/Panel_3": { "role": "door", "hinge": "right" },
    "Pyramid_A": { "role": "grabbable" }
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
- Player movement collision uses raycasts (ground plus two wall rays), not full physics. Thin geometry can be walked through at high speed.
- Dropped/thrown parts get a small hand-rolled rigid-body approximation, not a full physics engine: contact points are sampled from each part's own geometry rather than a true convex hull, so a concave part (an L-bracket's notch, for instance) can rest very slightly above its true resting surface at the concavity. Good enough for realistic-looking tumbling, not exact CAD-accurate collision.
- Switches toggle lights within 6 m by proximity, not by explicit wiring.
- Quest 2 comfortable range: under ~1M triangles and ~100 MB. Decimate in CAD or gltf-transform (`npx gltf-transform optimize in.glb out.glb`) before loading.
- Edit mode and the Claude bar are flat-screen features. Make your edits on desktop, export the overrides, and the same file drives the VR session.
