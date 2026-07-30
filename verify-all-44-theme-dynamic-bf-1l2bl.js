/**
 * bf-1l2bl — Dynamic theme-toggle verification + screenshot capture.
 *
 * Boots the vista express server (src/server.js), opens
 * verify-all-44-theme-bf-1l2bl.html in headless chromium, waits for the
 * in-page harness to finish (window.__themeResults), prints pass/fail, and
 * captures two contact-sheet screenshots per mode (dark + light) of every
 * platform frame as evidence under notes/bf-1l2bl-shots/.
 *
 * Run:  node verify-all-44-theme-dynamic-bf-1l2bl.js
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m',
};

const PORT = 3399;
const SHOT_DIR = path.join(__dirname, 'notes', 'bf-1l2bl-shots');
const PAGE = `/verify-all-44-theme-bf-1l2bl.html`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Browser bootstrap -------------------------------------------------------
// This host has no system glib/NSS/cups, so a bare chrome launch fails on
// libglib-2.0.so.0. A Nix playwright-FHS rootfs in the store bundles every lib
// chrome needs; we point LD_LIBRARY_PATH at it and drive the full chromium
// build (not the headless-shell, which lacks its own deps) via executablePath.
const PW_CHROME = '/home/coding/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const FHS = '/nix/store/c3s7smp2nfxza5pv3yigims74ndw8wxx-pw-fhs-fhsenv-rootfs';
const BROWSER_ENV = {
  ...process.env,
  LD_LIBRARY_PATH: `${FHS}/lib:${FHS}/lib64:${FHS}/usr/lib:${FHS}/usr/lib64`,
};

(async function main() {
  // 1. Boot server
  const server = spawn('node', ['src/server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let bootErr = '';
  server.stderr.on('data', d => { bootErr += d.toString(); });

  // wait for port to respond
  const ready = await new Promise((resolve) => {
    const deadline = Date.now() + 15000;
    (async function probe() {
      try {
        const r = await fetch(`http://localhost:${PORT}/${PAGE}`);
        if (r.ok) return resolve(true);
      } catch (_) { /* not ready */ }
      if (Date.now() > deadline) return resolve(false);
      await sleep(300);
      probe();
    })();
  });

  if (!ready) {
    console.error(`${C.red}Server did not become ready on :${PORT}.${C.reset}`);
    console.error(bootErr);
    server.kill('SIGKILL');
    process.exit(1);
  }
  console.log(`${C.dim}server up on :${PORT}${C.reset}`);

  fs.mkdirSync(SHOT_DIR, { recursive: true });

  let exitCode = 0;
  const browser = await chromium.launch({
    headless: true,
    executablePath: PW_CHROME,        // full chromium build (not headless_shell)
    env: BROWSER_ENV,                 // Nix FHS rootfs provides libglib/NSS/etc.
  });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));

    await page.goto(`http://localhost:${PORT}${PAGE}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.getAttribute('data-done') === '1' && !!window.__themeResults, null, { timeout: 20000 });
    const results = await page.evaluate(() => window.__themeResults);

    // Print per-platform verdict
    console.log(`\n${C.bold}=== bf-1l2bl Dynamic Theme-Toggle Verification ===${C.reset}`);
    console.log(`${C.dim}toggle driven through FrameTheme.updateAllPlatformFrames()${C.reset}\n`);
    for (const r of results.results) {
      const mark = r.passed ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
      if (!r.passed) exitCode = 1;
      console.log(`  ${mark} ${r.id.padEnd(16)} ${C.dim}${r.name}${C.reset}`);
      if (!r.passed) r.errs.forEach(e => console.log(`        ${C.red}${e}${C.reset}`));
    }
    const color = results.fail === 0 ? C.green : C.red;
    console.log(`\n${color}${C.bold}${results.pass}/${results.total} platforms PASS dynamic verification${C.reset}`);
    if (errors.length) {
      console.log(`${C.yellow}runtime console errors: ${errors.length}${C.reset}`);
      errors.slice(0, 8).forEach(e => console.log(`   ${C.yellow}- ${e}${C.reset}`));
    }

    // 2. Contact-sheet screenshots — dark then light — of ALL frames.
    // Full-page screenshots of the in-page grid (which re-themes to dark at end
    // of the harness), then flip globally to light and re-shoot.
    await page.evaluate(() => window.FrameTheme.updateAllPlatformFrames('dark'));
    await sleep(250);
    await page.screenshot({ path: path.join(SHOT_DIR, 'all-platforms-dark.png'), fullPage: true });

    await page.evaluate(() => window.FrameTheme.updateAllPlatformFrames('light'));
    await sleep(250);
    await page.screenshot({ path: path.join(SHOT_DIR, 'all-platforms-light.png'), fullPage: true });

    // 3. Per-platform close-ups in both modes for granular evidence.
    const ids = results.results.map(r => r.id);
    for (const id of ids) {
      const sel = `.cell:has(.context-frame[data-platform="${id}"]) .frame-wrap .context-frame`;
      const handle = await page.$(sel);
      if (!handle) continue;
      await page.evaluate(p => window.FrameTheme.updateAllPlatformFrames('dark'), id);
      await sleep(120);
      await handle.screenshot({ path: path.join(SHOT_DIR, `${id}-dark.png`) });
      await page.evaluate(p => window.FrameTheme.updateAllPlatformFrames('light'), id);
      await sleep(120);
      await handle.screenshot({ path: path.join(SHOT_DIR, `${id}-light.png`) });
    }

    console.log(`${C.green}screenshots → notes/bf-1l2bl-shots/ (${ids.length * 2 + 2} files)${C.reset}`);

    // Stash a machine-readable summary for the doc step.
    fs.writeFileSync(
      path.join(SHOT_DIR, 'results.json'),
      JSON.stringify({ ...results, consoleErrors: errors.length, port: PORT }, null, 2)
    );
  } finally {
    await browser.close();
    server.kill('SIGKILL');
  }
  process.exit(exitCode);
})().catch(e => {
  console.error(`${C.red}FATAL: ${e.stack || e.message}${C.reset}`);
  process.exit(1);
});
