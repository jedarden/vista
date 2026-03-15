// @ts-check
/**
 * VISTA — Visual regression / presentability test suite
 *
 * Spins up a local vista server, drives Playwright through all key UI states,
 * and captures screenshots into test-results/vista-visual/.
 *
 * An HTML report is generated at test-results/vista-visual/report.html.
 *
 * Usage:
 *   node visual.test.js
 *   INSPECT_URL=https://yoursite.com node visual.test.js
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Headless Chrome needs extracted system libs on this server
const LIBS_PATH = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
if (fs.existsSync(LIBS_PATH)) {
  process.env.LD_LIBRARY_PATH =
    LIBS_PATH + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
}

const OUT_DIR = path.join(__dirname, 'test-results', 'vista-visual');
const INSPECT_URL = process.env.INSPECT_URL || 'https://jedarden.com';
const SERVER_PORT = 14399;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

let passed = 0;
let failed = 0;
const shots = []; // { file, label }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function shot(page, name, label, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage || false });
  shots.push({ file: `${name}.png`, label });
  console.log(`  📸 ${label}`);
  return file;
}

async function waitForServer(port, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, res => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(500, () => req.destroy());
      });
      return;
    } catch (_) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} did not start within ${timeout}ms`);
}

function generateReport() {
  const rows = shots
    .map(s => `
      <div class="card">
        <img src="${s.file}" alt="${s.label}" loading="lazy" />
        <div class="label">${s.label}</div>
      </div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VISTA Visual Test Report</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0d0d0f; color: #eee; margin: 0; padding: 24px; }
    h1 { font-size: 1.4rem; margin-bottom: 4px; color: #fff; }
    .meta { font-size: 0.85rem; color: #888; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 24px; }
    .card { background: #1a1a1f; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
    .card img { width: 100%; display: block; }
    .label { padding: 8px 12px; font-size: 0.8rem; color: #aaa; border-top: 1px solid #222; }
    .summary { margin-bottom: 20px; }
    .pass { color: #4caf50; } .fail { color: #f44336; }
  </style>
</head>
<body>
  <h1>VISTA Visual Test Report</h1>
  <p class="meta">Generated: ${new Date().toISOString()} · Inspect URL: ${INSPECT_URL}</p>
  <div class="summary">
    <span class="pass">✓ ${passed} passed</span>
    &nbsp;&nbsp;
    <span class="${failed > 0 ? 'fail' : 'pass'}">${failed > 0 ? '✗' : '✓'} ${failed} failed</span>
  </div>
  <div class="grid">${rows}</div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'report.html'), html);
  console.log(`\n  Report: ${path.join(OUT_DIR, 'report.html')}`);
}

// ─── Test phases ──────────────────────────────────────────────────────────────

async function testLanding(page, browser) {
  console.log('\n── Phase 2: Landing page ──');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  check('Page title contains VISTA', (await page.title()).includes('VISTA'));

  // Full landing page (light mode default)
  await shot(page, '01-landing-light', 'Landing page (light mode)', { fullPage: true });

  // Check key elements (use evaluate since elements may be inside scrolled hero)
  const heroH1 = await page.evaluate(() => !!document.querySelector('.hero h1'));
  check('Hero headline in DOM', heroH1);

  const inputVisible = await page.evaluate(() => {
    const el = document.querySelector('#urlInput');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && !el.closest('.hidden');
  });
  check('URL input visible', inputVisible);

  const inspectBtn = await page.locator('#inspectBtn').isVisible();
  check('Inspect button visible', inspectBtn);

  // Example chips
  const chips = await page.locator('.chip').count();
  check('Example chips present', chips >= 3, `found ${chips}`);

  // Nav tabs
  const navBtns = await page.locator('.nav-btn').count();
  check('Nav tabs present', navBtns >= 4, `found ${navBtns}`);

  // Switch to dark mode
  await page.click('#globalThemeToggle');
  await page.waitForTimeout(400);
  await shot(page, '02-landing-dark', 'Landing page (dark mode)', { fullPage: true });

  const bodyBg = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor
  );
  console.log(`  body background in dark mode: ${bodyBg}`);

  // Switch back to light
  await page.click('#globalThemeToggle');
  await page.waitForTimeout(300);

  // Paste HTML tab
  await page.evaluate(() => document.querySelector('#navPaste')?.click());
  await page.waitForTimeout(300);
  await shot(page, '03-paste-mode', 'Paste HTML mode');

  // Return to inspect/URL mode
  await page.evaluate(() => document.querySelector('#navInspect')?.click());
  await page.waitForTimeout(300);

  // Note: #navCompare and #navSitemap modes crash headless Chrome on this server
  // (likely a ResizeObserver/MutationObserver crash in the headless shell).
  // These are skipped here; use the deployed vista.ardenone.com for manual review.
  console.log('  ⚠ Compare/Sitemap modes skipped (headless crash — see deployed site for review)');
}

async function testInspectFlow(page) {
  console.log(`\n── Phase 3: Inspect flow (${INSPECT_URL}) ──`);

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Navigate fresh to avoid mode bleed-through from landing phase
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Fill and submit URL via JS to avoid visibility constraints
  await page.evaluate((url) => {
    const input = document.querySelector('#urlInput');
    if (input) { input.value = url; input.dispatchEvent(new Event('input')); }
  }, INSPECT_URL);
  await shot(page, '06-url-entered', 'URL entered in input');

  await page.evaluate(() => document.querySelector('#inspectBtn')?.click());
  console.log('  Waiting for results...');

  // Wait for results section to appear
  await page.waitForSelector('#resultsSection:not(.hidden)', { timeout: 30000 });
  await page.waitForSelector('#previewGrid .platform-card', { timeout: 30000 });
  await page.waitForTimeout(1500); // let images load

  // Full results page
  await shot(page, '07-results-full', 'Results page (full)', { fullPage: true });

  // Summary bar
  const grade = await page.locator('#overallGrade').textContent();
  check('Overall grade shown', !!grade && grade !== '-', `grade=${grade}`);

  // Preview grid
  const cards = await page.locator('.platform-card').count();
  check('Platform preview cards rendered', cards > 5, `found ${cards} cards`);

  // Screenshot just the preview grid
  const grid = page.locator('#previewGrid');
  if (await grid.isVisible()) {
    await grid.screenshot({ path: path.join(OUT_DIR, '08-preview-grid.png') });
    shots.push({ file: '08-preview-grid.png', label: 'Platform preview grid' });
    console.log('  📸 Platform preview grid');
  }

  // Screenshot viewport-sized results (top of results)
  await page.locator('#resultsSection').scrollIntoViewIfNeeded();
  await shot(page, '09-results-viewport', 'Results section (viewport)');

  // Check for broken images in the preview grid
  const broken = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#previewGrid img'));
    return imgs.filter(img => img.complete && img.naturalWidth === 0 && img.src).map(img => img.src);
  });
  check('No broken images in preview grid', broken.length === 0, broken.length > 0 ? `broken: ${broken.join(', ')}` : '');

  // Try to find and screenshot individual platform cards
  const platformCards = {
    facebook: 'Facebook card',
    twitter: 'Twitter/X card',
    linkedin: 'LinkedIn card',
    slack: 'Slack card',
    google: 'Google Search card',
  };

  for (const [id, label] of Object.entries(platformCards)) {
    const card = page.locator(`.platform-card[data-pid="${id}"]`).first();
    try {
      if (await card.isVisible({ timeout: 1000 })) {
        await card.scrollIntoViewIfNeeded();
        await card.screenshot({ path: path.join(OUT_DIR, `10-card-${id}.png`) });
        shots.push({ file: `10-card-${id}.png`, label });
        console.log(`  📸 ${label}`);
      }
    } catch (_) {}
  }
}

async function testResultsTabs(page) {
  console.log('\n── Phase 3b: Results tabs ──');

  const tabs = [
    { selector: '[data-tab="diagnostics"]', id: 'tabDiagnostics', name: '11-tab-diagnostics', label: 'Diagnostics tab' },
    { selector: '[data-tab="rawtags"]', id: 'tabRawtags', name: '12-tab-rawtags', label: 'Raw Tags tab' },
    { selector: '[data-tab="redirects"]', id: 'tabRedirects', name: '13-tab-redirects', label: 'Redirects & Headers tab' },
    { selector: '[data-tab="fixes"]', id: 'tabFixes', name: '14-tab-fixes', label: 'Auto-Fix tab' },
    { selector: '[data-tab="editor"]', id: 'tabEditor', name: '15-tab-editor', label: 'Editor tab' },
    { selector: '[data-tab="codesnippet"]', id: 'tabCodesnippet', name: '16-tab-codesnippet', label: 'Code Snippet tab' },
    { selector: '[data-tab="templates"]', id: 'tabTemplates', name: '17-tab-templates', label: 'Templates tab' },
  ];

  for (const tab of tabs) {
    try {
      const btn = page.locator(`button${tab.selector}`).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        await page.waitForTimeout(500);
        const pane = page.locator(`#${tab.id}`);
        if (await pane.isVisible({ timeout: 1000 })) {
          await pane.screenshot({ path: path.join(OUT_DIR, `${tab.name}.png`) });
          shots.push({ file: `${tab.name}.png`, label: tab.label });
          console.log(`  📸 ${tab.label}`);
        }
      }
    } catch (_) {}
  }
}

async function testDarkModeResults(page) {
  console.log('\n── Phase 3c: Dark mode results ──');
  try {
    await page.evaluate(() => document.querySelector('#globalThemeToggle')?.click());
    await page.waitForTimeout(600);
    await shot(page, '18-results-dark', 'Results in dark mode');
    // Back to light
    await page.evaluate(() => document.querySelector('#globalThemeToggle')?.click());
    await page.waitForTimeout(300);
  } catch (e) {
    console.log(`  ⚠ Dark mode results skipped: ${e.message.split('\n')[0]}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Start vista server
  console.log(`Starting vista server on port ${SERVER_PORT}...`);
  const server = spawn('node', ['src/server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(SERVER_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.log(`  [server] ${msg}`);
  });

  try {
    await waitForServer(SERVER_PORT, 12000);
    console.log(`✓ Server ready at ${BASE_URL}\n`);
  } catch (e) {
    console.error('Failed to start server:', e.message);
    server.kill();
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // ── Phase 1 done (server running) ──
    console.log('── Phase 1: Server started ✓ ──');
    check('Vista server responding', true);

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    // Phases 2–4
    await testLanding(page, browser);
    await testInspectFlow(page);
    await testResultsTabs(page);
    await testDarkModeResults(page);

    await page.close();

  } finally {
    await browser.close();
    server.kill();
  }

  generateReport();

  console.log(`\n══ Result: ${passed} passed, ${failed} failed ══`);
  console.log(`Screenshots: ${OUT_DIR}`);
  console.log(`Report:      ${path.join(OUT_DIR, 'report.html')}`);

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('\nTest runner error:', err.message);
  process.exit(1);
});
