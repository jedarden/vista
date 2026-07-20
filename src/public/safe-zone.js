'use strict';

// =============================================================================
// VISTA OG-Image Safe-Zone Geometry
//
// Pure, dependency-free geometry for the cropper overlay. Given an OG image's
// natural pixel dimensions and a set of platform crop specs (PLATFORM_CROPS),
// compute:
//   - calculateCropRect():  the source-image rectangle a single platform keeps
//   - calculateSafeZone():  the intersection of many platforms' crop rectangles
//                           (the region guaranteed visible across ALL of them)
//
// Mirrors the dual-export convention used by scoring-simulator.js and
// client-side-diff.js: top-level functions are globals in the browser (loaded
// via <script> before app.js), and module.exports under Node for unit tests.
//
// All coordinates are in IMAGE space — i.e. pixels of the source OG image at
// its natural resolution. The SVG overlay (viewBox = "0 0 imgW imgH") and the
// export canvas (canvas.width/height = natural size) use the same space, so no
// image-space → display-space transform is needed: the same numbers drive the
// on-screen overlay and the exported PNG.
// =============================================================================

/**
 * Compute the source-image rectangle a single platform keeps after cropping.
 *
 * crop spec shape (from PLATFORM_CROPS):
 *   { aspect: { min, max }, cropMode: 'contain' | 'cover' }
 *
 * - 'contain' → the entire image is shown letterboxed; the crop rect is the
 *   full image, so nothing is cropped away.
 * - 'cover'   → the image fills the platform's aspect ratio and overflows are
 *   cropped. The kept rectangle is centered on the image.
 *
 * Returns { x, y, w, h } in source-image pixels, or null for an unknown
 * cropMode. x/y are the top-left of the kept region; x+w / y+h are its
 * right/bottom edges (always within [0,imgW] × [0,imgH] for valid inputs).
 */
function calculateCropRect(crop, imgW, imgH) {
  if (!crop || !imgW || !imgH) return null;

  const imgAR = imgW / imgH;
  const cropAR = crop.aspect.max || crop.aspect.min;

  if (crop.cropMode === 'contain') {
    // Full image is visible — nothing cropped.
    return { x: 0, y: 0, w: imgW, h: imgH };
  }

  if (crop.cropMode === 'cover') {
    let cropW, cropH;

    if (imgAR > cropAR) {
      // Image is wider than the crop — crop the sides, keep full height.
      cropW = imgH * cropAR;
      cropH = imgH;
    } else {
      // Image is taller (or equal) — crop top/bottom, keep full width.
      cropW = imgW;
      cropH = imgW / cropAR;
    }

    // Center the crop on the image.
    const x = (imgW - cropW) / 2;
    const y = (imgH - cropH) / 2;

    return { x, y, w: cropW, h: cropH };
  }

  return null;
}

/**
 * Compute the safe zone: the intersection of every platform's crop rectangle.
 * This is the region of the source image guaranteed to remain visible across
 * ALL of the given platforms — content placed inside it is never cropped by
 * any of them.
 *
 * `crops` may be either:
 *   - an array of crop specs (PLATFORM_CROPS entries), or
 *   - a map/object { pid -> cropSpec } (only the values are used).
 * Passing a map lets callers reuse cropperState.enabledPlatforms filtering
 * without reshaping data.
 *
 * Returns { x, y, w, h, coverage } where coverage is the fraction of the
 * source image covered by the safe zone (0–1). If the intersection is empty
 * (platforms have no common region) w and h are <= 0 and coverage is 0.
 *
 * Implementation note: a correct rectangle intersection must compare right /
 * bottom EDGES (x+w, y+h), never widths against edges. The previous inline
 * implementation did `Math.min(width, x+w) - x`, which mixes a width with a
 * coordinate and under-reports the safe zone whenever the accumulated left
 * offset is non-zero (i.e. any time ≥2 non-aligned cover crops overlap).
 */
function calculateSafeZone(crops, imgW, imgH) {
  const base = { x: 0, y: 0, w: imgW, h: imgH };

  // Normalize input: accept either an array of specs or an object of specs.
  // Keep only valid (non-null) crop rectangles.
  const list = Array.isArray(crops)
    ? crops
    : Object.values(crops || {});
  const rects = list
    .map(c => calculateCropRect(c, imgW, imgH))
    .filter(Boolean);

  if (rects.length === 0) {
    return { x: 0, y: 0, w: imgW, h: imgH, coverage: 1 };
  }

  // Fold each rect into the running intersection via edge math.
  let x0 = base.x;
  let y0 = base.y;
  let x1 = base.x + base.w;
  let y1 = base.y + base.h;

  for (const r of rects) {
    x0 = Math.max(x0, r.x);
    y0 = Math.max(y0, r.y);
    x1 = Math.min(x1, r.x + r.w);
    y1 = Math.min(y1, r.y + r.h);
  }

  const w = x1 - x0;
  const h = y1 - y0;
  const area = imgW && imgH ? imgW * imgH : 0;
  const coverage = area > 0 ? Math.max(0, (w * h) / area) : 0;

  return { x: x0, y: y0, w, h, coverage };
}

// Export for use in app.js (browser globals) + Node unit tests.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateCropRect, calculateSafeZone };
}
