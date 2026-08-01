'use strict';
// Verify bf-5dn: progressive card cascade / platform-specific skeleton cards
// Loads the running VISTA server and inspects whether the skeleton grid renders
// correctly at 0ms (before fetch), per the plan.

const { chromium } = require('playwright');

const PORT = process.env.PORT || 3999;
const BASE = `http://localhost:${PORT}`;

// Minimal HTML with full OG tags so text + image cards both resolve.
const SAMPLE_HTML = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Example Page Title</title>
<meta name="description" content="A sample description for the OG card.">
<meta property="og:title" content="Example OG Title">
<meta property="og:description" content="Example OG description text.">
<meta property="og:image" content="https://placehold.co/1200x630">
<meta property="og:url" content="https://example.com/">
<meta property="og:site_name" content="Example">
<meta name="twitter:card" content="summary_large_image">
</head><body><h1>hello</h1></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(500); // let fetchPlatformConfig (if any) settle

  // Check whether PLATFORM_SKELETON_TYPES got populated
  const skelTypesState = await page.evaluate(() => ({
    isNull: typeof window.PLATFORM_SKELETON_TYPES === 'undefined' ? 'undefined_global' : (window.PLATFORM_SKELETON_TYPES === null),
    sample: window.PLATFORM_SKELETON_TYPES,
  }));

  // Trigger an inspect via paste-HTML mode (avoids real network fetch timing)
  // Switch to paste mode
  await page.click('#switchToPaste');
  await page.fill('#htmlInput', SAMPLE_HTML);
  await page.click('#pasteForm button.inspect-btn');

  // Capture the skeleton grid state as close to 0ms as possible
  await page.waitForTimeout(120);

  const skeletonState = await page.evaluate(() => {
    const grid = document.getElementById('previewGrid');
    const cards = grid ? Array.from(grid.querySelectorAll('.platform-skeleton-card')) : [];
    const sample = cards.slice(0, 6).map(c => {
      const pid = c.dataset.pid;
      const hasTall = !!c.querySelector('.skeleton-tall-img');
      const hasShort = !!c.querySelector('.skeleton-short-thumb');
      const hasText = !!c.querySelector('.skeleton-text-title');
      const hasBody = !!(hasTall || hasShort || hasText);
      const delay = c.style.getPropertyValue('--stagger-delay');
      return { pid, hasTall, hasShort, hasText, hasBody, delay };
    });
    return { total: cards.length, sample };
  });

  // Check getSkeletonType behavior for google vs others (functional probe)
  const probe = await page.evaluate(() => {
    try {
      const g = (typeof getSkeletonType === 'function') ? getSkeletonType('google') : 'no-global';
      const f = (typeof getSkeletonType === 'function') ? getSkeletonType('facebook') : 'no-global';
      const html = (typeof getSkeletonHtml === 'function') ? getSkeletonHtml('google') : 'no-global';
      const hasTextBody = html.includes('skeleton-text-title');
      return { googleType: g, facebookType: f, googleHtmlHasTextBody: hasTextBody };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log(JSON.stringify({ skelTypesState, skeletonState, probe, consoleErrors: consoleErrors.slice(0,8), pageErrors: pageErrors.slice(0,5) }, null, 2));

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
