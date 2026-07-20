// @ts-check
/**
 * VISTA — End-to-end overlay-rendering verification with REAL OG images (bf-4ijd).
 *
 * The unit tests in test/unit/safe-zone.test.js (bf-3n2m) cover the PURE geometry
 * helpers (calculateCropRect / calculateSafeZone) against synthetic numbers — no
 * DOM, no canvas, no pixels. This file covers what they intentionally do NOT:
 * the actual RENDERING pipeline in app.js, driven against real rasterized OG
 * image files in a real browser:
 *
 *   updateCropperOverlay()   → the on-screen SVG overlay
 *     (svg viewBox = "0 0 imgW imgH"; platform crop <rect>s at fill-opacity 0.15;
 *      safe-zone <rect class="safe-zone-rect"> as a white dashed stroke)
 *   exportCropperOverlay()   → the downloaded PNG (canvas 2D)
 *     (ctx.fillRect with hex+'40' ≈ 25% alpha fills; ctx.strokeRect safe zone)
 *
 * Both paths reuse the unit-tested safe-zone.js geometry, so this verifies that
 * the geometry is correctly APPLIED to produce attributes / pixels — i.e. the
 * overlay appears at the expected position, its on-screen <rect> dimensions
 * match calculateSafeZone(), and the semi-transparency actually renders.
 *
 * Strategy:
 *   1. sharp generates visually-verifiable OG fixtures (gradient + 100/500px
 *      grid + center crosshair + quarter dots) at representative dims:
 *      1200×630, 1200×1200, 1000×1000, 2000×600, 2400×1260 (retina), 1000×1500.
 *   2. A tiny same-origin express server serves src/public (real app.js +
 *      safe-zone.js + style.css) at /app and the fixtures at /fixtures, plus a
 *      minimal harness page at / that contains only the cropper DOM. Same origin
 *      ⇒ the export canvas is NOT tainted ⇒ toBlob works.
 *   3. Playwright loads the harness, and for each scenario sets cropperImage.src
 *      to a real fixture, populates cropperState, sets enabledPlatforms, and calls
 *      the REAL window.updateCropperOverlay(). It then reads back the SVG
 *      safe-zone <rect> attributes and compares them to the expected values from
 *      a Node-side calculateSafeZone() (an independent instance from the
 *      browser's, fed the real PLATFORM_CROPS specs read out of the page) — and
 *      screenshots the overlay on top of the real image for manual inspecting.
 *   4. It triggers the REAL window.exportCropperOverlay(), captures the download,
 *      and samples exported-PNG pixels (self-calibrated against the base fixture)
 *      to confirm the fill alpha is ≈25% inside a crop rect and ≈0 outside it.
 *
 * Artifacts (for manual review) are written to test-results/overlay-rendering/.
 *
 * Usage:   node test/e2e/overlay-rendering.e2e.js
 */

const { chromium } = require('playwright');
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Independent instance of the geometry, required under Node. Fed the real
// PLATFORM_CROPS crop-specs read out of the browser page, so the EXPECTED safe
// zone is computed by a separate module instance from the one app.js uses — a
// real cross-check, not the browser comparing to itself.
const { calculateSafeZone } = require('../../src/public/safe-zone');

// ─── Headless-Chromium shared-library resolver (NixOS) ───────────────────────
// Lifted from test/e2e/client-side-tags.e2e.js: chromium's .so deps live under
// /nix/store and must be on LD_LIBRARY_PATH. Re-resolved each run so nix hash
// changes can't silently break us.
function resolveChromiumLibs() {
  const legacy = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
  if (fs.existsSync(path.join(legacy, 'libglib-2.0.so.0'))) {
    process.env.LD_LIBRARY_PATH =
      legacy + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
    return;
  }
  let binary;
  try { binary = chromium.executablePath(); } catch (_) { return; }
  if (!binary || !fs.existsSync(binary)) return;
  const ldd = spawnSync('ldd', [binary], { encoding: 'utf8' });
  if (ldd.status !== 0 || !ldd.stdout) return;
  const dirs = new Set();
  for (const line of ldd.stdout.split('\n')) {
    if (!line.includes('not found')) continue;
    const name = line.split('=>')[0].trim();
    if (!name) continue;
    const found = spawnSync('find', ['/nix/store', '-maxdepth', '4', '-name', name],
      { encoding: 'utf8', timeout: 20000 });
    const first = (found.stdout || '').split('\n').find(p => p);
    if (first) dirs.add(path.dirname(first));
  }
  if (dirs.size > 0) {
    process.env.LD_LIBRARY_PATH =
      Array.from(dirs).join(':') +
      (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
  }
}
resolveChromiumLibs();

const PORT = Number(process.env.OVERLAY_E2E_PORT) || 14530;
const OUT_DIR = path.join(__dirname, '..', '..', 'test-results', 'overlay-rendering');
const FIXTURE_DIR = path.join(OUT_DIR, 'fixtures');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');
const EXPORT_DIR = path.join(OUT_DIR, 'exports');
fs.mkdirSync(FIXTURE_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(EXPORT_DIR, { recursive: true });

// ─── Fixture generation (sharp: SVG → PNG) ───────────────────────────────────
// Each fixture is visually verifiable: a hue gradient, a 100px minor / 500px
// major grid, a center crosshair, and quarter dots — so when the overlay <rect>
// is drawn on top, its edges can be read off against known pixel coordinates.
function fixtureSVG(w, h, hue) {
  const minors = [];
  for (let x = 100; x < w; x += 100) minors.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" />`);
  for (let y = 100; y < h; y += 100) minors.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" />`);
  const majors = [];
  for (let x = 500; x < w; x += 500) majors.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" />`);
  for (let y = 500; y < h; y += 500) majors.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" />`);
  const cx = w / 2, cy = h / 2;
  const ar = (w / h).toFixed(3);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},65%,58%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360},70%,28%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g stroke="rgba(255,255,255,0.16)" stroke-width="1">${minors.join('')}</g>
  <g stroke="rgba(255,255,255,0.42)" stroke-width="2">${majors.join('')}</g>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#ffffff" stroke-width="3"/>
  <line x1="${cx - 40}" y1="${cy}" x2="${cx + 40}" y2="${cy}" stroke="#ffffff" stroke-width="4"/>
  <line x1="${cx}" y1="${cy - 40}" x2="${cx}" y2="${cy + 40}" stroke="#ffffff" stroke-width="4"/>
  <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#ffffff" stroke-width="4"/>
  <circle cx="${w / 4}" cy="${h / 4}" r="7" fill="rgba(255,255,255,0.85)"/>
  <circle cx="${3 * w / 4}" cy="${h / 4}" r="7" fill="rgba(255,255,255,0.85)"/>
  <circle cx="${w / 4}" cy="${3 * h / 4}" r="7" fill="rgba(255,255,255,0.85)"/>
  <circle cx="${3 * w / 4}" cy="${3 * h / 4}" r="7" fill="rgba(255,255,255,0.85)"/>
  <text x="18" y="46" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold">${w}×${h}</text>
  <text x="18" y="78" fill="#ffffff" font-family="sans-serif" font-size="20">AR ${ar}</text>
</svg>`;
}

async function ensureFixture(w, h, hue) {
  const file = path.join(FIXTURE_DIR, `og-${w}x${h}.png`);
  if (!fs.existsSync(file)) {
    await sharp(Buffer.from(fixtureSVG(w, h, hue))).png().toFile(file);
  }
  return file;
}

// ─── Minimal harness page ────────────────────────────────────────────────────
// Contains only the DOM the cropper functions touch (cropperViewport/Image/
// Overlay/Controls/Container, downloadOverlayBtn, safeZoneInfo, imageInfo,
// cropperBadge) plus an empty #previewGrid so app.js's top-level
// initMobileLongPress() doesn't throw before we get control. Loads the REAL
// safe-zone.js + app.js + style.css from /app (served from src/public).
const HARNESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="/app/style.css"/>
</head><body>
  <div id="cropperViewport" class="cropper-viewport" style="width:900px;height:520px;">
    <img id="cropperImage" class="cropper-image" alt=""/>
    <svg id="cropperOverlay" class="cropper-overlay" xmlns="http://www.w3.org/2000/svg"></svg>
  </div>
  <div id="cropperControls"></div>
  <div id="cropperContainer"></div>
  <div id="imageInfo"></div>
  <div id="safeZoneInfo"></div>
  <div id="cropperBadge"></div>
  <button id="downloadOverlayBtn"></button>
  <div id="previewGrid"></div>
  <script src="/app/safe-zone.js"></script>
  <script>
    // Null-safe DOM stub — MUST run before app.js.
    //
    // app.js captures ~94 element refs at TOP LEVEL via 'const x = $(sel)'
    // (where '$ = (sel) => document.querySelector(sel)') and then, still at
    // top level, immediately calls methods on them — e.g. line ~208:
    //   urlForm.addEventListener('submit', ...)
    // This harness only contains the cropper elements, so every other $()
    // resolves to null and app.js throws "Cannot read properties of null
    // (reading 'addEventListener')" at line ~208 — BEFORE PLATFORM_CROPS
    // (line 1299), CATEGORY_COLORS (1345) and cropperState (1417) are even
    // declared. That halts app.js mid-script, so the __VISTA bridge below
    // throws a ReferenceError on PLATFORM_CROPS and window.__VISTA is never
    // set.
    //
    // Fix: stub document.querySelector / getElementById to return a null-safe
    // proxy for any selector THIS harness doesn't provide, while passing real
    // elements (the cropper <img>/<svg>/etc.) straight through. app.js then
    // runs to completion, the tables/functions get defined, and the bridge
    // works. The DOMContentLoaded init handlers may still throw deep inside
    // (tolerated as pageErrors) — they are independent of the cropper
    // functions, which read only top-level consts + cropperState.
    (function () {
      const SCALARS = new Set(['value','textContent','innerHTML','outerHTML','href',
        'src','className','id','type','name','placeholder','min','max','step',
        'pattern','title','for','role','lang','dir','selectedIndex']);
      const BOOLS = new Set(['checked','disabled','hidden','readOnly','selected',
        'required','multiple','autofocus','open','defaultChecked']);
      const NUMS = new Set(['width','height','scrollWidth','scrollHeight',
        'offsetWidth','offsetHeight','clientWidth','clientHeight']);
      function makeStub() {
        const handler = {
          get(_t, prop) {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === Symbol.iterator) return function* () {};
            if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
            if (prop === 'length') return 0;
            if (prop === 'nodeType') return 1;
            if (SCALARS.has(prop)) return '';
            if (BOOLS.has(prop)) return false;
            if (NUMS.has(prop)) return 0;
            if (prop === 'classList') return { add(){},remove(){},toggle(){return false;},contains(){return false;} };
            return STUB; // style, dataset, addEventListener, appendChild, … → chainable + callable
          },
          set() { return true; },
          has() { return true; },
          apply() { return STUB; },
        };
        const STUB = new Proxy(function () {}, handler);
        return STUB;
      }
      const STUB = makeStub();
      const _qs = document.querySelector.bind(document);
      const _gid = document.getElementById.bind(document);
      document.querySelector = function (sel) { return _qs(sel) || STUB; };
      document.getElementById = function (id) { return _gid(id) || STUB; };
    })();
  </script>
  <script src="/app/app.js"></script>
  <script>
    // Bridge for the e2e harness ONLY. app.js declares PLATFORM_CROPS,
    // CATEGORY_COLORS and cropperState as top-level const/let — i.e. lexical
    // globals. Playwright's page.evaluate runs its callback through an
    // INDIRECT eval that can only resolve window.* properties, NOT lexical
    // globals, so referencing PLATFORM_CROPS there throws ReferenceError.
    // A sibling classic <script> DOES share app.js's global lexical scope,
    // so copy the live references onto window here. cropperState is an
    // object reference, so mutating window.__VISTA.cropperState.* reaches
    // the exact state app.js's updateCropperOverlay/exportCropperOverlay
    // read — no production change to app.js required.
    window.__VISTA = { PLATFORM_CROPS, CATEGORY_COLORS, cropperState };
  </script>
</body></html>`;

// ─── Test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}
const approx = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;

// Representative platform sets. 'ALL' is resolved against the real PLATFORM_CROPS
// keys read out of the page after load.
const SCENARIOS = [
  { name: '1200x630 facebook+pinterest (cross intersection)', w: 1200, h: 630, hue: 205,
    pids: ['facebook', 'pinterest'], shot: 'cross-1200x630' },
  { name: '1200x630 facebook only (near-full)', w: 1200, h: 630, hue: 210,
    pids: ['facebook'], shot: 'fb-only-1200x630' },
  { name: '1200x1200 facebook+pinterest (square cross)', w: 1200, h: 1200, hue: 280,
    pids: ['facebook', 'pinterest'], shot: 'square-1200x1200' },
  { name: '2000x600 facebook (sides cropped)', w: 2000, h: 600, hue: 25,
    pids: ['facebook'], shot: 'wide-2000x600' },
  { name: '1000x1500 pinterest (portrait near-native)', w: 1000, h: 1500, hue: 320,
    pids: ['pinterest'], shot: 'portrait-1000x1500' },
  { name: '2400x1260 facebook+pinterest (retina 2x)', w: 2400, h: 1260, hue: 145,
    pids: ['facebook', 'pinterest'], shot: 'retina-2400x1260' },
  { name: '1200x630 ALL platforms (tight intersection)', w: 1200, h: 630, hue: 50,
    pids: 'ALL', shot: 'all-1200x630' },
];

async function main() {
  console.log('\noverlay-rendering e2e (bf-4ijd) — real OG images in real Chromium\n');

  // 1) Generate fixtures up front (ALL case uses the 1200x630 fixture too).
  for (const s of SCENARIOS) await ensureFixture(s.w, s.h, s.hue);

  // 2) Same-origin server: /app → src/public, /fixtures → fixture dir, / → harness.
  const PUBLIC_DIR = path.join(__dirname, '..', '..', 'src', 'public');
  const app = express();
  app.use('/app', express.static(PUBLIC_DIR));
  app.use('/fixtures', express.static(FIXTURE_DIR));
  app.get('/', (_req, res) => res.type('html').send(HARNESS_HTML));
  const server = app.listen(PORT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1100, height: 700 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });

  // Sanity: the real rendering functions + tables actually loaded.
  const boot = await page.evaluate(() => {
    const { PLATFORM_CROPS, CATEGORY_COLORS } = window.__VISTA;
    return {
      hasUpdate: typeof updateCropperOverlay === 'function',
      hasExport: typeof exportCropperOverlay === 'function',
      hasGeometry: typeof calculateSafeZone === 'function',
      allPids: Object.keys(PLATFORM_CROPS),
      socialColor: CATEGORY_COLORS.social,
      platformCount: Object.keys(PLATFORM_CROPS).length,
    };
  });
  check('real app.js loaded: updateCropperOverlay defined', boot.hasUpdate);
  check('real app.js loaded: exportCropperOverlay defined', boot.hasExport);
  check('real safe-zone.js loaded: calculateSafeZone defined', boot.hasGeometry);
  check(`real PLATFORM_CROPS loaded (${boot.platformCount} platforms)`, boot.platformCount > 10);
  check('CATEGORY_COLORS.social is blue #3b82f6 (facebook)', boot.socialColor === '#3b82f6');

  // 3) Per-scenario: drive the REAL on-screen overlay and verify.
  console.log('\nSVG on-screen overlay (updateCropperOverlay) — position & dimensions:');
  for (const s of SCENARIOS) {
    const pids = s.pids === 'ALL' ? boot.allPids : s.pids;
    const result = await page.evaluate(async ({ url, pids }) => {
      // Mirrors initCropper's onload: load the real image, read natural size,
      // populate cropperState, choose platforms, then call the real overlay fn.
      const { PLATFORM_CROPS, cropperState } = window.__VISTA;
      await new Promise((resolve) => {
        const img = document.getElementById('cropperImage');
        // Always assign src — each scenario uses a DIFFERENT fixture, so the
        // image must actually (re)load. A previous `if (img.complete && ...)`
        // short-circuit returned WITHOUT assigning src, so every scenario
        // after the first kept the 1200×630 image (natural size never updated).
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
        if (img.complete) resolve(); // sync cache hit: load may not fire again
      });
      const img = document.getElementById('cropperImage');
      cropperState.imageNaturalWidth = img.naturalWidth;
      cropperState.imageNaturalHeight = img.naturalHeight;
      cropperState.imageAspectRatio = img.naturalWidth / img.naturalHeight;
      cropperState.enabledPlatforms = new Set(pids);
      updateCropperOverlay();

      const svg = document.getElementById('cropperOverlay');
      const safe = svg.querySelector('.safe-zone-rect');
      const allRects = Array.from(svg.querySelectorAll('rect'));
      const cropRects = allRects.filter(r => !r.classList.contains('safe-zone-rect'));
      const info = document.getElementById('safeZoneInfo').textContent.replace(/\s+/g, ' ').trim();
      return {
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        viewBox: svg.getAttribute('viewBox'),
        rectCount: allRects.length,
        cropRectCount: cropRects.length,
        hasSafeRect: !!safe,
        safe: safe && {
          x: parseFloat(safe.getAttribute('x')),
          y: parseFloat(safe.getAttribute('y')),
          w: parseFloat(safe.getAttribute('width')),
          h: parseFloat(safe.getAttribute('height')),
          fill: safe.getAttribute('fill'),
          stroke: safe.getAttribute('stroke'),
          strokeWidth: safe.getAttribute('stroke-width'),
          dash: safe.getAttribute('stroke-dasharray'),
        },
        // A representative platform crop rect — confirm semi-transparent fill.
        sampleCrop: cropRects[0] && {
          fillOpacity: cropRects[0].getAttribute('fill-opacity'),
          stroke: cropRects[0].getAttribute('stroke'),
          dash: cropRects[0].getAttribute('stroke-dasharray'),
        },
        // The real crop-spec objects for the enabled platforms, so Node can
        // recompute the EXPECTED safe zone through its own module instance.
        cropSpecs: pids.map(p => PLATFORM_CROPS[p]).filter(Boolean),
        info,
      };
    }, { url: `http://localhost:${PORT}/fixtures/og-${s.w}x${s.h}.png`, pids });

    const exp = calculateSafeZone(result.cropSpecs, s.w, s.h);

    check(`${s.name}: image loaded at natural size`,
      result.naturalW === s.w && result.naturalH === s.h,
      `got ${result.naturalW}×${result.naturalH}`);
    check(`${s.name}: SVG viewBox set to image space (no transform)`,
      result.viewBox === `0 0 ${s.w} ${s.h}`, `viewBox="${result.viewBox}"`);
    check(`${s.name}: drew ${pids.length} platform crop rect(s) + safe zone`,
      result.cropRectCount === pids.length && result.hasSafeRect,
      `${result.cropRectCount} crop, safe=${result.hasSafeRect}`);
    check(`${s.name}: safe-zone POSITION matches calculateSafeZone() (Node)`,
      approx(result.safe.x, exp.x) && approx(result.safe.y, exp.y),
      `svg=(${result.safe.x.toFixed(1)},${result.safe.y.toFixed(1)}) expected=(${exp.x.toFixed(1)},${exp.y.toFixed(1)})`);
    check(`${s.name}: safe-zone DIMENSIONS match calculateSafeZone() (Node)`,
      approx(result.safe.w, exp.w) && approx(result.safe.h, exp.h),
      `svg=${result.safe.w.toFixed(1)}×${result.safe.h.toFixed(1)} expected=${exp.w.toFixed(1)}×${exp.h.toFixed(1)}`);
    check(`${s.name}: safe zone is white dashed stroke (fill none)`,
      result.safe.fill === 'none' && result.safe.stroke === '#ffffff' && !!result.safe.dash,
      `fill=${result.safe.fill} stroke=${result.safe.stroke} dash=${result.safe.dash}`);
    check(`${s.name}: platform crop rect is semi-transparent (fill-opacity 0.15)`,
      result.sampleCrop && result.sampleCrop.fillOpacity === '0.15',
      `fill-opacity=${result.sampleCrop && result.sampleCrop.fillOpacity}`);
    check(`${s.name}: info panel reports safe-zone px & coverage`,
      /Safe Zone/.test(result.info) && /Coverage/.test(result.info),
      `"${result.info.slice(0, 70)}"`);

    if (s.shot) {
      await page.locator('#cropperViewport').screenshot({ path: path.join(SHOT_DIR, `${s.shot}.png`) });
    }
  }

  // 4) Canvas export path (exportCropperOverlay) — capture the download and
  //    measure the rendered transparency against the base fixture pixels.
  console.log('\nCanvas export (exportCropperOverlay) — transparency & dimensions:');

  // Wide image + facebook only: left strip (x<427) is OUTSIDE the crop → no
  // overlay; center is INSIDE → blue fill at ≈25% alpha (hex+'40').
  const W = 2000, H = 600;
  await ensureFixture(W, H, 25);
  const exportPath = path.join(EXPORT_DIR, `overlay-${W}x${H}-facebook.png`);

  await page.evaluate(async ({ url, pids }) => {
    const { cropperState } = window.__VISTA;
    await new Promise((resolve) => {
      const img = document.getElementById('cropperImage');
      // Always assign src — this export scenario uses a DIFFERENT fixture
      // (2000×600) than the SVG scenarios that ran just before (last was
      // 1200×630). A short-circuit `if (img.complete && img.naturalWidth)`
      // here returned WITHOUT assigning src, so cropperState stayed at the
      // prior 1200×630 image — the exported PNG was 1200×630 (not 2000×600)
      // and the alpha check misaligned the 2000-wide base fixture against a
      // 1200-wide export. Same fix as the SVG-scenario block above.
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
      if (img.complete) resolve(); // sync cache hit: load may not fire again
    });
    const img = document.getElementById('cropperImage');
    cropperState.imageNaturalWidth = img.naturalWidth;
    cropperState.imageNaturalHeight = img.naturalHeight;
    cropperState.imageAspectRatio = img.naturalWidth / img.naturalHeight;
    cropperState.enabledPlatforms = new Set(pids);
  }, { url: `http://localhost:${PORT}/fixtures/og-${W}x${H}.png`, pids: ['facebook'] });

  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => exportCropperOverlay());
  const download = await downloadPromise;
  await download.saveAs(exportPath);

  const exportedMeta = await sharp(exportPath).metadata();
  check('exported PNG is at natural image resolution (no scaling)',
    exportedMeta.width === W && exportedMeta.height === H,
    `${exportedMeta.width}×${exportedMeta.height}`);

  // Self-calibrated alpha measurement: read base fixture + exported at the same
  // points, derive the overlay's contribution. For a source-over composite:
  //   out = base*(1-a) + overlay*a   ⇒   a = (out-base)/(overlay-base)
  const baseFile = path.join(FIXTURE_DIR, `og-${W}x${H}.png`);
  const baseRaw = await sharp(baseFile).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const expRaw = await sharp(exportPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // facebook is 'social' → #3b82f6 → R=59 G=130 B=246. Fill alpha suffix '40' = 0x40/0xff.
  const ov = { r: 0x3b, g: 0x82, b: 0xf6 };
  const alphaHex40 = 0x40 / 0xff;
  const px = (buf, info, x, y, c) => buf[(y * info.width + x) * info.channels + c];

  // facebook cover on 2000×600: imgAR 3.33 > 1.91 → cropW=600*1.91=1146, x=(2000-1146)/2=427.
  // So x=1000 (center) is INSIDE; x=50 is OUTSIDE (left strip).
  const inside = { x: 1000, y: 300 };
  const outside = { x: 50, y: 300 };
  const blendAlpha = (p) => {
    // Average the per-channel implied alpha for R,G,B (overlay differs from
    // base in all three); robust against the gradient varying point-to-point.
    const alphas = [];
    for (const c of ['r', 'g', 'b']) {
      const ci = c === 'r' ? 0 : c === 'g' ? 1 : 2;
      const base = px(baseRaw.data, baseRaw.info, p.x, p.y, ci);
      const out = px(expRaw.data, expRaw.info, p.x, p.y, ci);
      const d = ov[c] - base;
      if (Math.abs(d) > 3) alphas.push((out - base) / d);
    }
    return alphas.length ? alphas.reduce((a, b) => a + b, 0) / alphas.length : null;
  };
  const aIn = blendAlpha(inside);
  const aOut = blendAlpha(outside);
  check(`inside crop rect: overlay renders at ≈25% alpha (hex+'40')`,
    aIn != null && Math.abs(aIn - alphaHex40) < 0.06,
    `observed α=${aIn && aIn.toFixed(3)} (expected ~${alphaHex40.toFixed(3)})`);
  check(`outside any crop rect: no overlay rendered (α ≈ 0)`,
    aOut != null && Math.abs(aOut) < 0.05,
    `observed α=${aOut && aOut.toFixed(3)}`);

  // Retina linear-scaling check (1× vs 2× fractions identical).
  const cropsFbPn = await page.evaluate(() => {
    const { PLATFORM_CROPS } = window.__VISTA;
    return [PLATFORM_CROPS.facebook, PLATFORM_CROPS.pinterest];
  });
  const one = calculateSafeZone(cropsFbPn, 1200, 630);
  const two = calculateSafeZone(cropsFbPn, 2400, 1260);
  check('retina 2× safe-zone fractions match 1× (linear scaling)',
    approx(two.x / one.x, 2) && approx(two.y / one.y, 2) &&
    approx(two.w / one.w, 2) && approx(two.h / one.h, 2),
    `1×=(${one.x.toFixed(0)},${one.y.toFixed(0)},${one.w.toFixed(0)},${one.h.toFixed(0)}) 2×=(${two.x.toFixed(0)},${two.y.toFixed(0)},${two.w.toFixed(0)},${two.h.toFixed(0)})`);

  // Transparency observation: on-screen SVG uses fill-opacity 0.15; canvas
  // export uses hex+'40' (≈0.25). They differ — recorded as a finding, not a
  // failure (the two views intentionally render at different opacities).
  console.log('\n  note: on-screen SVG fill-opacity=0.15 vs canvas export α≈0.25 (hex+\'40\') — the two views render crop fills at different opacities (see notes/bf-4ijd.md).');

  if (pageErrors.length) {
    console.log(`\n  (harness page reported ${pageErrors.length} console/page errors — ` +
      `expected, since app.js init runs against a partial DOM; the cropper functions load regardless.)`);
  }

  await browser.close();
  await new Promise(r => server.close(r));

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`artifacts: ${OUT_DIR}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('\nFATAL:', err && err.stack ? err.stack : err);
  process.exit(1);
});
