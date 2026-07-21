# bf-6aj — Verify and fix basic crop overlay rendering

**Status:** Fixed + verified. The overlay-rendering defect this bead targeted —
the Crop Visualizer going permanently blank after any no-image / failed-load
result — is resolved. The full overlay suite is green: **30 unit + 133 e2e
checks, 0 failures.**

## The defect

`initCropper()` reached its empty / error state with:

```js
cropperContainer.innerHTML = '<div class="cropper-empty">…</div>';
```

In production `#cropperContainer` is the **ancestor** of `#cropperImage` and
`#cropperOverlay` (`cropper-container > cropper-main > cropper-viewport >
cropper-stage > image/overlay`). Replacing its `innerHTML` **detaches** the
cached element refs `cropperImage` / `cropperOverlay` from the live DOM. Every
subsequent `initCropper()` then wrote to those detached nodes (`img.src`,
`overlay.innerHTML`) — so once a user inspected any URL with no `og:image` (or a
broken image URL), the Crop Visualizer stayed blank for the **rest of the
session**, even on later URLs with valid images.

A secondary symptom: the no-image branch returned *without* clearing
`cropperOverlay.innerHTML`, so a prior result's safe-zone `<rect>` lingered in
the SVG across a no-image re-load. This was documented as a "known minor
limitation" in `notes/bf-5yle.md` and demoted from an asserted contract in the
capstone e2e — `bf-6aj` promoted it to a real (now-passing) assertion.

## The fix

- **`index.html`** — add a dedicated `#cropperEmpty` element as a sibling of
  `.cropper-stage` inside the viewport, starting hidden.
- **`app.js`** — new `showCropperEmpty(message)` helper that resets cropper
  state **in place** (toggles `#cropperEmpty`, clears the overlay/controls/info,
  zeroes `cropperState`) **without** disturbing the cached image/overlay/stage
  refs, so the next successful load recovers. `initCropper()`'s no-image and
  `onerror` branches now call it instead of clobbering `innerHTML`.
- **`style.css`** — position `.cropper-empty` as a centred absolute overlay
  (`position:absolute; inset:0`) so it layers over the viewport rather than
  replacing its children.

No change to safe-zone geometry (`safe-zone.js`) — that was already correct from
`bf-3n2m`. This bead is purely the render-state lifecycle fix.

## Verification

The capstone e2e (`test/e2e/overlay-integration.e2e.js`) was updated to assert
the new contract: a no-image `initCropper` shows `#cropperEmpty` (text + un-hidden)
**and** clears any lingering safe-zone rect in place. The check that previously
documented the stale-rect limitation now asserts it is fixed.

All overlay suites green:

```
test/unit/safe-zone.test.js            30 passed   (bf-3n2m geometry)
test/e2e/overlay-rendering.e2e.js      65 passed   (bf-4ijd SVG + export)
test/e2e/overlay-alignment.e2e.js      11 passed   (bf-4dd3 screen alignment)
test/e2e/overlay-integration.e2e.js    57 passed   (bf-5yle capstone, +bf-6aj no-image reset)
                                      ─────────
                                      163 passed, 0 failed
```

Visual check: on a 2000×600 (3.33:1) OG image the crop rects span full height
and crop the sides, the white dashed safe zone is centred, and **every overlay
aligns to the image edges with no offset or misalignment** (screenshot +
exported PNG in `test-results/overlay-integration/`).

## Scope note on stray artifacts

The working tree carried throwaway investigation probes (`probe-noimage.js`,
`probe-fixtures/`) from debugging this defect; per the repo's "experimental code
→ `~/scratch/`" rule they were removed rather than committed. `test-results/`
(test-run output that regenerates on every e2e run) was added to `.gitignore`.
