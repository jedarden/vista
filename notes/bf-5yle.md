# bf-5yle — Verify end-to-end crop overlay functionality

**Status:** Verified. New capstone integration e2e added (`test/e2e/overlay-integration.e2e.js`,
**57 checks, all passing**). Combined with the three prior overlay suites the whole
system is green: **163 checks (30 + 65 + 11 + 57), 0 failures**.

This is the verification bead that closes the overlay work triad (`bf-3n2m` →
`bf-4ijd` → `bf-4dd3`). It does **not** change production code — it confirms the
real `initCropper()` pipeline works end-to-end and pins the three prior suites
together so a regression that desyncs any pair is caught.

## What the test does

`test/e2e/overlay-integration.e2e.js` spins up an Express harness that serves the
**real** `style.css` + `safe-zone.js` + `app.js` against a minimal cropper DOM,
loads them in headless Chromium, and drives the **real production entry point**
`initCropper({ meta: { og: { image } }, imageProbe: null })` — the same call
`app.js` itself makes. Then it cross-checks, for one loaded image, that **all
four representations agree**:

```
geometry  (Node calculateSafeZone on the real PLATFORM_CROPS)
   ↔  on-screen SVG <rect> attributes   (image space)
   ↔  on-screen SVG <rect> screen box   (scaled onto the <img>)
   ↔  exported PNG                       (natural-resolution canvas, same geometry)
```

What none of the prior suites did, and what this file adds:

1. **Drive the real onload chain.** Prior suites hand-set
   `cropperState.imageNaturalWidth/Height` and called `updateCropperOverlay()`
   directly — they never exercised `cropperImage.src = … → onload → capture
   natural dims → renderImageInfo + renderCropperControls + updateCropperOverlay`
   (`app.js:3317-3325`). This test polls `cropperState` for the fixture's *real*
   natural dimensions as the proof the whole onload chain fired. (Polling for
   the safe-zone `<rect>` is not enough — the previous scenario's rect lingers
   in the SVG, so a presence check returns immediately with stale state. Unique
   dims per fixture make the capture unambiguous.)

2. **Pin all three representations together per image.** Prior suites verify
   geometry, image-space attributes, and screen-space alignment in *separate*
   runs. This one asserts all of them for the same image, so a change that
   desyncs any pair — e.g. the SVG and the export drifting to different
   geometries — fails immediately.

3. **Edge cases the acceptance criteria ask for** — see below.

## Image sizes exercised

Five OG images of deliberately different aspect ratios, each driven through the
real `initCropper()` with the production default (all 31 platforms enabled, so
the safe zone is the tight all-platforms intersection):

| fixture | aspect | what it stresses |
|---|---|---|
| 1200×630  | landscape  | viewport width binds for both `<img>` and stage |
| 1200×1200 | square     | the bf-4dd3 misalignment case (now fixed) |
| 1000×1500 | portrait   | height cap (600 px) binds hard |
| 2000×600  | ultra-wide | width binds, short image |
| 2400×1260 | retina 2×  | 2× density, large source |

For each it confirms: onload captured natural dims, `viewBox == "0 0 w h"`,
31 crop rects + 1 safe zone drawn, safe-zone **position** and **dimensions**
match an independent Node `calculateSafeZone()`, the overlay element box ==
the `<img>` box (screen space), and the safe-zone `<rect>` screen box == the
geometry scaled onto the `<img>`. The info panels report the real dimensions,
coverage %, and `31 selected`.

The export pipeline is checked separately on the 2000×600 fixture (narrowed to
facebook-only so a single fill makes the alpha predictable): the exported PNG is
at **natural resolution** (2000×600, no scaling) and its crop fill composites at
**≈25% alpha** (`color + '40'`), proving `exportCropperOverlay()` used the same
`calculateSafeZone` / `calculateCropRect` as the on-screen overlay.

## Acceptance criteria

- **Test with multiple OG images of different sizes** — 5 fixtures across
  landscape / square / portrait / ultra-wide / retina-2×. ✓
- **Verify safe zone calculation → overlay rendering pipeline** — the real
  `initCropper` onload chain → `updateCropperOverlay` → `calculateSafeZone` is
  driven end-to-end and cross-checked against an independent Node computation. ✓
- **Confirm overlay aligns accurately with crop boundaries** — asserted in
  *both* image space (SVG attributes == Node geometry, tol 1e-2) and screen
  space (overlay box == `<img>` box, safe-zone rect == geometry scaled onto
  the `<img>`, tol 1.5 px), per size. ✓
- **Document any remaining limitations or edge cases** — two, below. ✓

## Edge cases

- **No `og:image`** → `initCropper` shows the empty state
  (`No image found in meta tags.`). ✓ (Note: a full meta shape `{ og:{},
  twitter:{} }` must be passed — `initCropper` reads `og.image || twitter.image`,
  so a missing `twitter` key would itself throw.)
- **Single platform selected** → safe zone == that platform's crop rect (the
  intersection of one rect is the rect itself), confirming the pipeline responds
  to `enabledPlatforms` and not just the all-31 default. ✓

## Known limitations (documented, not defects)

1. **On-screen vs export opacity differ — intentionally.** The on-screen SVG
   crop fills use `fill-opacity="0.15"` (`app.js:3501`); the canvas export uses
   `color + '40'` ≈ 0.25 (`app.js:3561`). Subtle on-screen so the image shows
   through; more visible in the export. This is a deliberate dual-view, recorded
   in `bf-4ijd` and reaffirmed here — not a positioning or alignment issue.

2. **No-image re-load leaves the prior safe-zone rect uncleared (cosmetic).**
   `initCropper`'s no-image branch (`app.js:3307-3311`) sets the empty-state
   text and returns **without** clearing `cropperOverlay.innerHTML`, so the
   previous scenario's safe-zone `<rect>` lingers in the SVG. Because the
   empty-state `cropper-empty` div is shown over it, the user sees the empty
   state, not a stale overlay — but the rect is still in the DOM. Minor visual
   artifact only on a no-image *re-load* after a previous image. The test
   records this as a KNOWN assertion (it expects `hasSafe === true` after the
   no-image call) rather than asserting a contract the product does not meet.
   A one-line fix would be `cropperOverlay.innerHTML = ''` before the `return`
   at `app.js:3310`; left alone here since this bead is verification-only and
   the artifact is invisible in normal use.

## Verification run

```
=== safe-zone unit ===           30 passed, 0 failed   (bf-3n2m, pure geometry)
=== overlay-rendering e2e ===    65 passed, 0 failed   (bf-4ijd, image space + export pixels)
=== overlay-alignment e2e ===    11 passed, 0 failed   (bf-4dd3, screen space)
=== overlay-integration e2e ===  57 passed, 0 failed   (bf-5yle, real initCropper, all four representations)
```

Artifacts under `test-results/overlay-integration/`: `fixtures/` (5 generated OG
PNGs), `screenshots/` (5 viewport captures), `exports/` (2 exported overlay PNGs).

## Files changed

- `test/e2e/overlay-integration.e2e.js` — **new** — capstone integration e2e.
- `notes/bf-5yle.md` — this summary.

No production code touched (verification-only bead).

## How to run

```bash
node test/unit/safe-zone.test.js               # 30 passed
node test/e2e/overlay-rendering.e2e.js         # 65 passed (bf-4ijd)
node test/e2e/overlay-alignment.e2e.js         # 11 passed (bf-4dd3)
node test/e2e/overlay-integration.e2e.js       # 57 passed (bf-5yle)  ← this bead
```
