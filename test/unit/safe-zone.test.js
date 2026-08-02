'use strict';

/**
 * Unit tests for the OG-image safe-zone geometry (bf-3n2m).
 *
 * These exercise the pure helpers in src/public/safe-zone.js — the cropper
 * overlay geometry that updateCropperOverlay() and exportCropperOverlay() in
 * app.js rely on. No DOM, no network.
 *
 * calculateCropRect()  → the source-image rectangle ONE platform keeps.
 * calculateSafeZone()  → the intersection of MANY platforms' crop rects, i.e.
 *                        the region guaranteed visible across all of them.
 *
 * Coverage goals (from the bead's acceptance criteria):
 *   1. Various OG image sizes — landscape/portrait/square/retina.
 *   2. Coordinate transform — confirms there IS none needed: image space and
 *      display space share one coordinate system (SVG viewBox == canvas pixels
 *      == natural image px), so the same numbers drive the overlay and export.
 *   3. Expected coordinate ranges — locked down per image dimension below.
 *   4. Calculation errors / edge cases — including a regression that pins the
 *      corrected edge-vs-edge intersection (the old inline loop in app.js mixed
 *      a width with an edge coordinate and under-reported the safe zone).
 *
 * All expected values below were derived by hand from the geometry and then
 * cross-checked against the module; floats use approxEqual (1e-6 tolerance).
 */

const {
  calculateCropRect,
  calculateSafeZone,
  calculateVisiblePercentage,
} = require('../../src/public/safe-zone');

// --- tiny assertion helpers -------------------------------------------------

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      (msg || 'assertEqual failed') +
        ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function approxEqual(actual, expected, msg, tol = 1e-6) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(
      (msg || 'approxEqual failed') +
        ` — expected ~${expected}, got ${actual}`
    );
  }
}

function test(description, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${description}`);
    console.error(`      ${err.message}`);
  }
}

// --- crop-spec builders mirroring PLATFORM_CROPS entries -------------------

// A 'cover' platform with a fixed aspect ratio (min == max), e.g. facebook 1.91.
function cover(ar) {
  return { aspect: { min: ar, max: ar }, cropMode: 'cover' };
}

// A 'cover' platform whose crop AR is given only by aspect.min (max omitted),
// e.g. a spec shaped like reddit's but in cover mode. cropRect must fall back
// to aspect.min via `aspect.max || aspect.min`.
function coverMinOnly(ar) {
  return { aspect: { min: ar }, cropMode: 'cover' };
}

// A 'contain' platform (full image shown, nothing cropped): google, slack.
function contain() {
  return { aspect: { min: 0, max: Infinity }, cropMode: 'contain' };
}

// ---------------------------------------------------------------------------
// calculateCropRect
// ---------------------------------------------------------------------------

console.log('\nsafe-zone / calculateCropRect (bf-3n2m)\n');

test('contain returns the full image (nothing cropped)', () => {
  const r = calculateCropRect(contain(), 1200, 630);
  assertEqual(r.x, 0);
  assertEqual(r.y, 0);
  assertEqual(r.w, 1200);
  assertEqual(r.h, 630);
});

test('cover on a WIDER image crops the sides, keeps full height', () => {
  // 2000x600 (AR 3.33) vs 1.91 crop → cropW = 600 * 1.91 = 1146, centered.
  const r = calculateCropRect(cover(1.91), 2000, 600);
  assertEqual(r.x, 427);
  assertEqual(r.y, 0);
  assertEqual(r.w, 1146);
  assertEqual(r.h, 600);
});

test('cover on a WIDER image via aspect.min fallback (max omitted)', () => {
  const r = calculateCropRect(coverMinOnly(1.91), 2000, 600);
  assertEqual(r.w, 1146);
  assertEqual(r.h, 600);
});

test('cover on a TALLER image crops top/bottom, keeps full width', () => {
  // 1000x1000 (AR 1) vs 1.91 crop → cropH = 1000 / 1.91 ≈ 523.56, centered.
  const r = calculateCropRect(cover(1.91), 1000, 1000);
  assertEqual(r.x, 0);
  approxEqual(r.w, 1000);
  approxEqual(r.y, 238.21989528795808);
  approxEqual(r.h, 523.5602094240838);
});

test('cover with a SQUARE crop on a tall image', () => {
  // 600x1200 (AR 0.5) vs 1:1 → cropH = 600 / 1 = 600, centered vertically.
  const r = calculateCropRect(cover(1.0), 600, 1200);
  assertEqual(r.x, 0);
  assertEqual(r.y, 300);
  assertEqual(r.w, 600);
  assertEqual(r.h, 600);
});

test('cover with a VERTICAL crop (pinterest 0.67) on a standard 1200x630', () => {
  // AR 1.90 > 0.67 → cropW = 630 * 0.67 = 422.1, centered horizontally.
  const r = calculateCropRect(cover(0.67), 1200, 630);
  approxEqual(r.x, 388.95);
  assertEqual(r.y, 0);
  approxEqual(r.w, 422.1);
  assertEqual(r.h, 630);
});

test('cover where image AR EQUALS crop AR keeps the full image (boundary)', () => {
  // 1200x600 (AR 2) vs 2:1 — `imgAR > cropAR` is false at equality, so the
  // else-branch computes cropW=1200, cropH=600: zero crop, full image.
  const r = calculateCropRect(cover(2), 1200, 600);
  assertEqual(r.x, 0);
  assertEqual(r.y, 0);
  assertEqual(r.w, 1200);
  assertEqual(r.h, 600);
});

test('cover just past the boundary still crops the sides', () => {
  // 1200x600 (AR 2) vs 1.5:1 → 2 > 1.5, cropW = 600 * 1.5 = 900.
  const r = calculateCropRect(cover(1.5), 1200, 600);
  assertEqual(r.x, 150);
  assertEqual(r.y, 0);
  assertEqual(r.w, 900);
  assertEqual(r.h, 600);
});

test('cover on a retina 2x image (2400x1260) scales linearly — same fractions', () => {
  // 2x of the standard 1200x630; crop fractions must match the 1x case.
  const r1 = calculateCropRect(cover(0.67), 1200, 630);
  const r2 = calculateCropRect(cover(0.67), 2400, 1260);
  approxEqual(r2.x / r1.x, 2);
  approxEqual(r2.y / r1.y, 2, 'y should double at 2x');
  approxEqual(r2.w / r1.w, 2);
  approxEqual(r2.h / r1.h, 2);
});

test('returns null for null/undefined crop', () => {
  assert(calculateCropRect(null, 1200, 630) === null);
  assert(calculateCropRect(undefined, 1200, 630) === null);
});

test('returns null for zero-dimension image', () => {
  assert(calculateCropRect(cover(1.91), 0, 630) === null);
  assert(calculateCropRect(cover(1.91), 1200, 0) === null);
});

test('returns null for an unknown cropMode', () => {
  assert(
    calculateCropRect({ aspect: { min: 1, max: 1 }, cropMode: 'wibble' }, 100, 100) === null
  );
});

test('every cover rect stays within [0,imgW] x [0,imgH]', () => {
  const sizes = [[1200, 630], [2000, 600], [1000, 1000], [600, 1200], [2400, 1260]];
  const ars = [0.67, 1, 1.28, 1.5, 1.91];
  for (const [w, h] of sizes) {
    for (const ar of ars) {
      const r = calculateCropRect(cover(ar), w, h);
      assert(r.x >= -1e-9 && r.y >= -1e-9, `rect origin negative for ${w}x${h} ar${ar}`);
      assert(r.x + r.w <= w + 1e-6, `rect overflows right for ${w}x${h} ar${ar}`);
      assert(r.y + r.h <= h + 1e-6, `rect overflows bottom for ${w}x${h} ar${ar}`);
    }
  }
});

// ---------------------------------------------------------------------------
// calculateSafeZone
// ---------------------------------------------------------------------------

console.log('\nsafe-zone / calculateSafeZone (bf-3n2m)\n');

test('single cover crop → safe zone equals that crop rect, coverage correct', () => {
  const sz = calculateSafeZone([cover(1.91)], 2000, 600);
  assertEqual(sz.x, 427);
  assertEqual(sz.y, 0);
  assertEqual(sz.w, 1146);
  assertEqual(sz.h, 600);
  // coverage = (1146 * 600) / (2000 * 600) = 1146/2000 = 0.573
  approxEqual(sz.coverage, 0.573);
});

test('intersection of landscape + vertical crops on 1200x630 (edge case)', () => {
  // facebook 1.91 (crops a hair off top/bottom) + pinterest 0.67 (crops sides).
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], 1200, 630);
  approxEqual(sz.x, 388.95);
  approxEqual(sz.y, 0.863874345549732);
  approxEqual(sz.w, 422.1);
  approxEqual(sz.h, 628.2722513089006);
  approxEqual(sz.coverage, 0.35078534031413616);
});

test('contain platforms never shrink the safe zone', () => {
  // A contain crop is the full image; folding it in must leave the cover rect.
  const withContain = calculateSafeZone([contain(), cover(1.91)], 2000, 600);
  const coverOnly = calculateSafeZone([cover(1.91)], 2000, 600);
  assertEqual(withContain.w, coverOnly.w);
  assertEqual(withContain.h, coverOnly.h);
  assertEqual(withContain.x, coverOnly.x);
  assertEqual(withContain.y, coverOnly.y);
});

test('square + landscape intersection on a square image', () => {
  // 1200x1200: square crop is the full image, so safe zone == landscape band.
  const sz = calculateSafeZone([cover(1.91), cover(1.0)], 1200, 1200);
  approxEqual(sz.x, 0);
  approxEqual(sz.y, 285.86387434554973);
  approxEqual(sz.w, 1200);
  approxEqual(sz.h, 628.2722513089006);
  approxEqual(sz.coverage, 0.5235602094240839);
});

test('adding platforms never GROWS the safe zone (monotonic shrink)', () => {
  const one = calculateSafeZone([cover(1.91)], 2000, 600);
  const two = calculateSafeZone([cover(1.91), cover(0.67)], 2000, 600);
  assert(two.w * two.h <= one.w * one.h + 1e-6, 'safe zone grew after adding a platform');
});

test('empty crop list → full image, coverage 1', () => {
  const sz = calculateSafeZone([], 1200, 630);
  assertEqual(sz.x, 0);
  assertEqual(sz.y, 0);
  assertEqual(sz.w, 1200);
  assertEqual(sz.h, 630);
  assertEqual(sz.coverage, 1);
});

test('null/undefined crops → full image, coverage 1', () => {
  assertEqual(calculateSafeZone(null, 1200, 630).coverage, 1);
  assertEqual(calculateSafeZone(undefined, 1200, 630).coverage, 1);
});

test('accepts an object map of crops (uses values only)', () => {
  // Mirrors how callers can pass cropperState filtering without reshaping.
  const sz = calculateSafeZone({ fb: cover(1.91) }, 2000, 600);
  assertEqual(sz.w, 1146);
  assertEqual(sz.coverage, 0.573);
});

test('filters out invalid (null) crop rects from the intersection', () => {
  // Unknown cropMode yields null from calculateCropRect; it must be skipped,
  // not treated as a zero-size rect that collapses the safe zone.
  const bogus = { aspect: { min: 1, max: 1 }, cropMode: 'nope' };
  const sz = calculateSafeZone([cover(1.91), bogus], 2000, 600);
  assertEqual(sz.w, 1146);
  assertEqual(sz.h, 600);
});

test('coverage always lies in [0, 1]', () => {
  const cases = [
    [[cover(1.91)], 1200, 630],
    [[cover(1.91), cover(0.67)], 1200, 630],
    [[cover(1.91), cover(1.0)], 1200, 1200],
    [[contain(), cover(1.91), cover(0.67)], 2000, 600],
    [[], 1200, 630],
  ];
  for (const [crops, w, h] of cases) {
    const sz = calculateSafeZone(crops, w, h);
    assert(sz.coverage >= 0 && sz.coverage <= 1, `coverage out of [0,1]: ${sz.coverage}`);
  }
});

test('coverage equals (w*h)/(imgW*imgH)', () => {
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], 1200, 630);
  approxEqual(sz.coverage, (sz.w * sz.h) / (1200 * 630));
});

test('safe zone stays within image bounds for every common OG size', () => {
  const sizes = [[1200, 630], [1200, 1200], [1000, 1000], [2000, 600], [2400, 1260]];
  for (const [w, h] of sizes) {
    const sz = calculateSafeZone([cover(1.91), cover(1.0), cover(0.67)], w, h);
    assert(sz.x >= -1e-9 && sz.y >= -1e-9, `origin negative at ${w}x${h}`);
    assert(sz.x + sz.w <= w + 1e-6, `overflows right at ${w}x${h}`);
    assert(sz.y + sz.h <= h + 1e-6, `overflows bottom at ${w}x${h}`);
  }
});

// ---------------------------------------------------------------------------
// calculateVisiblePercentage (bf-3sd)
// ---------------------------------------------------------------------------
//
// The per-platform "% visible" figure shown beside each toggle. It MUST agree
// with the rectangle calculateCropRect() draws: visible fraction = crop area /
// image area. So every assertion below is cross-checked against calculateCropRect
// rather than re-deriving the arithmetic independently.

console.log('\nsafe-zone / calculateVisiblePercentage (bf-3sd)\n');

test('contain keeps the whole image → 100%', () => {
  assertEqual(calculateVisiblePercentage(contain(), 1200, 630), 100);
  assertEqual(calculateVisiblePercentage(contain(), 2000, 600), 100);
});

test('cover on a WIDER image: visible% = cropW / imgW', () => {
  // 2000x600 vs 1.91: cropW = 1146, so 1146/2000 = 0.573 → 57%.
  const pct = calculateVisiblePercentage(cover(1.91), 2000, 600);
  assertEqual(pct, 57);
});

test('cover on a TALLER image: visible% = cropH / imgH', () => {
  // 1000x1000 vs 1.91: cropH ≈ 523.56, so 523.56/1000 = 0.5236 → 52%.
  const pct = calculateVisiblePercentage(cover(1.91), 1000, 1000);
  assertEqual(pct, 52);
});

test('cover where image AR EQUALS crop AR → 100% (nothing cropped)', () => {
  assertEqual(calculateVisiblePercentage(cover(2), 1200, 600), 100);
});

test('vertical crop (pinterest 0.67) on a standard 1200x630', () => {
  // cropW = 630 * 0.67 = 422.1, visible% = 422.1/1200 = 0.35175 → 35%.
  assertEqual(calculateVisiblePercentage(cover(0.67), 1200, 630), 35);
});

test('agree EXACTLY with calculateCropRect area ratio (no drift)', () => {
  // The whole point of deriving % from the crop rect: the number beside the
  // toggle can never disagree with the rectangle drawn on screen.
  const cases = [
    [cover(1.91), 2000, 600],
    [cover(1.91), 1000, 1000],
    [cover(0.67), 1200, 630],
    [cover(1.0), 600, 1200],
    [coverMinOnly(1.5), 1200, 600],
  ];
  for (const [crop, w, h] of cases) {
    const rect = calculateCropRect(crop, w, h);
    const expected = Math.round(((rect.w * rect.h) / (w * h)) * 100);
    assertEqual(calculateVisiblePercentage(crop, w, h), expected);
  }
});

test('retina 2x image yields the same % as 1x (resolution-invariant)', () => {
  assertEqual(
    calculateVisiblePercentage(cover(0.67), 1200, 630),
    calculateVisiblePercentage(cover(0.67), 2400, 1260)
  );
});

test('result is always an integer in [0, 100]', () => {
  const cases = [
    [contain(), 1200, 630],
    [cover(1.91), 2000, 600],
    [cover(0.67), 1200, 630],
    [cover(1.0), 600, 1200],
  ];
  for (const [crop, w, h] of cases) {
    const pct = calculateVisiblePercentage(crop, w, h);
    assert(Number.isInteger(pct), `% not an integer: ${pct}`);
    assert(pct >= 0 && pct <= 100, `% out of [0,100]: ${pct}`);
  }
});

test('returns 100 for null crop or zero-dimension image (nothing to crop)', () => {
  assertEqual(calculateVisiblePercentage(null, 1200, 630), 100);
  assertEqual(calculateVisiblePercentage(cover(1.91), 0, 630), 100);
  assertEqual(calculateVisiblePercentage(cover(1.91), 1200, 0), 100);
  // Unknown cropMode → calculateCropRect returns null → 100.
  assertEqual(
    calculateVisiblePercentage({ aspect: { min: 1, max: 1 }, cropMode: 'wibble' }, 100, 100),
    100
  );
});

// ---------------------------------------------------------------------------
// Image-space == display-space invariant (acceptance criterion #2)
// ---------------------------------------------------------------------------

console.log('\nsafe-zone / image-space == display-space (bf-3n2m)\n');

test('safe-zone coords are valid in the SVG viewBox space (no transform)', () => {
  // updateCropperOverlay() sets svg viewBox = "0 0 imgW imgH" and applies
  // safeZone.x/y/w/h directly. Validity requirement: 0<=x, 0<=y, x+w<=imgW,
  // y+h<=imgH — i.e. the rect lives inside the viewBox.
  const w = 1200, h = 630;
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], w, h);
  assert(sz.x >= 0 && sz.y >= 0, 'viewBox origin negative');
  assert(sz.x + sz.w <= w, 'viewBox right overflow');
  assert(sz.y + sz.h <= h, 'viewBox bottom overflow');
});

test('safe-zone coords are valid in the export-canvas pixel space (no transform)', () => {
  // exportCropperOverlay() sets canvas.width/height = natural size and calls
  // ctx.strokeRect(safeZone.x, safeZone.y, safeZone.w, safeZone.h). Same
  // numbers, same space — confirm they are in-bounds canvas pixels.
  const w = 1200, h = 630;
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], w, h);
  assert(sz.x >= 0 && sz.y >= 0, 'canvas origin negative');
  assert(sz.x + sz.w <= w, 'canvas right overflow');
  assert(sz.y + sz.h <= h, 'canvas bottom overflow');
});

test('SVG and canvas consumers receive IDENTICAL coordinates (one coordinate system)', () => {
  // The whole point: because viewBox and canvas both use natural image pixels,
  // the on-screen overlay and the exported PNG are driven by the exact same
  // numbers — there is no image-space -> display-space transform to get wrong.
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], 1200, 630);
  const svgRect = { x: sz.x, y: sz.y, width: sz.w, height: sz.h };
  const canvasRect = { x: sz.x, y: sz.y, width: sz.w, height: sz.h };
  assertEqual(svgRect.x, canvasRect.x);
  assertEqual(svgRect.y, canvasRect.y);
  assertEqual(svgRect.width, canvasRect.width);
  assertEqual(svgRect.height, canvasRect.height);
});

// ---------------------------------------------------------------------------
// Regression: the corrected edge-vs-edge intersection (criterion #4)
// ---------------------------------------------------------------------------

console.log('\nsafe-zone / regression vs the old buggy inline loop (bf-3n2m)\n');

test('calculateSafeZone is order-independent', () => {
  // The old inline loop's result depended on iteration order; the extracted
  // function must not.
  const W = 1000, H = 1000;
  const a = calculateSafeZone([cover(1.91), cover(1.0)], W, H);
  const b = calculateSafeZone([cover(1.0), cover(1.91)], W, H);
  approxEqual(a.x, b.x);
  approxEqual(a.y, b.y);
  approxEqual(a.w, b.w);
  approxEqual(a.h, b.h);
});

test('calculateSafeZone does NOT reproduce the width-vs-edge under-report bug', () => {
  // On a 1000x1000 image, [1.91, 1.0]: the old inline loop mixed a running
  // width with an edge coordinate and produced h ≈ 285.34 (45% too small).
  // The correct intersection height is the landscape band: 523.56.
  const sz = calculateSafeZone([cover(1.91), cover(1.0)], 1000, 1000);
  approxEqual(sz.h, 523.560209424084);
  assert(sz.h > 500, `regression: height collapsed to ${sz.h} (bug would give ~285)`);
});

// ---------------------------------------------------------------------------
// Extreme OG image sizes (bf-3n2m - additional edge cases)
// ---------------------------------------------------------------------------

console.log('\nsafe-zone / extreme OG image sizes (bf-3n2m)\n');

test('ultra-wide image (3000x500, AR 6) with facebook 1.91 crop', () => {
  // Extreme wide: cropW = 500 * 1.91 = 955, centered
  const r = calculateCropRect(cover(1.91), 3000, 500);
  assertEqual(r.y, 0);
  assertEqual(r.h, 500);
  approxEqual(r.x, 1022.5);
  approxEqual(r.w, 955);
  assert(r.x >= 0 && r.x + r.w <= 3000, 'ultra-wide crop out of bounds');
});

test('ultra-tall image (500x3000, AR 0.167) with facebook 1.91 crop', () => {
  // Extreme tall: cropH = 500 / 1.91 ≈ 261.78, centered
  const r = calculateCropRect(cover(1.91), 500, 3000);
  assertEqual(r.x, 0);
  assertEqual(r.w, 500);
  approxEqual(r.y, 1369.109947643979);
  approxEqual(r.h, 261.7801047120419);
  assert(r.y >= 0 && r.y + r.h <= 3000, 'ultra-tall crop out of bounds');
});

test('minimum viable OG size (200x200) with square crop', () => {
  // Min recommended size: square image with square crop = full image
  const r = calculateCropRect(cover(1.0), 200, 200);
  assertEqual(r.x, 0);
  assertEqual(r.y, 0);
  assertEqual(r.w, 200);
  assertEqual(r.h, 200);
});

test('minimum viable OG size (200x200) with landscape 1.91 crop', () => {
  // Square min-size with landscape crop: cropH = 200 / 1.91 ≈ 104.71
  const r = calculateCropRect(cover(1.91), 200, 200);
  assertEqual(r.x, 0);
  assertEqual(r.w, 200);
  approxEqual(r.y, 47.64397905759518);
  approxEqual(r.h, 104.71204188481675);
  assert(r.y >= 0 && r.y + r.h <= 200, 'min-size crop out of bounds');
});

test('very large OG image (4000x4000) maintains safe zone integrity', () => {
  // 4K square: safe zone with multiple crops should stay in bounds
  const sz = calculateSafeZone([cover(1.91), cover(0.67), cover(1.0)], 4000, 4000);
  assert(sz.x >= 0 && sz.y >= 0, '4K safe zone origin negative');
  assert(sz.x + sz.w <= 4000, '4K safe zone overflows right');
  assert(sz.y + sz.h <= 4000, '4K safe zone overflows bottom');
  assert(sz.coverage >= 0 && sz.coverage <= 1, '4K coverage out of range');
});

test('safe zone on ultra-wide image with multiple crops', () => {
  // 3000x500 with facebook + pinterest: intersection should be valid
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], 3000, 500);
  assert(sz.x >= 0 && sz.y >= 0, 'ultra-wide safe zone origin negative');
  assert(sz.x + sz.w <= 3000, 'ultra-wide safe zone overflows right');
  assert(sz.y + sz.h <= 500, 'ultra-wide safe zone overflows bottom');
  // Coverage should be very small (strict intersection)
  assert(sz.coverage < 0.5, 'ultra-wide safe zone coverage too large');
});

test('safe zone on ultra-tall image with multiple crops', () => {
  // 500x3000 with facebook + pinterest: intersection should be valid
  const sz = calculateSafeZone([cover(1.91), cover(0.67)], 500, 3000);
  assert(sz.x >= 0 && sz.y >= 0, 'ultra-tall safe zone origin negative');
  assert(sz.x + sz.w <= 500, 'ultra-tall safe zone overflows right');
  assert(sz.y + sz.h <= 3000, 'ultra-tall safe zone overflows bottom');
  // Coverage should be very small (strict intersection)
  assert(sz.coverage < 0.5, 'ultra-tall safe zone coverage too large');
});

test('coordinate ranges: standard 1200x630 with facebook crop', () => {
  // Document expected coordinate range for standard OG size
  const sz = calculateSafeZone([cover(1.91)], 1200, 630);
  // facebook 1.91 on 1200x630: imgAR≈1.905 < 1.91 → image is TALLER than crop
  // cropH = 1200 / 1.91 ≈ 628.27, centered vertically: y≈0.864
  // Expected: y≈0.864, h≈628.27, x=0, w=1200, coverage≈0.997
  approxEqual(sz.y, 0.863874345549732);
  approxEqual(sz.h, 628.2722513089006);
  assertEqual(sz.x, 0);
  assertEqual(sz.w, 1200);
  approxEqual(sz.coverage, 0.9972575417601598);
});

test('coordinate ranges: standard 1200x630 with vertical pinterest crop', () => {
  // Document expected coordinate range for vertical crop on standard OG
  const r = calculateCropRect(cover(0.67), 1200, 630);
  // pinterest 0.67 on 1200x630: cropW = 630 * 0.67 = 422.1, centered
  approxEqual(r.x, 388.95);
  assertEqual(r.y, 0);
  approxEqual(r.w, 422.1);
  assertEqual(r.h, 630);
});

test('visible percentage on extreme sizes remains in [0,100]', () => {
  // Even on extreme sizes, percentage should be well-behaved
  const cases = [
    [cover(1.91), 3000, 500],   // ultra-wide
    [cover(1.91), 500, 3000],   // ultra-tall
    [cover(0.67), 3000, 500],   // ultra-wide with vertical crop
    [cover(0.67), 500, 3000],   // ultra-tall with vertical crop
    [cover(1.91), 200, 200],    // minimum size
    [cover(1.91), 4000, 4000],  // 4K size
  ];
  for (const [crop, w, h] of cases) {
    const pct = calculateVisiblePercentage(crop, w, h);
    assert(pct >= 0 && pct <= 100, `percentage out of range for ${w}x${h}: ${pct}`);
    assert(Number.isInteger(pct), `percentage not integer for ${w}x${h}: ${pct}`);
  }
});

test('safe zone coverage scales correctly with image size', () => {
  // Same aspect ratio, different scales: coverage should be identical
  const sz1 = calculateSafeZone([cover(1.91), cover(0.67)], 1200, 630);
  const sz2 = calculateSafeZone([cover(1.91), cover(0.67)], 2400, 1260);
  approxEqual(sz1.coverage, sz2.coverage, 'coverage should be scale-invariant');
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
