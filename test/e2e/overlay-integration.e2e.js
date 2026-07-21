// @ts-check
/**
 * VISTA — END-TO-END crop-overlay INTEGRATION (bf-5yle).
 *
 * This is the capstone test that ties the three prior overlay suites together
 * by driving the REAL production entry point and confirming the whole pipeline
 * — calculation → on-screen SVG → exported PNG — agrees for the same image:
 *
 *   • test/unit/safe-zone.test.js     (bf-3n2m) — pure geometry, no DOM.
 *   • test/e2e/overlay-rendering.e2e.js (bf-4ijd) — SVG attributes (image
 *     space) + export-canvas pixels; state is set MANUALLY, overlay drawn by a
 *     direct updateCropperOverlay() call.
 *   • test/e2e/overlay-alignment.e2e.js (bf-4dd3) — screen-space overlay box
 *     == <img> box; state also set MANUALLY.
 *
 * What none of those do — and what this file adds:
 *
 *   1. Drive the REAL initCropper(data) entry that the app itself calls
 *      (line ~1039 of app.js). That fires the actual chain:
 *        cropperImage.src = ogImage  →  onload  →  capture naturalW/H into
 *        cropperState  →  renderImageInfo + renderCropperControls +
 *        updateCropperOverlay.
 *      Prior suites hand-set cropperState.imageNaturalWidth/Height and call
 *      updateCropperOverlay() directly, so they never exercise the
 *      image-load → state-capture step. Confirming cropperState holds the
 *      fixture's real natural dimensions after initCropper is the proof that
 *      the whole onload chain ran.
 *
 *   2. For ONE loaded image, assert all three representations AGREE:
 *        geometry (Node calculateSafeZone on the real PLATFORM_CROPS)
 *        ↔ on-screen SVG <rect> attributes (image space)
 *        ↔ on-screen SVG <rect> screen box (scaled onto the <img>)
 *        ↔ exported PNG (natural-resolution canvas, same geometry).
 *      The prior suites verify these separately, in different runs; this one
 *      pins them together per image so a regression that desyncs any pair is
 *      caught.
 *
 *   3. Edge cases the bead asks for: no og:image (empty state), a single
 *      platform (safe zone == that platform's crop rect), and the documented
 *      on-screen vs export opacity difference.
 *
 * Usage:   node test/e2e/overlay-integration.e2e.js
 */

const { chromium } = require('playwright');
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Independent Node instance of the geometry, fed the real PLATFORM_CROPS read
// out of the page, so EXPECTED values are derived independently from the
// browser's own calculateSafeZone().
const { calculateSafeZone, calculateCropRect } = require('../../src/public/safe-zone');

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

const PORT = Number(process.env.OVERLAY_INTEGRATION_PORT) || 14541;
const OUT_DIR = path.join(__dirname, '..', '..', 'test-results', 'overlay-integration');
const FIXTURE_DIR = path.join(OUT_DIR, 'fixtures');
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');
const EXPORT_DIR = path.join(OUT_DIR, 'exports');
fs.mkdirSync(FIXTURE_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(EXPORT_DIR, { recursive: true });

// ─── Fixture generation (sharp: SVG → PNG) ───────────────────────────────────
// Same visually-verifiable fixture family as the sibling suites: hue gradient +
// 100/500px grid + center crosshair + quarter dots + dimension label, so a
// misaligned overlay is visible in the screenshot artifacts.
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
// Mirrors the PRODUCTION cropper DOM from index.html (cropper-viewport >
// cropper-stage > cropperImage + cropperOverlay) and loads the REAL style.css +
// safe-zone.js + app.js from /app. Uses the same null-safe DOM stub trick as the
// sibling suites so the real app.js loads against this minimal DOM and defines
// PLATFORM_CROPS / cropperState / initCropper / updateCropperOverlay /
// exportCropperOverlay.
const HARNESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="/app/style.css"/>
</head><body>
  <div class="cropper-viewport" id="cropperViewport" style="width:900px;height:520px;">
    <div class="cropper-stage">
      <img id="cropperImage" class="cropper-image" alt=""/>
      <svg id="cropperOverlay" class="cropper-overlay" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
    <!-- Mirrors production index.html: a sibling empty-state element toggled by
         showCropperEmpty(), NOT injected into #cropperContainer (which would
         detach the cached image/overlay refs). Starts hidden. -->
    <div class="cropper-empty hidden" id="cropperEmpty" role="status" aria-live="polite"></div>
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

// Sizes chosen to exercise every fit-box binding case the overlay must survive:
// landscape (width binds for viewport, height binds for the image cap), square,
// portrait (height binds hard), ultra-wide, and retina 2×. Each is driven
// through the REAL initCropper() with the production default (all 31 platforms
// enabled), so the safe zone is the tight all-platforms intersection.
const SCENARIOS = [
  { name: '1200x630 landscape',  w: 1200, h: 630,  hue: 205, shot: 'landscape-1200x630' },
  { name: '1200x1200 square',    w: 1200, h: 1200, hue: 280, shot: 'square-1200x1200' },
  { name: '1000x1500 portrait',  w: 1000, h: 1500, hue: 320, shot: 'portrait-1000x1500' },
  { name: '2000x600 ultra-wide', w: 2000, h: 600,  hue: 25,  shot: 'wide-2000x600' },
  { name: '2400x1260 retina 2x', w: 2400, h: 1260, hue: 145, shot: 'retina-2400x1260' },
];

/**
 * Drive the REAL initCropper(data) and poll until the on-screen overlay has
 * rendered (safe-zone <rect> present), then return everything we need to
 * cross-check, including the live cropSpecs so Node can recompute expectations
 * independently. Returns null if the overlay never appears (load failure).
 */
async function driveInitCropper(page, port, s) {
  const url = `http://localhost:${port}/fixtures/og-${s.w}x${s.h}.png`;
  await page.evaluate((imgUrl) => {
    // The real production entry — same call app.js makes at line ~1039.
    initCropper({ meta: { og: { image: imgUrl } }, imageProbe: null });
  }, url);

  // Poll for THIS image's natural dimensions to land in cropperState — the
  // unambiguous signal that the new onload → capture-natural-dims chain fired.
  // (Polling for the safe-zone <rect> is NOT enough: the prior scenario's rect
  // is still in the SVG, so a presence check returns immediately with the
  // previous scenario's stale cropperState. Each scenario has unique dims, so
  // matching the target w/h proves this image's onload completed.)
  const result = await page.evaluate(async ({ imgUrl, wantW, wantH }) => {
    const { PLATFORM_CROPS, cropperState } = window.__VISTA;
    const svg = document.getElementById('cropperOverlay');
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      if (cropperState.imageNaturalWidth === wantW && cropperState.imageNaturalHeight === wantH) break;
      await new Promise(r => setTimeout(r, 25));
    }
    const safe = svg.querySelector('.safe-zone-rect');
    if (!safe) return null;

    const img = document.getElementById('cropperImage');
    const imgR = img.getBoundingClientRect();
    const svgR = svg.getBoundingClientRect();
    const safeR = safe.getBoundingClientRect();
    const allRects = Array.from(svg.querySelectorAll('rect'));
    const cropRects = allRects.filter(r => !r.classList.contains('safe-zone-rect'));
    const info = document.getElementById('safeZoneInfo').textContent.replace(/\s+/g, ' ').trim();
    const imgInfo = document.getElementById('imageInfo').textContent.replace(/\s+/g, ' ').trim();
    const badge = document.getElementById('cropperBadge').textContent.trim();
    return {
      naturalW: cropperState.imageNaturalWidth,
      naturalH: cropperState.imageNaturalHeight,
      aspect: cropperState.imageAspectRatio,
      enabledCount: cropperState.enabledPlatforms.size,
      viewBox: svg.getAttribute('viewBox'),
      cropRectCount: cropRects.length,
      hasSafeRect: !!safe,
      safeAttr: {
        x: parseFloat(safe.getAttribute('x')),
        y: parseFloat(safe.getAttribute('y')),
        w: parseFloat(safe.getAttribute('width')),
        h: parseFloat(safe.getAttribute('height')),
        fill: safe.getAttribute('fill'),
        stroke: safe.getAttribute('stroke'),
        dash: safe.getAttribute('stroke-dasharray'),
      },
      imgR, svgR, safeR,
      info, imgInfo, badge,
      cropSpecs: Object.values(PLATFORM_CROPS),
    };
  }, { imgUrl: url, wantW: s.w, wantH: s.h });
  return result;
}

async function main() {
  console.log('\noverlay-integration e2e (bf-5yle) — real initCropper() pipeline, calc→SVG→PNG\n');
  for (const s of SCENARIOS) await ensureFixture(s.w, s.h, s.hue);

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

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });

  // ── Boot: the real entry points loaded ───────────────────────────────────
  const boot = await page.evaluate(() => {
    const { PLATFORM_CROPS } = window.__VISTA;
    return {
      hasInit: typeof initCropper === 'function',
      hasUpdate: typeof updateCropperOverlay === 'function',
      hasExport: typeof exportCropperOverlay === 'function',
      hasGeometry: typeof calculateSafeZone === 'function',
      platformCount: Object.keys(PLATFORM_CROPS).length,
    };
  });
  check('real app.js loaded: initCropper defined (production entry)', boot.hasInit);
  check('real app.js loaded: updateCropperOverlay defined', boot.hasUpdate);
  check('real app.js loaded: exportCropperOverlay defined', boot.hasExport);
  check('real safe-zone.js loaded: calculateSafeZone defined', boot.hasGeometry);
  check(`real PLATFORM_CROPS loaded (${boot.platformCount} platforms)`, boot.platformCount === 31,
    `${boot.platformCount} platforms`);

  // ── Per-size: drive real initCropper, cross-check calc ↔ SVG ↔ screen ────
  console.log('\nFull pipeline (real initCropper, all 31 platforms) — geometry ↔ SVG ↔ screen:');
  for (const s of SCENARIOS) {
    const r = await driveInitCropper(page, PORT, s);
    check(`${s.name}: initCropper onload chain captured natural dims`,
      !!r && r.naturalW === s.w && r.naturalH === s.h,
      r ? `cropperState=${r.naturalW}×${r.naturalH}` : 'overlay never rendered');

    if (!r) { if (s.shot) await page.locator('#cropperViewport').screenshot({ path: path.join(SHOT_DIR, `${s.shot}-FAIL.png`) }); continue; }

    // (a) geometry ↔ SVG image-space attributes
    const exp = calculateSafeZone(r.cropSpecs, s.w, s.h);
    check(`${s.name}: SVG viewBox == image space (no transform)`,
      r.viewBox === `0 0 ${s.w} ${s.h}`, `viewBox="${r.viewBox}"`);
    check(`${s.name}: drew 31 crop rects + 1 safe zone`,
      r.cropRectCount === 31 && r.hasSafeRect, `${r.cropRectCount} crop, safe=${r.hasSafeRect}`);
    check(`${s.name}: safe-zone POSITION matches Node calculateSafeZone`,
      approx(r.safeAttr.x, exp.x, 1e-2) && approx(r.safeAttr.y, exp.y, 1e-2),
      `svg=(${r.safeAttr.x.toFixed(2)},${r.safeAttr.y.toFixed(2)}) expected=(${exp.x.toFixed(2)},${exp.y.toFixed(2)})`);
    check(`${s.name}: safe-zone DIMENSIONS match Node calculateSafeZone`,
      approx(r.safeAttr.w, exp.w, 1e-2) && approx(r.safeAttr.h, exp.h, 1e-2),
      `svg=${r.safeAttr.w.toFixed(2)}×${r.safeAttr.h.toFixed(2)} expected=${exp.w.toFixed(2)}×${exp.h.toFixed(2)}`);

    // (b) SVG box == <img> box (the bf-4dd3 alignment fix), per size
    const boxesMatch =
      approx(r.imgR.left, r.svgR.left) && approx(r.imgR.top, r.svgR.top) &&
      approx(r.imgR.width, r.svgR.width) && approx(r.imgR.height, r.svgR.height);
    check(`${s.name}: overlay element box == <img> box (screen)`,
      boxesMatch,
      `img=(${r.imgR.left.toFixed(0)},${r.imgR.top.toFixed(0)} ${r.imgR.width.toFixed(0)}×${r.imgR.height.toFixed(0)}) svg=(${r.svgR.left.toFixed(0)},${r.svgR.top.toFixed(0)} ${r.svgR.width.toFixed(0)}×${r.svgR.height.toFixed(0)})`);

    // (c) safe-zone <rect> screen box == image-space rect scaled onto <img>
    const S = r.imgR.width / s.w;
    const expLeft = r.imgR.left + exp.x * S, expTop = r.imgR.top + exp.y * S;
    const expW = exp.w * S, expH = exp.h * S;
    const aligned =
      approx(r.safeR.left, expLeft) && approx(r.safeR.top, expTop) &&
      approx(r.safeR.width, expW) && approx(r.safeR.height, expH);
    check(`${s.name}: safe-zone <rect> screen position == geometry scaled onto <img>`,
      aligned,
      `rendered=(${r.safeR.left.toFixed(1)},${r.safeR.top.toFixed(1)} ${r.safeR.width.toFixed(1)}×${r.safeR.height.toFixed(1)}) expected=(${expLeft.toFixed(1)},${expTop.toFixed(1)} ${expW.toFixed(1)}×${expH.toFixed(1)})`);

    // (d) info panel reflects the real pipeline output
    check(`${s.name}: image-info panel reports natural dimensions`,
      new RegExp(`${s.w} × ${s.h} px`).test(r.imgInfo), `"${r.imgInfo.slice(0, 60)}"`);
    check(`${s.name}: safe-zone info panel reports px + coverage + 31 platforms`,
      /Safe Zone/.test(r.info) && /Coverage/.test(r.info) && /31 selected/.test(r.info),
      `"${r.info.slice(0, 70)}"`);

    if (s.shot) await page.locator('#cropperViewport').screenshot({ path: path.join(SHOT_DIR, `${s.shot}.png`) });
  }

  // ── Export pipeline: same image, exported PNG shares the geometry ────────
  // Drive initCropper on the wide fixture, narrow to facebook-only, then export
  // and confirm the PNG is at natural resolution and the single crop fill lands
  // at ≈25% alpha (hex+'40') — proving exportCropperOverlay() used the same
  // calculateSafeZone/calc rects as the on-screen overlay. Facebook-only keeps
  // exactly ONE fill rect in the center so the alpha is predictable (with all
  // 31 platforms, overlapping fills of different colors composite and the
  // single-color alpha formula no longer holds — see notes/bf-5yle.md).
  console.log('\nExport pipeline (exportCropperOverlay) — shares the same geometry:');
  const WS = 2000, HS = 600;
  await ensureFixture(WS, HS, 25);
  const expScenario = SCENARIOS.find(s => s.w === WS && s.h === HS);
  await driveInitCropper(page, PORT, expScenario);
  await page.evaluate(() => {
    window.__VISTA.cropperState.enabledPlatforms = new Set(['facebook']);
    updateCropperOverlay();
  });

  const exportPath = path.join(EXPORT_DIR, `overlay-${WS}x${HS}-facebook.png`);
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => exportCropperOverlay());
  const download = await downloadPromise;
  await download.saveAs(exportPath);

  const exportedMeta = await sharp(exportPath).metadata();
  check('exported PNG is at natural image resolution (no scaling)',
    exportedMeta.width === WS && exportedMeta.height === HS,
    `${exportedMeta.width}×${exportedMeta.height}`);

  // Self-calibrated alpha: for source-over, a = (out-base)/(overlay-base).
  // facebook (social) fill = #3b82f6 with alpha suffix '40' = 0x40/0xff ≈ 0.251.
  // Center pixel (1000,300) is inside facebook's cover crop (x≥427 on 2000×600).
  const baseRaw = await sharp(path.join(FIXTURE_DIR, `og-${WS}x${HS}.png`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const expRaw = await sharp(exportPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ov = { r: 0x3b };
  const px = (buf, info, x, y, c) => buf[(y * info.width + x) * info.channels + c];
  const insideA = (px(expRaw.data, expRaw.info, 1000, 300, 0) - px(baseRaw.data, baseRaw.info, 1000, 300, 0)) / (ov.r - px(baseRaw.data, baseRaw.info, 1000, 300, 0));
  check('exported overlay renders crop fill at ≈25% alpha (hex+\'40\')',
    Math.abs(insideA - 0x40 / 0xff) < 0.03,
    `observed α=${insideA.toFixed(3)} (expected ~${(0x40 / 0xff).toFixed(3)})`);

  // ── Edge cases ───────────────────────────────────────────────────────────
  console.log('\nEdge cases:');
  let noImageOverlayCleared = false;

  // (1) No og:image → empty state, no overlay drawn. (Pass a full meta shape:
  //     initCropper reads `data.meta.og.image || data.meta.twitter.image`, so a
  //     missing `twitter` key would itself throw — see notes/bf-5yle.md.)
  await page.evaluate(() => {
    initCropper({ meta: { og: {}, twitter: {} }, imageProbe: null });
  });
  const empty = await page.evaluate(() => {
    const el = document.getElementById('cropperEmpty');
    return {
      emptyText: el ? el.textContent.replace(/\s+/g, ' ').trim() : '',
      // The element is present but hidden until a no-image / failed-load
      // result; the empty state is "shown" when .hidden is absent.
      emptyShown: el ? !el.classList.contains('hidden') : false,
      hasSafe: !!document.getElementById('cropperOverlay').querySelector('.safe-zone-rect'),
    };
  });
  check('no og:image → cropper shows empty state (#cropperEmpty text + un-hidden)',
    /No image found/.test(empty.emptyText) && empty.emptyShown === true,
    `"${empty.emptyText}" (shown=${empty.emptyShown})`);
  // The no-image branch now calls showCropperEmpty(), which clears
  // cropperOverlay.innerHTML in place — so the prior scenario's safe-zone rect
  // must NOT linger. (Before bf-6aj this was a documented cosmetic limitation;
  // the dedicated #cropperEmpty element + in-place reset fixed it.)
  noImageOverlayCleared = empty.hasSafe === false;

  // (2) Single platform → safe zone == that platform's crop rect (intersection
  //     of one rect is the rect itself). Confirms the calc→render pipeline
  //     responds to enabledPlatforms, not just the all-31 default.
  await ensureFixture(1200, 630, 205);
  await page.evaluate(async (imgUrl) => {
    initCropper({ meta: { og: { image: imgUrl } }, imageProbe: null });
    const { cropperState } = window.__VISTA;
    // Wait for onload to populate dims, then narrow to one platform + redraw.
    await new Promise(r => setTimeout(r, 400));
    cropperState.enabledPlatforms = new Set(['facebook']);
    updateCropperOverlay();
  }, `http://localhost:${PORT}/fixtures/og-1200x630.png`);
  const single = await page.evaluate(() => {
    const safe = document.getElementById('cropperOverlay').querySelector('.safe-zone-rect');
    const { PLATFORM_CROPS, cropperState } = window.__VISTA;
    return {
      safeAttr: safe && {
        x: parseFloat(safe.getAttribute('x')),
        y: parseFloat(safe.getAttribute('y')),
        w: parseFloat(safe.getAttribute('width')),
        h: parseFloat(safe.getAttribute('height')),
      },
      enabledCount: cropperState.enabledPlatforms.size,
      w: cropperState.imageNaturalWidth,
      h: cropperState.imageNaturalHeight,
      fbCrop: PLATFORM_CROPS.facebook,
    };
  });
  const fbExp = calculateCropRect(single.fbCrop, single.w, single.h);
  check('single platform selected: enabledPlatforms == 1', single.enabledCount === 1, `${single.enabledCount}`);
  check('single platform: safe zone == that platform\'s crop rect',
    single.safeAttr && approx(single.safeAttr.x, fbExp.x, 1e-2) && approx(single.safeAttr.y, fbExp.y, 1e-2) &&
    approx(single.safeAttr.w, fbExp.w, 1e-2) && approx(single.safeAttr.h, fbExp.h, 1e-2),
    `svg=(${single.safeAttr.x.toFixed(2)},${single.safeAttr.y.toFixed(2)} ${single.safeAttr.w.toFixed(2)}×${single.safeAttr.h.toFixed(2)}) expected=(${fbExp.x.toFixed(2)},${fbExp.y.toFixed(2)} ${fbExp.w.toFixed(2)}×${fbExp.h.toFixed(2)})`);

  // ── Per-platform toggle UI (bf-2hi) ──────────────────────────────────────
  // Prior assertions set cropperState.enabledPlatforms MANUALLY; this section
  // drives the real checkboxes that renderCropperControls() builds into
  // #cropperControls and confirms that toggling one shows/hides its overlay
  // rect and that each group header stays in sync with its children
  // (checked / indeterminate / unchecked).
  console.log('\nPer-platform toggle UI (cropperControls checkboxes):');
  await page.evaluate((imgUrl) => {
    initCropper({ meta: { og: { image: imgUrl } }, imageProbe: null });
  }, `http://localhost:${PORT}/fixtures/og-1200x630.png`);
  // Wait for onload → renderCropperControls + updateCropperOverlay.
  await page.waitForFunction(() => {
    return document.querySelectorAll('.cropper-platform-toggle input').length === 31 &&
           document.getElementById('cropperOverlay').querySelector('.safe-zone-rect');
  }, { timeout: 4000 });

  const SOCIAL = ['google','facebook','twitter','linkedin','reddit','mastodon','bluesky','threads','tumblr','pinterest'];

  const toggleInit = await page.evaluate(() => {
    const svg = document.getElementById('cropperOverlay');
    return {
      cropRects: svg.querySelectorAll('rect:not(.safe-zone-rect)').length,
      platformCbs: document.querySelectorAll('.cropper-platform-toggle input').length,
      groupCbs: document.querySelectorAll('.cropper-group-toggle').length,
    };
  });
  check('toggle UI renders 31 platform checkboxes grouped under 6 headers',
    toggleInit.platformCbs === 31 && toggleInit.groupCbs === 6,
    `${toggleInit.platformCbs} platforms, ${toggleInit.groupCbs} groups`);
  check('all 31 platforms checked by default → 31 overlay rects drawn',
    toggleInit.cropRects === 31, `${toggleInit.cropRects} rects`);

  // (a) Uncheck one platform via its real checkbox → its rect disappears and
  //     its group header flips to indeterminate.
  await page.evaluate(() => document.querySelector('input[data-platform="facebook"]').click());
  const afterUncheck = await page.evaluate(() => {
    const svg = document.getElementById('cropperOverlay');
    const g = document.querySelector('.cropper-group-toggle[data-group="social"]');
    return {
      cropRects: svg.querySelectorAll('rect:not(.safe-zone-rect)').length,
      fbChecked: document.querySelector('input[data-platform="facebook"]').checked,
      socialIndeterminate: g.indeterminate,
      socialChecked: g.checked,
    };
  });
  check('unchecking Facebook removes its overlay rect (31 → 30)',
    afterUncheck.cropRects === 30 && afterUncheck.fbChecked === false,
    `${afterUncheck.cropRects} rects, fbChecked=${afterUncheck.fbChecked}`);
  check('unchecking one platform makes its group header indeterminate',
    afterUncheck.socialIndeterminate === true,
    `indeterminate=${afterUncheck.socialIndeterminate}, checked=${afterUncheck.socialChecked}`);

  // (b) Re-check it → rect returns and the header is fully checked again.
  await page.evaluate(() => document.querySelector('input[data-platform="facebook"]').click());
  const afterRecheck = await page.evaluate(() => {
    const svg = document.getElementById('cropperOverlay');
    const g = document.querySelector('.cropper-group-toggle[data-group="social"]');
    return {
      cropRects: svg.querySelectorAll('rect:not(.safe-zone-rect)').length,
      socialIndeterminate: g.indeterminate,
      socialChecked: g.checked,
    };
  });
  check('re-checking Facebook restores its overlay rect (30 → 31)',
    afterRecheck.cropRects === 31, `${afterRecheck.cropRects} rects`);
  check('re-checking the last-off platform clears indeterminate (all on)',
    afterRecheck.socialIndeterminate === false && afterRecheck.socialChecked === true,
    `indeterminate=${afterRecheck.socialIndeterminate}, checked=${afterRecheck.socialChecked}`);

  // (c) Group header click → unchecks every platform in that group at once.
  await page.evaluate(() => document.querySelector('.cropper-group-toggle[data-group="social"]').click());
  const afterGroupUncheck = await page.evaluate((social) => {
    const svg = document.getElementById('cropperOverlay');
    const g = document.querySelector('.cropper-group-toggle[data-group="social"]');
    const cbs = social.map(pid => document.querySelector(`input[data-platform="${pid}"]`)).filter(Boolean);
    return {
      cropRects: svg.querySelectorAll('rect:not(.safe-zone-rect)').length,
      socialChecked: g.checked,
      socialIndeterminate: g.indeterminate,
      socialOn: cbs.filter(cb => cb.checked).length,
      socialTotal: cbs.length,
    };
  }, SOCIAL);
  check('clicking the Social group header unchecks all 10 social platforms',
    afterGroupUncheck.socialOn === 0 && afterGroupUncheck.socialTotal === 10,
    `${afterGroupUncheck.socialOn}/${afterGroupUncheck.socialTotal} on`);
  check('unchecking the whole group drops 10 overlay rects (31 → 21)',
    afterGroupUncheck.cropRects === 21, `${afterGroupUncheck.cropRects} rects`);
  check('fully-unchecked group header is unchecked, not indeterminate',
    afterGroupUncheck.socialChecked === false && afterGroupUncheck.socialIndeterminate === false,
    `checked=${afterGroupUncheck.socialChecked}, indeterminate=${afterGroupUncheck.socialIndeterminate}`);

  // (d) Group header click again → re-checks every platform, header back to checked.
  await page.evaluate(() => document.querySelector('.cropper-group-toggle[data-group="social"]').click());
  const afterGroupRecheck = await page.evaluate(() => {
    const svg = document.getElementById('cropperOverlay');
    const g = document.querySelector('.cropper-group-toggle[data-group="social"]');
    return {
      cropRects: svg.querySelectorAll('rect:not(.safe-zone-rect)').length,
      socialChecked: g.checked,
      socialIndeterminate: g.indeterminate,
    };
  });
  check('clicking the Social group header again re-checks all 10 (21 → 31)',
    afterGroupRecheck.cropRects === 31, `${afterGroupRecheck.cropRects} rects`);
  check('fully-rechecked group header is checked, not indeterminate',
    afterGroupRecheck.socialChecked === true && afterGroupRecheck.socialIndeterminate === false,
    `checked=${afterGroupRecheck.socialChecked}, indeterminate=${afterGroupRecheck.socialIndeterminate}`);

  // ── Known limitation: on-screen vs export opacity differ (documented) ────
  console.log('\nKnown limitation (documented, not a defect):');
  const opacities = await page.evaluate(() => {
    const svg = document.getElementById('cropperOverlay');
    const cropRect = svg.querySelector('rect:not(.safe-zone-rect)');
    return { svgFillOpacity: cropRect ? cropRect.getAttribute('fill-opacity') : null };
  });
  check('on-screen SVG crop fill = fill-opacity 0.15; export canvas = hex+\'40\' (≈0.25) — intentionally different views',
    opacities.svgFillOpacity === '0.15',
    `svg fill-opacity=${opacities.svgFillOpacity}; canvas export measured α≈${insideA.toFixed(2)} above`);

  // bf-6aj fixed the no-image path: showCropperEmpty() clears
  // cropperOverlay.innerHTML in place, so the prior scenario's safe-zone <rect>
  // no longer lingers in the SVG across a no-image re-load. (Was a documented
  // cosmetic limitation in notes/bf-5yle.md.)
  check('no-image re-load clears the prior safe-zone rect (overlay reset in place)',
    noImageOverlayCleared === true,
    `hasSafe after no-image initCropper=${!noImageOverlayCleared}`);

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
