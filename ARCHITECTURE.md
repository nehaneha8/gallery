# Architecture — Immersive Art Hallway

Source of truth for how this project is built. Read this once per session instead of
re-deriving decisions. Pairs with `TASKS.md` (execution order) and `DESIGN.md` (creative brief).

## 1. Stack

- **Vite + React + TypeScript** — fast dev server, simple static build for Vercel/Cloudflare Pages.
- **@react-three/fiber** — scene graph as React components.
- **@react-three/drei** — `useTexture`, `useGLTF`, `Html`, `useProgress`/`Loader`, `PerformanceMonitor`, `ContactShadows`.
- **zustand** — global state (camera mode, active waypoint, door state, viewed painting, settings). No Redux, no context-provider soup.
- **maath** (drei dependency) — `easing.damp3` / `dampE` for all camera/property tweening instead of a tween library.
- **No physics engine.** No `@react-three/postprocessing` in v1 (revisit only if perf budget allows bloom on flames).

Do not add a router — this is a single scene, not multiple pages.

## 2. Directory layout

```
src/
  App.tsx                 // Canvas + Suspense + UI overlay composition
  store/
    useSceneStore.ts       // zustand: cameraMode, activeWaypointId, doorState, viewedArtworkId, isMobile, reducedMotion
  data/
    artworks.ts             // Artwork[] manifest (see §6)
    waypoints.ts             // Waypoint graph (see §4)
  three/
    CameraRig.tsx
    Lighting.tsx
    Hallway.tsx
    PaintingWall.tsx
    Painting.tsx
    Candle.tsx
    Lantern.tsx
    Fireflies.tsx            // shared with DustMotes via props
    FloorGlowPoint.tsx
    Door.tsx
    Bedroom.tsx               // lazy
    GraffitiWall.tsx          // lazy, lives under Bedroom
  ui/
    LoadingScreen.tsx
    PaintingInfoPanel.tsx
    ReturnButton.tsx
    MobileLookLayer.tsx
    AccessibleListFallback.tsx
  lib/
    easing.ts                // thin wrappers over maath damp for camera/property tweens
public/
  art/*.webp                 // processed, cropped, compressed artwork (output of asset pipeline)
  bedroom/graffiti-wall.webp
  hallway/*.webp              // floor/wall/trim textures (stylized, not photoreal)
references/                   // mood boards only — NEVER imported/shipped
my_art/                       // raw source photos — NEVER imported/shipped directly
```

Raw files in `references/` and `my_art/` are inputs to the offline asset pipeline (§13), not
runtime assets. Nothing in `src/` should ever `import` from those two folders.

## 3. Scene hierarchy

```
<Canvas>
  <Suspense fallback={null}>       // Drei <Loader> handles the visible loading UI
    <CameraRig />                   // owns the camera, reads store for target pose
    <Lighting />                    // ambient/hemisphere + fog + light-pool consumer
    <Hallway />                     // merged static floor/walls/ceiling/trim
    <PaintingWall artworks={artworks} />   // maps data → <Painting> instances
    {candlePositions.map(p => <Candle key={p.id} {...p} />)}
    {lanternPositions.map(p => <Lantern key={p.id} {...p} />)}
    <Fireflies count={40} preset="firefly" />
    <Fireflies count={30} preset="dust" />
    {waypoints.filter(w => w.showGlow).map(w => <FloorGlowPoint key={w.id} waypoint={w} />)}
    <Door />
    <Suspense fallback={null}>
      <Bedroom />                   // mounted eagerly but assets lazy-imported; see §16
    </Suspense>
  </Suspense>
</Canvas>
<LoadingScreen />
<PaintingInfoPanel />
<ReturnButton />
<MobileLookLayer />
<AccessibleListFallback />          // rendered instead of <Canvas> when fallback triggers (§17)
```

## 4. Camera / navigation system

**No free-fly, no pointer lock.** Movement is a fixed **waypoint graph** (`data/waypoints.ts`):

```ts
interface Waypoint {
  id: string;
  position: [number, number, number]; // eye height baked in, ~1.6m y
  lookAt: [number, number, number];
  showGlow: boolean;      // render a FloorGlowPoint here
  connectsTo: string[];   // adjacency, for future path-drawing/validation only
}
```

Camera states (zustand `cameraMode`):

- `IDLE` — parked at `activeWaypointId`. Mouse/touch drag orbits look direction within a clamp
  (yaw ±50°, pitch ±20°) around the waypoint's base `lookAt`. Implemented as an offset added to
  the base direction, not a real orbit control — keeps it "calm and deliberate" per DESIGN.md.
- `MOVING` — tweening position+quaternion from current waypoint to a new one via
  `easing.damp3`/`dampE` over ~1.2–1.8s (duration scales slightly with distance so it reads as
  walking, not teleporting). Look-drag disabled during this state.
- `VIEWING_PAINTING` — tweened to a painting's precomputed viewing pose; look-drag disabled or
  heavily clamped; CSS vignette overlay fades in.
- `DOOR_TRANSITION` — scripted, non-interactive dolly through the doorway (§11).

Clicking a `FloorGlowPoint` sets `activeWaypointId` and `cameraMode = 'MOVING'`. On arrival,
`cameraMode = 'IDLE'`.

## 5. Painting interaction system

- Each `Painting` renders the processed rectangular texture on a plane, framed by a simple
  frame mesh (geometry only, no photoreal frame texture needed — flat color + bevel reads fine
  at the cartoony fidelity level).
- An invisible hit-plane ~15–20% larger than the visual painting is the raycast target (bigger
  tap target on mobile, forgiving on desktop).
- **Hover** (desktop only — mobile has no hover): lerp an emissive/rim intensity uniform up over
  ~150ms, `cursor: pointer`.
- **Idle pulse** (mobile + desktop): a slow, subtle sine pulse on the same emissive uniform runs
  always, so touch users get an affordance without hover. Keep amplitude small — DESIGN.md says
  "nothing should feel chaotic."
- **Click/tap**: `viewedArtworkId` set, `cameraMode = 'VIEWING_PAINTING'`, camera tweens to
  `artwork.position + normal * artwork.viewingOffset` looking at `artwork.position`.
  `PaintingInfoPanel` fades in with title/blurb.
- **Return**: Esc key (desktop), tap outside the painting, or the always-visible `ReturnButton`
  (required on mobile). Tweens camera back to the waypoint active before viewing started.

## 6. Artwork data model

```ts
interface Artwork {
  id: string;
  title: string;
  year?: string;
  medium?: string;
  blurb?: string;
  src: string;                 // public/art/xxx.webp — already cropped+rectified, see §13
  aspectRatio: number;         // width / height, drives plane geometry, no runtime image probing
  frameStyle: 'thin-gold' | 'dark-wood' | 'none';
  wallId: string;               // which hallway wall segment it belongs to
  position: [number, number, number];
  rotationY: number;
  viewingOffset: number;        // distance along wall normal for the camera stop point
}
```

Lives entirely in `src/data/artworks.ts` as a plain array. **Adding a painting later is a data
edit, not a scene-code change** — this is the main token-efficiency lever for ongoing content
updates.

## 7. Lighting system

- One dim `HemisphereLight` (warm sky / darker ground) for ambient fill.
- A handful of `PointLight`s at candle/lantern positions, warm color (~`#ffb066`), short
  `distance`/decay so pools of light stay local (per DESIGN.md: "warm pools ... darker areas
  between").
- **Light pool**: only the nearest 3–4 flames to the camera get a real light (§9) — everything
  else is emissive-only. Recompute nearest-N once per waypoint arrival, not every frame.
- Fog: `THREE.FogExp2`, warm brown, tuned so the far end of the hallway/door fades rather than
  hard-clips.
- Renderer: `ACESFilmicToneMapping`, exposure slightly reduced for coziness.
- Materials: prefer `MeshToonMaterial` or a `MeshStandardMaterial` with flattened
  roughness/no environment reflections — deliberately non-photoreal per DESIGN.md ("obviously
  not a real hallway").
- Shadows: at most one baked `<ContactShadows>` plane under key props. No per-object real-time
  shadow maps — too expensive for the mobile budget for negligible visual payoff at this style.

## 8. Firefly / particle system

One component, two presets, shared implementation:

```tsx
<Fireflies count={40} preset="firefly" />  // warm, sparse, slow irregular drift
<Fireflies count={30} preset="dust" />     // cool-grey, denser, slower, smaller
```

- Single `THREE.Points` (or `InstancedMesh` if a billboard sprite look is wanted) with a custom
  shader. Per-instance random phase/seed baked into an attribute at creation; drift computed
  from `uTime` + seed in the **vertex shader** (sine/noise-based wander), not a per-frame JS loop
  over instances — this is what keeps 50+ particles essentially free on any device.
- Hard cap: `firefly.count + dust.count <= 50` (DESIGN.md's ceiling for simultaneously visible
  glow points, excluding dust which reads as atmosphere not "fireflies" — keep fireflies alone
  well under 50, e.g. 25–30, and treat dust as a separate cheap budget).
- Additive blending, small point size, warm/cool color per preset.

## 9. Candle / lantern implementation

- Geometry: simplified primitive-based candle/holder and lantern cage — cartoony, not
  photoreal wax/metal. No need to model dripping wax geometry from the reference photos; the
  reference images are mood only.
- Flame: a small additive-blended billboard sprite (`<Sprite>` or a camera-facing plane) per
  flame. All flames share one flicker function: `intensity/scale = base + noise(uTime, seed) *
  amplitude`, seed per-instance so they don't flicker in sync.
- **Light pool** (perf-critical): maintain a small array of real `THREE.PointLight`s (3–4 total).
  On waypoint arrival, reassign these lights to the N nearest candle/lantern positions; every
  other flame is visual-only (emissive material, no light contribution). This is the single
  biggest lever for keeping mobile GPU cost down while still reading as "lit from many points."

## 10. Door animation / state system

- `doorState: 'CLOSED' | 'OPENING' | 'OPEN'` in the store.
- Door mesh is a group pivoted at the hinge edge (not the panel center).
- Click when `CLOSED` → `doorState = 'OPENING'`, tween `rotationY` 0→~100° eased over ~1.5s →
  `doorState = 'OPEN'`.
- `OPENING` start is also the trigger to begin prefetching bedroom assets (§16) so they're ready
  before the transition camera move begins.
- Door does not need to close again — leave it open (fits the dreamlike, low-friction feel).

## 11. Hallway → bedroom transition

No special camera system — reuses the waypoint tween (§4). Sequence:

1. Door click → `OPENING` animation plays, bedroom asset prefetch kicks off in parallel.
2. On `doorState === 'OPEN'`, push `cameraMode = 'DOOR_TRANSITION'`: a scripted tween through 2–3
   intermediate points (doorway threshold → just inside bedroom) so it reads as walking through,
   not a camera cut.
3. On arrival, `cameraMode = 'IDLE'` with `activeWaypointId` set to the bedroom's entry waypoint,
   which is just another node in the same `waypoints.ts` graph (hallway and bedroom waypoints
   live in one graph — no separate "scene" concept needed).

Both `Hallway` and `Bedroom` stay mounted simultaneously (scene is small enough; avoids
unmount/remount edge cases). Only the **assets** (graffiti wall texture) are lazily loaded.

## 12. Graffiti wall reconstruction strategy

The source photo (`my_art/graffiti.png`) is a full room shot — bed, desk, fan, window, and the
graffiti-covered wall all in one frame. It is **not** a set of discrete framed paintings and
must not go through the `Artwork` data model.

Approach:

1. **Perspective-correct the whole wall** (including the window) as one rectangle, the same
   manual technique as painting correction (§13) but with the 4 corners being the wall's
   corners, not a picture frame's.
2. **Crop out everything below the baseboard** (bed, desk, floor, chair) — that lower region is
   rebuilt generically in 3D (same stylized floor material as the hallway, plain wall-color
   baseboard) rather than trying to salvage cluttered photo content.
3. Apply the rectified, cropped image as a single texture on one large wall plane in `Bedroom`,
   sized to real-world-ish proportions (measure against the door width already established in
   the hallway for scale consistency).
4. **Window handling, v1**: leave the window baked flat into the texture (cheapest, ships first).
   **Stretch task** (separate TASKS.md item, not a blocker): cut a transparent hole where the
   window is and place a simple night-sky/gradient plane behind it for a bit of parallax depth.
5. No per-sticker interactivity in v1 — the wall is a single decorative surface, matching
   DESIGN.md's "recreation of my bedroom," not another gallery wall.

## 13. Asset pipeline (offline, manual — do not automate)

Given ~12 source photos at 1–2MB each, phone-shot and slightly tilted with visible backgrounds,
automating corner-detection/perspective-correction is not worth the engineering (or agent token)
cost. Do this by hand once per image:

1. Open the raw photo in **Photopea** (free, browser-based, no install) or any editor with a
   perspective/distort transform.
2. Drag the 4 corners of the artwork (or, for the graffiti wall, the 4 corners of the wall) to
   straighten it into a clean rectangle; crop tight to that rectangle — no background, no
   frame-of-someone-else's-art, no wall bleeding in.
3. Export as PNG, long edge capped at **1600px** for paintings (**2048px** for the graffiti wall
   as the one hero asset).
4. Run the export through **Squoosh** (free, browser-based) to WebP, ~80% quality, target
   **<300KB** per file.
5. Save into `public/art/<id>.webp` (or `public/bedroom/graffiti-wall.webp`), matching the `id`
   used in `artworks.ts`.
6. Record the final `aspectRatio` (width/height) in the manifest — do not probe image dimensions
   at runtime.

This whole pipeline is a one-time content step per artwork, done by the site owner, not
something a coding agent should build tooling for.

## 14. Performance constraints

- Target: 60fps desktop, 30fps+ mid-tier mobile.
- ≤50 total particles on screen (§8), split firefly/dust.
- ≤4 live `THREE.PointLight`s at any time (light pool, §9/§7).
- Hallway static geometry (floor/walls/ceiling/trim) merged into as few meshes/draw calls as
  reasonably possible; repeated props (candles, lanterns) instanced.
- Textures pre-compressed to WebP, capped resolution (§13), mipmapped.
- `devicePixelRatio` capped to 1.5–2×.
- No shadow maps beyond one baked `<ContactShadows>` plane; no postprocessing pipeline in v1.
- Wire up Drei's `<PerformanceMonitor>` to step down particle count and/or DPR if frame time
  degrades — one adaptive knob is enough, don't build a full quality-settings menu.

## 15. Desktop / mobile interaction differences

| | Desktop | Mobile |
|---|---|---|
| Look | click-drag orbit within clamp | one-finger drag orbit within clamp |
| Interact affordance | hover glow ramp + cursor pointer | always-on subtle idle pulse (no hover exists) |
| Activate | click | tap |
| Hit targets | painting-sized + margin | larger margin (§5) |
| Return from painting | Esc key, click-outside, or button | button only (always visible) |
| Perf defaults | full particle/light budget | `PerformanceMonitor` may step down further |

Detect mobile via a combination of touch capability + viewport width, stored once in
`useSceneStore.isMobile` at boot (not re-checked every frame).

## 16. Loading strategy

- First paint: hallway geometry + hallway textures + all painting textures (small total payload
  given the compression target in §13 — roughly 12 images × <300KB). Behind a themed
  `LoadingScreen` (a single flickering candle + progress glow, driven by Drei's `useProgress`,
  not a generic spinner — keep in tone).
- Bedroom (`GraffitiWall` texture) is `React.lazy`-imported and its texture prefetch begins the
  moment the door starts `OPENING` (§10/§11), so by the time the door-transition camera move
  finishes, the texture is already resident.
- Wrap each lazy group in its own `<Suspense fallback={null}>` so a slow bedroom load never
  blocks the initial hallway paint.

## 17. Accessibility / fallback strategy

- **Fallback trigger**: no WebGL2 support, `prefers-reduced-motion: reduce`, or an explicit
  "View as list" link always present in the minimal UI.
- **Fallback view** (`AccessibleListFallback`): plain 2D scrollable list — image, title, blurb —
  generated directly from `artworks.ts`. This is the real accessible path; the 3D scene is not
  expected to be independently screen-reader-usable.
- **Reduced motion, still-in-3D case** (user hasn't forced the fallback but OS flag is set):
  shorten/flatten camera tween easing toward near-instant cuts, stop or drastically slow
  particle drift and flame flicker amplitude.
- **Keyboard support**: Tab cycles interactive hotspots (glow points, paintings, door) with a
  visible focus outline (rendered as an HTML overlay ring positioned via a projected screen
  coordinate, not a 3D outline shader); Enter/Space activates the focused hotspot, same
  transition as a click.
- Ensure all HTML overlay text (captions, buttons) meets WCAG AA contrast against its own panel
  background, independent of the dark 3D backdrop behind it.

## 18. Milestones

See `TASKS.md` for the actual task breakdown and acceptance criteria. Sequence summary:

M0 scaffold+deploy → M1 static hallway → M2 camera/waypoints → M3 asset pipeline+static paintings
→ M4 painting interaction → M5 lighting+flicker → M6 particles → M7 floor glow points → M8 door →
M9 bedroom+graffiti wall → M10 mobile/perf → M11 loading → M12 accessibility → M13 polish/QA.
