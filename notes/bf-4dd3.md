# bf-4dd3 — Fix overlay positioning and alignment issues

**Status:** Fixed. New rendered-alignment e2e added (11 checks, all passing);
existing unit (30) and bf-4ijd e2e (65) still green.

## The bug

The on-screen cropper overlay did **not** sit on top of the rendered `<img>` for
square / portrait OG images. The safe-zone and crop rects were drawn in the
correct *image-space* coordinates (verified by `bf-3n2m` unit tests and the
`bf-4ijd` e2e), but in *screen space* they floated off the image by up to ~98 px.

### Root cause — two different "fit" boxes

- `.cropper-image` is rendered with `max-width:100%; max-height:600px;
  object-fit:contain` — so its box is a `meet`-fit of the natural image into
  `(viewportWidth, 600)`.
- `.cropper-overlay` (the SVG) was `position:absolute; width:100%; height:100%`
  — so it filled the **whole viewport**, and its `viewBox="0 0 imgW imgH"`
  (default `preserveAspectRatio="xMidYMid meet"`) `meet`-fit the image into
  `(viewportWidth, viewportHeight)`.

Those are two different fit boxes. For landscape images the viewport width is
the binding constraint in both, so the boxes coincide and nothing looked wrong.
For **square / portrait** images the 600 px height cap binds for the `<img>`
but not for the SVG (viewport height ≠ 600), so the SVG's effective image-area
was larger and offset from the real image.

Measured (`align-probe`, viewport 900×520):

```
1200×1200 square   img=(150,50 600×600)   svg-eff=(101,1 698×698)   MISALIGNED Δ=98
1000×1500 portrait img=(250,50 400×600)   svg-eff=(217,1 465×698)   MISALIGNED Δ=65–98
1200×630 landscape ALIGNED
2000×600 wide      ALIGNED
```

### Why the prior suites missed it

- `test/unit/safe-zone.test.js` (`bf-3n2m`) tests the **pure geometry** — no DOM.
- `test/e2e/overlay-rendering.e2e.js` (`bf-4ijd`) reads the SVG `<rect>`
  **attributes** (image space) and compares to a Node-side
  `calculateSafeZone()`. The attributes are correct no matter where the SVG's
  box lands, so it passed 65/65 while the overlay was visibly off the image.

Neither ever compared the **rendered** overlay box to the **rendered** `<img>`
box. That screen-space comparison is exactly the gap this bead closes.

## The fix

Make the SVG fill the `<img>`'s box, not the viewport, by wrapping both in a
shrink-to-fit `.cropper-stage`:

`src/public/index.html`:
```html
<div class="cropper-viewport" id="cropperViewport">
  <div class="cropper-stage">
    <img id="cropperImage" class="cropper-image" alt="" />
    <svg id="cropperOverlay" class="cropper-overlay"></svg>
  </div>
</div>
```

`src/public/style.css`:
```css
.cropper-stage { position: relative; display: inline-block; max-width: 100%; line-height: 0; }
.cropper-image { max-width: 100%; max-height: 600px; object-fit: contain; display: block; }
.cropper-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
```

`display:inline-block` makes the stage shrink-wrap the `<img>` (whose own
`max-width/max-height` still anchor it to the viewport width / 600 px cap). The
SVG, now absolutely positioned over the stage, fills exactly the image's
rendered box — so the `viewBox` `meet`-fit lands on the image pixels. No JS
change, no resize listener needed (purely declarative, responsive).

This is purely additive: element IDs are unchanged, so every
`getElementById`/`querySelector` ref in `app.js` still resolves. The
`calculateCropRect` / `calculateSafeZone` geometry is untouched (and correct).

## Verification

New `test/e2e/overlay-alignment.e2e.js` loads the **real** `style.css` +
`safe-zone.js` + `app.js` against the production cropper DOM (with the stage),
drives the real `window.updateCropperOverlay()`, and asserts in **screen space**:

1. SVG element box == `<img>` box (the wrapper fills the image), and
2. the rendered safe-zone `<rect>` (`getBoundingClientRect`, which accounts for
   the viewBox→screen transform) == the image-space safe zone scaled by
   `S = imgRect.width / imgW` and offset by the image origin.

Across landscape / square / portrait / ultra-wide / retina-2× — **11/11 pass**.

The test has teeth: with `.cropper-stage` neutralized to `display:block;
width:100%;height:100%` (≈ old behavior), the square and portrait cases fail
with the documented symptom (SVG 898 px wide vs image 600 px; safe-zone rect at
x=100 instead of x=249). Landscape / wide / retina keep passing either way,
matching the original probe (viewport width binds for those in both boxes).

## Acceptance criteria

- **Fix coordinate calculation errors** — none remained; the `safe-zone.js`
  geometry was already correct (`bf-3n2m`). No change needed.
- **Correct overlay positioning relative to image boundaries** — done via the
  `.cropper-stage` wrapper; the SVG now maps to the image, not the viewport.
- **Ensure overlay aligns with the actual crop area** — verified in screen
  space by the new e2e (safe-zone `<rect>` on its scaled image-space rect).
- **Add any missing transformations or corrections** — the design intentionally
  uses **no** image→display transform (one coordinate system drives both the
  overlay and the export); the fix preserves that by aligning the box instead
  of introducing a transform.

## Note (deliberate non-change)

`bf-4ijd` recorded that the on-screen SVG crop fills use `fill-opacity="0.15"`
while the canvas export uses `color+'40'` (≈0.25). That opacity difference is
intentional (subtle on-screen so the image shows through; more visible in the
export) and is **not** a positioning/alignment issue, so it is left as-is here.

## Files changed

- `src/public/index.html` — wrap cropperImage + cropperOverlay in
  `.cropper-stage`.
- `src/public/style.css` — add `.cropper-stage` (shrink-wrap) rule.
- `test/e2e/overlay-alignment.e2e.js` — **new** — rendered-alignment e2e
  (promoted from the one-off `scratch/align-probe.js`, now deleted).
- `notes/bf-4dd3.md` — this summary.

## How to run

```bash
node test/unit/safe-zone.test.js               # 30 passed
node test/e2e/overlay-rendering.e2e.js         # 65 passed (bf-4ijd, image space)
node test/e2e/overlay-alignment.e2e.js         # 11 passed (bf-4dd3, screen space)
```
