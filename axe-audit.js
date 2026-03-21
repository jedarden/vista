// @ts-check
/**
 * Runs axe-core accessibility audit against the local vista server.
 * Audits: landing page, and results page after inspecting jedarden.com.
 */
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const LIBS_PATH = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
if (fs.existsSync(LIBS_PATH)) {
  process.env.LD_LIBRARY_PATH =
    LIBS_PATH + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
}

const PORT = 14400;
const BASE_URL = `http://localhost:${PORT}`;
const OUT = path.join(__dirname, 'test-results', 'axe-audit.json');

async function waitForServer(port, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://localhost:${port}/`, r => { r.resume(); res(); });
        req.on('error', rej);
        req.setTimeout(500, () => req.destroy());
      });
      return;
    } catch (_) { await new Promise(r => setTimeout(r, 200)); }
  }
  throw new Error(`Server not ready on port ${port}`);
}

async function auditPage(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  return { label, violations: results.violations, passes: results.passes.length, incomplete: results.incomplete.length };
}

async function run() {
  const server = spawn('node', ['src/server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  await waitForServer(PORT, 12000);
  console.log(`Server ready on port ${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const allResults = [];

  try {
    // ── Audit 1: Landing page ──
    {
      const page = await context.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      allResults.push(await auditPage(page, 'Landing page'));
      await page.close();
    }

    // ── Audit 2: Results page after inspecting jedarden.com ──
    {
      const page = await context.newPage();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.evaluate(url => {
        const input = document.querySelector('#urlInput');
        if (input) { input.value = url; input.dispatchEvent(new Event('input')); }
      }, 'https://jedarden.com');
      await page.evaluate(() => document.querySelector('#inspectBtn')?.click());
      await page.waitForSelector('#previewGrid .platform-card', { timeout: 30000 });
      await page.waitForTimeout(1000);
      allResults.push(await auditPage(page, 'Results page (jedarden.com)'));
      await page.close();
    }

  } finally {
    await context.close();
    await browser.close();
    server.kill();
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(allResults, null, 2));

  // Print summary
  let totalViolations = 0;
  for (const result of allResults) {
    console.log(`\n══ ${result.label} ══`);
    console.log(`  Passes: ${result.passes}  Incomplete: ${result.incomplete}  Violations: ${result.violations.length}`);
    for (const v of result.violations) {
      totalViolations++;
      const nodes = v.nodes.length;
      console.log(`  [${v.impact?.toUpperCase()}] ${v.id} — ${v.description} (${nodes} node${nodes > 1 ? 's' : ''})`);
    }
  }
  console.log(`\nTotal violations: ${totalViolations}`);
  console.log(`Full report: ${OUT}`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
