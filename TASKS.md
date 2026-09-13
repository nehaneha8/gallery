# Tasks — Immersive Art Hallway

Execute in order. Each milestone is meant to be small enough for a single coding-agent session
(commit at the end of each one; feel free to `/clear`/start a fresh session per milestone — the
task description plus `ARCHITECTURE.md` should be enough context, no need to re-read the whole
conversation history).

Read `ARCHITECTURE.md` §matching-the-milestone-number before starting each task below — don't
re-derive decisions already made there.

Do not jump ahead or combine milestones. Do not add features not listed in a milestone's scope.

---

## M0 — Project scaffold + deploy pipeline

**Goal**: prove the deploy path works before building anything real on top of it.

- `npm create vite@latest . -- --template react-ts`
- Install: `three @react-three/fiber @react-three/drei zustand`
- Replace default page with a `<Canvas>` containing one rotating placeholder cube.
- Push to GitHub, connect to Vercel (or Cloudflare Pages), confirm a live deploy URL renders the
  cube.
- Add `ARCHITECTURE.md`-matching folder structure (empty files/folders are fine) from §2.

**Acceptance**: live public URL shows the spinning cube. `npm run build` succeeds with no
TypeScript errors.

---

## M1 — Static hallway environment

**Goal**: the hallway exists and looks right from one fixed camera position. No interactivity.

- Build `Hallway.tsx`: floor, two side walls, ceiling, trim, as merged/simple geometry per
  ARCHITECTURE §14 (few draw calls — a handful of boxes/planes is fine, do not over-engineer
  geometry detail).
- Stylized, cartoony materials per ARCHITECTURE §7 — flat warm wood tones, no photoreal PBR, no
  textures required yet if flat colors read fine (textures can come from `references/hallway/`
  as *inspiration only*, hand-authored stylized textures or flat colors are the deliverable, not
  a copy of the reference photos).
- One fixed camera at eye height (1.6m) looking down the hallway. No movement yet.
- Add fog (ARCHITECTURE §7).

**Acceptance**: hallway reads as a narrow, warm, slightly dim wooden corridor from a single
static viewpoint, matching DESIGN.md's tone (warm/quiet/dreamlike, not bright-white-gallery).

---

## M2 — Waypoint camera system

**Goal**: camera can move between fixed points with clamped look-around. No paintings/doors yet.

- `data/waypoints.ts` with 3–4 placeholder waypoints down the hallway.
- `store/useSceneStore.ts`: `cameraMode`, `activeWaypointId`.
- `CameraRig.tsx`: implements `IDLE` (clamped drag-look) and `MOVING` (eased tween between
  waypoints) per ARCHITECTURE §4. Use `maath`'s `easing.damp3`/`dampE`.
- Temporary debug UI (3 plain HTML buttons, one per waypoint) to trigger moves — this is
  throwaway, will be replaced by real glow points in M7.

**Acceptance**: clicking a debug button smoothly "walks" the camera to that waypoint; dragging
the mouse/touch looks around within the yaw/pitch clamp; no jitter or instant snapping.

---

## M3 — Asset pipeline output + static painting placement

**Goal**: real artwork on the walls, correctly cropped/rectified, placed via data — still no
interaction.

- **Manual step (not code)**: process all images in `my_art/` (except `graffiti.png`, saved for
  M9) through the pipeline in ARCHITECTURE §13 — Photopea perspective-correct + crop, Squoosh
  compress to WebP — output to `public/art/`.
- `data/artworks.ts`: one entry per processed image, per the `Artwork` interface in
  ARCHITECTURE §6. Positions/`wallId`/`rotationY` distributed along the hallway walls built in
  M1 (spacing doesn't need to be pixel-perfect, just plausible).
- `Painting.tsx` + `PaintingWall.tsx`: render each artwork as a plane at its correct aspect
  ratio with a simple frame mesh (flat color/bevel, per ARCHITECTURE §5 — no frame texture
  needed).

**Acceptance**: walking between the M2 waypoints shows real, cleanly-cropped rectangular
artwork hanging on both walls, no visible background/tilt/other-frame bleed from the source
photos.

---

## M4 — Painting interaction

**Goal**: hover/tap glow, click-to-view, return.

- Invisible oversized hit-plane per painting (ARCHITECTURE §5).
- Hover emissive ramp (desktop) + always-on subtle idle pulse (all platforms).
- Click/tap → `cameraMode = 'VIEWING_PAINTING'`, tween to `viewingOffset` pose, show
  `PaintingInfoPanel` (title/blurb from the data model).
- `ReturnButton` (always visible while viewing) + Esc key (desktop) + click-outside all return
  to the pre-viewing waypoint.

**Acceptance**: every painting placed in M3 can be hovered (glow), clicked (camera moves to
face it dead-on, caption shows), and returned from via all three return methods on desktop and
via tap+button on a touch device/emulator.

---

## M5 — Lighting pass + candle/lantern flicker

**Goal**: replace flat lighting with the warm pooled-light system; add flame props.

- `Lighting.tsx`: hemisphere ambient, fog tuning, `ACESFilmicToneMapping`.
- `Candle.tsx` / `Lantern.tsx`: stylized geometry + billboard flame sprite with per-instance
  noise-driven flicker (ARCHITECTURE §9).
- Light pool: 3–4 real `PointLight`s reassigned to nearest flames on waypoint arrival
  (ARCHITECTURE §7/§9) — implement this now, don't defer it, since it's the main perf lever.
- Place candles/lanterns along the hallway at plausible positions.

**Acceptance**: hallway shows warm pools of light around flame props with darker areas between
them (per DESIGN.md); flames flicker gently and asynchronously; frame rate stays smooth when
moving between waypoints (light reassignment shouldn't cause visible pops or hitches).

---

## M6 — Firefly / dust particles

**Goal**: ambient movement in the air.

- `Fireflies.tsx`: shared shader-driven component per ARCHITECTURE §8, instantiated twice
  (`preset="firefly"`, `preset="dust"`), combined count ≤50.
- Slow, irregular, subtle drift — verify against DESIGN.md's "nothing should feel chaotic."

**Acceptance**: fireflies and dust are visibly present but subtle, moving irregularly, capped
at 50 total, no visible per-frame stutter from the particle system (should be effectively free —
if it isn't, the shader-driven approach in ARCHITECTURE §8 wasn't followed, fix that rather than
reducing count first).

---

## M7 — Floor glow interaction points (replace debug buttons)

**Goal**: real in-scene navigation UI matching DESIGN.md.

- `FloorGlowPoint.tsx`: small glowing floor marker, pulsing gently, at each `showGlow` waypoint.
- Wire clicks/taps to the same `cameraMode = 'MOVING'` flow from M2 — remove the M2 debug
  buttons entirely.
- Expand `waypoints.ts` to cover the full hallway length end-to-end.

**Acceptance**: the only way to move through the hallway is clicking/tapping glow points on the
floor; movement feels like walking (eased, not instant); debug buttons are gone.

---

## M8 — Door

**Goal**: door exists, is clickable, swings open.

- `Door.tsx`: pivoted group, `doorState` in the store, click-to-open tween (ARCHITECTURE §10).
- Place at the end of the hallway per DESIGN.md.
- On `OPENING`, log/no-op a placeholder "prefetch bedroom" call (real prefetch wired in M11).

**Acceptance**: clicking the closed door plays a smooth swing-open animation; door stays open
afterward; nothing behind it needs to exist yet (fine to see an empty/placeholder space through
the doorway at this stage).

---

## M9 — Bedroom + graffiti wall

**Goal**: full hallway→bedroom transition with the real graffiti wall.

- **Manual step**: process `my_art/graffiti.png` per ARCHITECTURE §12 — rectify the whole wall
  (incl. window), crop out furniture/floor below the baseboard, export to
  `public/bedroom/graffiti-wall.webp`.
- `Bedroom.tsx`: minimal room geometry (floor/walls matching hallway's stylized material
  language) sized around the wall texture's proportions.
- `GraffitiWall.tsx`: single textured plane using the processed image, window baked in flat
  (per ARCHITECTURE §12 v1 scope — do not attempt the cutout/parallax window yet, that's a
  separate stretch task below).
- Extend `waypoints.ts` with bedroom waypoint(s); implement `DOOR_TRANSITION` camera state
  (ARCHITECTURE §11) triggered on `doorState === 'OPEN'`.

**Acceptance**: opening the door and the resulting camera dolly lands the viewer inside a
recreated bedroom facing the graffiti wall, rectified and cropped with no visible tilt or
stray background from the source photo.

**Stretch (separate follow-up task, do not block M9 completion on this)**: cut a transparent
window hole in the wall texture with a simple night-sky plane behind it for parallax depth.

---

## M10 — Mobile input + performance tuning

**Goal**: make the whole experience work well on a phone.

- `isMobile` detection at boot (ARCHITECTURE §15) stored once in `useSceneStore`.
- One-finger drag-look, tap-to-interact (should mostly already work if hover was correctly
  gated to desktop-only in M4 — verify, don't rebuild).
- `MobileLookLayer.tsx` if a dedicated touch-capture surface is needed beyond the canvas itself.
- Wire Drei's `<PerformanceMonitor>` to step down particle count and/or DPR under sustained low
  frame time (ARCHITECTURE §14).
- Cap `devicePixelRatio` to 1.5–2×.
- Manual test pass on an actual phone or Chrome device emulation: hallway walk, painting
  view/return, door, bedroom.

**Acceptance**: on a mid-tier phone (or throttled emulation), the experience runs without
major stutter, all interactions work via touch, and the always-visible mobile Return button
is present while viewing a painting.

---

## M11 — Loading strategy

**Goal**: no jank on first load or on the door transition.

- `LoadingScreen.tsx`: themed progress indicator (flickering candle, per ARCHITECTURE §16)
  driven by Drei's `useProgress`.
- Code-split `Bedroom`/`GraffitiWall` via `React.lazy` + `Suspense`.
- Trigger the bedroom asset prefetch for real on `doorState === 'OPENING'` (replacing the M8
  placeholder), confirm the graffiti texture is resident before the `DOOR_TRANSITION` camera
  move finishes.

**Acceptance**: first load shows the themed loading screen (not a blank page or generic
spinner) until the hallway is ready; opening the door never shows a pop-in/flash of the
graffiti wall loading late.

---

## M12 — Accessibility / reduced-motion fallback

**Goal**: a non-3D path exists, and reduced-motion is respected inside the 3D scene too.

- `AccessibleListFallback.tsx`: plain list view generated from `artworks.ts` (image, title,
  blurb) — no 3D dependencies in this component.
- Fallback triggers: no WebGL2, `prefers-reduced-motion: reduce`, or an explicit always-visible
  "View as list" link (ARCHITECTURE §17).
- Reduced-motion-but-still-3D case: shorten camera tween durations drastically, slow/stop
  particle drift and flame flicker amplitude.
- Keyboard support: Tab cycles hotspots with a visible focus ring (HTML overlay, projected
  screen position), Enter/Space activates.

**Acceptance**: forcing `prefers-reduced-motion` (or disabling WebGL) shows the list fallback
or a calmed-down 3D scene as appropriate; Tab+Enter alone can navigate to a painting, view it,
and return, without a mouse/touchscreen.

---

## M13 — Polish / QA pass

**Goal**: final coherence check against `DESIGN.md`, not new features.

- Walk the full experience start-to-finish on desktop and mobile; check against DESIGN.md's
  "Visual priorities" ordering (artwork > atmosphere > environment > interaction indicators >
  UI) — if any UI chrome is competing visually with the art, dial it back.
- Verify particle count never exceeds 50, live lights never exceed 4 (ARCHITECTURE §14) via a
  quick runtime check, then remove any debug/console logging left over from earlier milestones.
- Confirm `npm run build` output size is reasonable (art assets should already be small per
  §13 — flag anything unexpectedly large).
- Final deploy, click through the live URL.

**Acceptance**: the live deployed site matches the creative brief in `DESIGN.md` end-to-end,
with no leftover debug affordances.
