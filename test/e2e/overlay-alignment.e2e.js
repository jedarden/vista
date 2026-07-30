// @ts-check
/**
 * VISTA — On-screen overlay ALIGNMENT with the rendered <img> (bf-4dd3).
 *
 * The sibling suite overlay-rendering.e2e.js (bf-4ijd) verifies the overlay in
 * IMAGE space: it reads the SVG <rect> *attributes* and compares them to a
 * Node-side calculateSafeZone(). That passes even when the overlay is drawn in
 * the wrong place on screen, because the attributes are correct regardless of
 * where the SVG's box lands. This file covers what that suite does NOT: that the
 * rendered overlay actually sits on top of the rendered <img> in SCREEN space.
 *
 * Bug this guards (the one bf-4dd3 fixes):
 *   .cropper-overlay was position:absolute filling the WHOLE viewport, while
 *   .cropper-image was capped at max-height:600px (object-fit:contain). Two
 *   different "meet" fit boxes for the same viewBox → for square/portrait images
 *   the SVG's effective image-area was larger and offset from the real <img>,
 *   so the crop rects / safe zone floated off the image (up to ~98px on a
 *   1200×1200 image in a 900×520 viewport). Fix: a .cropper-stage wrapper that
 *   shrink-wraps the <img>, so the SVG fills the image's box, not the viewport.
 *
 * Strategy:
 *   - sharp fixtures at landscape / square / portrait / wide / retina dims.
 *   - A same-origin express server serves src/public (real style.css +
 *     safe-zone.js + app.js) at /app and fixtures at /fixtures, plus a harness
 *     page that contains the PRODUCTION cropper DOM (cropper-viewport >
 *     cropper-stage > cropperImage + cropperOverlay) — same structure as
 *     index.html, so the real .cropper-stage CSS is exercised.
 *   - For each scenario: load the real fixture, populate cropperState, call the
 *     REAL window.updateCropperOverlay(), then compare in SCREEN coordinates:
 *       1. the SVG element's bounding box == the <img>'s bounding box
 *          (the wrapper makes the overlay fill exactly the image), and
 *       2. the rendered safe-zone <rect> (getBoundingClientRect on the SVG
 *          <rect>, which accounts for the viewBox→screen transform) lands at
 *          imgRect.left + safe.x*S, … where S = imgRect.width / imgW — i.e.
 *          the overlay aligns with the actual crop area on the real image.
 *
 * Usage:   node test/e2e/overlay-alignment.e2e.js
 */

const { chromium } = require('playwright');
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Independent Node instance of the geometry, fed the real PLATFORM_CROPS read
// out of the page, so EXPECTED screen positions are derived independently from
// the browser's own calculateSafeZone().
const { calculateSafeZone } = require('../../src/public/safe-zone');

// ─── Headless-Chromium shared-library resolver (NixOS) ───────────────────────
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

const PORT = Number(process.env.OVERLAY_ALIGN_PORT) || 14531;
const OUT_DIR = path.join(__dirname, '..', '..', 'test-results', 'overlay-alignment');
const FIXTURE_DIR = path.join(OUT_DIR, 'fixtures');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');
fs.mkdirSync(FIXTURE_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });

// ─── Fixture generation (sharp: SVG → PNG) ───────────────────────────────────
// Same visually-verifiable fixture as overlay-rendering.e2e.js: hue gradient +
// 100/500px grid + center crosshair + quarter dots, so a misaligned overlay is
// visible in the screenshot artifacts.
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

// ─── Harness page ────────────────────────────────────────────────────────────
// Mirrors the PRODUCTION cropper DOM from index.html: cropper-viewport >
// cropper-stage > cropperImage + cropperOverlay. Loads the REAL style.css +
// safe-zone.js + app.js from /app so .cropper-stage's CSS is the one shipped.
// Uses the same null-safe DOM stub trick as overlay-rendering.e2e.js so the
// real app.js loads against this minimal DOM without throwing at top level.
const HARNESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="/app/style.css"/>
</head><body>
  <div class="cropper-viewport" id="cropperViewport" style="width:900px;height:520px;">
    <div class="cropper-stage">
      <img id="cropperImage" class="cropper-image" alt=""/>
      <svg id="cropperOverlay" class="cropper-overlay" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
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
    // Null-safe DOM stub — MUST run before app.js (see overlay-rendering.e2e.js
    // for the full rationale). app.js captures ~94 element refs at top level;
    // this harness only provides the cropper elements, so everything else is
    // stubbed to let app.js run to completion and define PLATFORM_CROPS etc.
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
            return STUB;
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
    // Bridge: copy app.js's lexical globals onto window so Playwright's indirect
    // page.evaluate can reach them. cropperState is a live object reference.
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
const approx = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

// Scenarios chosen to exercise every fit-box binding case: landscape (width
// binds for the viewport, height binds for the image cap), square, portrait
// (height binds hard), ultra-wide, and retina 2×.
const SCENARIOS = [
  { name: '1200x630 landscape',   w: 1200, h: 630,  hue: 205, pids: ['facebook', 'pinterest'], shot: 'landscape-1200x630' },
  { name: '1200x1200 square',     w: 1200, h: 1200, hue: 280, pids: ['facebook', 'pinterest'], shot: 'square-1200x1200' },
  { name: '1000x1500 portrait',   w: 1000, h: 1500, hue: 320, pids: ['facebook', 'pinterest'], shot: 'portrait-1000x1500' },
  { name: '2000x600 ultra-wide',  w: 2000, h: 600,  hue: 25,  pids: ['facebook'],               shot: 'wide-2000x600' },
  { name: '2400x1260 retina 2x',  w: 2400, h: 1260, hue: 145, pids: ['facebook', 'pinterest'], shot: 'retina-2400x1260' },
];

async function main() {
  console.log('\noverlay-alignment e2e (bf-4dd3) — rendered overlay vs rendered <img> in screen space\n');
  for (const s of SCENARIOS) await ensureFixture(s.w, s.h, s.hue);

  const PUBLIC_DIR = path.join(__dirname, '..', '..', 'src', 'public');
  const app = express();
  app.use('/app', express.static(PUBLIC_DIR));
  app.use('/fixtures', express.static(FIXTURE_DIR));
  app.get('/', (_req, res) => res.type('html').send(HARNESS_HTML));
  const server = app.listen(PORT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 700 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });

  const boot = await page.evaluate(() => {
    return { hasUpdate: typeof updateCropperOverlay === 'function' };
  });
  check('real app.js loaded: updateCropperOverlay defined', boot.hasUpdate);

  console.log('\nSVG element box == <img> box (the wrapper makes the overlay fill the image):');
  for (const s of SCENARIOS) {
    const r = await page.evaluate(async ({ url, pids }) => {
      const { cropperState } = window.__VISTA;
      await new Promise((resolve) => {
        const img = document.getElementById('cropperImage');
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;            // always (re)assign — each scenario is a different fixture
        if (img.complete) resolve();
      });
      const img = document.getElementById('cropperImage');
      cropperState.imageNaturalWidth = img.naturalWidth;
      cropperState.imageNaturalHeight = img.naturalHeight;
      cropperState.imageAspectRatio = img.naturalWidth / img.naturalHeight;
      cropperState.enabledPlatforms = new Set(pids);
      updateCropperOverlay();
      const imgR = img.getBoundingClientRect();
      const svg = document.getElementById('cropperOverlay');
      const svgR = svg.getBoundingClientRect();
      const safe = svg.querySelector('.safe-zone-rect');
      const safeR = safe ? safe.getBoundingClientRect() : null;
      return { imgR, svgR, safeR, hasSafe: !!safe };
    }, { url: `http://localhost:${PORT}/fixtures/og-${s.w}x${s.h}.png`, pids: s.pids });

    // (1) The overlay element now coincides with the <img> in screen space —
    //     i.e. .cropper-stage shrink-wrapped the image. This is the core fix:
    //     before it, the SVG filled the viewport and diverged for non-landscape
    //     images (Δ up to ~98px on 1200×1200).
    const boxesMatch =
      approx(r.imgR.left, r.svgR.left) && approx(r.imgR.top, r.svgR.top) &&
      approx(r.imgR.width, r.svgR.width) && approx(r.imgR.height, r.svgR.height);
    check(`${s.name}: overlay element box == <img> box`,
      boxesMatch,
      `img=(${r.imgR.left.toFixed(1)},${r.imgR.top.toFixed(1)} ${r.imgR.width.toFixed(1)}×${r.imgR.height.toFixed(1)}) svg=(${r.svgR.left.toFixed(1)},${r.svgR.top.toFixed(1)} ${r.svgR.width.toFixed(1)}×${r.svgR.height.toFixed(1)})`);

    if (s.shot) {
      await page.locator('#cropperViewport').screenshot({ path: path.join(SHOT_DIR, `${s.shot}.png`) });
    }
  }

  // (3) Strongest check: the safe-zone <rect>'s SCREEN box equals the image-space
  //     safe zone scaled onto the rendered <img>. Done per-scenario with the real
  //     calculateSafeZone() on the Node side (independent of the browser).
  console.log('\nSafe-zone <rect> screen position == geometry scaled onto the <img>:');
  for (const s of SCENARIOS) {
    const r = await page.evaluate(async ({ url, pids }) => {
      const { PLATFORM_CROPS, cropperState } = window.__VISTA;
      await new Promise((resolve) => {
        const img = document.getElementById('cropperImage');
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
        if (img.complete) resolve();
      });
      const img = document.getElementById('cropperImage');
      cropperState.imageNaturalWidth = img.naturalWidth;
      cropperState.imageNaturalHeight = img.naturalHeight;
      cropperState.imageAspectRatio = img.naturalWidth / img.naturalHeight;
      cropperState.enabledPlatforms = new Set(pids);
      updateCropperOverlay();
      const imgR = img.getBoundingClientRect();
      const safe = document.getElementById('cropperOverlay').querySelector('.safe-zone-rect');
      const safeR = safe.getBoundingClientRect();
      const cropSpecs = pids.map(p => PLATFORM_CROPS[p]).filter(Boolean);
      return { imgR, safeR, cropSpecs };
    }, { url: `http://localhost:${PORT}/fixtures/og-${s.w}x${s.h}.png`, pids: s.pids });

    const exp = calculateSafeZone(r.cropSpecs, s.w, s.h);
    const S = r.imgR.width / s.w;
    const expLeft = r.imgR.left + exp.x * S;
    const expTop = r.imgR.top + exp.y * S;
    const expW = exp.w * S;
    const expH = exp.h * S;
    const aligned =
      approx(r.safeR.left, expLeft) && approx(r.safeR.top, expTop) &&
      approx(r.safeR.width, expW) && approx(r.safeR.height, expH);
    check(`${s.name}: safe-zone <rect> sits on its image-space rect, scaled`,
      aligned,
      `rendered=(${r.safeR.left.toFixed(1)},${r.safeR.top.toFixed(1)} ${r.safeR.width.toFixed(1)}×${r.safeR.height.toFixed(1)}) expected=(${expLeft.toFixed(1)},${expTop.toFixed(1)} ${expW.toFixed(1)}×${expH.toFixed(1)})`);
  }

  if (pageErrors.length) {
    console.log(`\n  (harness page reported ${pageErrors.length} console/page errors — ` +
      `expected, since app.js init runs against a partial DOM.)`);
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
