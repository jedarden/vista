# bf-3n2m — Verify safe-zone coordinate calculations for OG images

**Status:** Verified. Unit tests added (30 passing). Two functional bugs found and fixed.

## What was verified

`src/public/safe-zone.js` exposes two pure, dependency-free geometry helpers used by
the cropper overlay in `src/public/app.js`:

- `calculateCropRect(crop, imgW, imgH)` — the source-image rectangle a single
  platform keeps after cropping (`contain` = full image; `cover` = centered crop
  to the platform's aspect ratio).
- `calculateSafeZone(crops, imgW, imgH)` — the intersection of every enabled
  platform's crop rect (the region guaranteed visible across all of them).

All coordinates are in **image space** (natural source pixels). Acceptance
criteria addressed below.

## 1 + 3. Unit tests + expected coordinate ranges

New file: `test/unit/safe-zone.test.js` (30 tests, run with `node test/unit/safe-zone.test.js`).

Coverage: `contain`/`cover` on wider/taller/equal-aspect images, square & vertical
crops, `aspect.min` fallback, retina 2× scaling, null/zero-dim/unknown-cropMode
edge cases, bounds checks, monotonic shrink, coverage ∈ [0,1], order-independence,
and a regression locking down the corrected edge-vs-edge intersection.

**Reference table** — safe zone for representative platform sets and OG image sizes
(values rounded; all in source-image pixels, computed from the real `PLATFORM_CROPS`):

| Platforms | Image | Safe zone (x y w h) | Coverage |
|---|---|---|---|
| facebook (1.91) | 1200×630 | 0, 1, 1200, 628 | 99.7% |
| facebook (1.91) | 1200×1200 | 0, 286, 1200, 628 | 52.4% |
| facebook (1.91) | 1080×1080 | 0, 257, 1080, 565 | 52.4% |
| fb+twitter+linkedin+pinterest | 1200×630 | 389, 1, 422, 628 | 35.1% |
| fb+twitter+linkedin+pinterest | 2400×1260 | 778, 2, 844, 1257 | 35.1% |
| facebook+whatsapp (1:1) | 1200×630 | 285, 1, 630, 628 | 52.4% |
| facebook+whatsapp | 1080×1080 | 0, 257, 1080, 565 | 52.4% |

Ranges that hold for **every** input (asserted in tests):

- `x ≥ 0`, `y ≥ 0`, `x + w ≤ imgW`, `y + h ≤ imgH` (rect always inside the image).
- `coverage ∈ [0, 1]` and equals `(w·h) / (imgW·imgH)`.
- Adding a platform never grows the safe zone (monotonic shrink).
- Cover-crop fractions scale linearly with resolution (1× vs 2× retina).

## 2. Coordinate transform (image space → display space)

**There is no transform — by design, and verified.** `safe-zone.js` produces image
space; both consumers use that same space unchanged:

- On-screen overlay: `svg viewBox = "0 0 imgW imgH"`, rect attributes set directly
  from the safe-zone coords.
- Exported PNG: `canvas.width/height = natural size`, `ctx.strokeRect(x, y, w, h)`
  with the same numbers.

So one coordinate system drives both the overlay and the export. Tests assert the
coords are valid in the viewBox space, valid in the canvas pixel space, and identical
between the two consumers. A `vm`-based check also confirmed `safe-zone.js` exposes
both functions as browser globals when loaded as a `<script>` (no `module`), which
is the wiring `index.html` depends on.

## 4. Calculation errors / edge cases found → FIXED

### (a) `exportCropperOverlay()` used a stale, buggy inline intersection

`updateCropperOverlay()` was already calling the corrected `calculateSafeZone()`,
but `exportCropperOverlay()` still ran the **old** inline loop that `safe-zone.js`
was created to replace:

```js
// BUGGY (mixed a width with an edge coordinate)
safeZone.w = Math.min(safeZone.w, rect.x + rect.w) - safeZone.x;
safeZone.h = Math.min(safeZone.h, rect.y + rect.h) - safeZone.y;
```

`Math.min(width, edge) - x` compares a *width* against a *coordinate* and
under-reports the safe zone whenever the accumulated left/top offset is non-zero,
**and its result depends on platform iteration order**. Concretely, on a 1000×1000
image with `[1.91, 1.0]` crops it returned `h ≈ 285` instead of the correct `523.56`
(45% under-reported) — so the exported PNG overlay drew the wrong (too small) safe
zone while the on-screen overlay was correct.

**Fix:** replaced the inline loop with the same `calculateSafeZone()` call the
on-screen path uses, so the two now agree exactly (`src/public/app.js`).

### (b) `safe-zone.js` was not loaded by `index.html`

`app.js` references `calculateCropRect`/`calculateSafeZone` as globals, and the
file's header states they are "loaded via `<script>` before app.js" — but
`index.html` never included `<script src="safe-zone.js">`. The cropper overlay
would have thrown a `ReferenceError` in the browser. **Fix:** added the script tag
alongside the other pure helper modules, before `app.js`.

### Edge cases handled (no fix needed)

- `null`/`undefined`/empty crop list → full image, coverage 1.
- Unknown `cropMode` → `calculateCropRect` returns `null`, filtered out of the
  intersection (does not collapse the safe zone).
- Zero-dimension image → `calculateCropRect` returns `null`; callers (`app.js`)
  guard with `if (!imgW || !imgH) return;` before reaching the geometry.
- Cover crop with `aspect.max` omitted → falls back to `aspect.min` via
  `aspect.max || aspect.min`.

## Files changed

- `test/unit/safe-zone.test.js` — **new** — 30 unit tests.
- `src/public/app.js` — replaced buggy inline intersection in
  `exportCropperOverlay()` with `calculateSafeZone()`.
- `src/public/index.html` — added missing `<script src="safe-zone.js">`.
- `src/public/safe-zone.js` — already present (untracked); now wired in and covered
  by tests.

## How to run

```bash
node test/unit/safe-zone.test.js     # 30 passed, 0 failed
```
