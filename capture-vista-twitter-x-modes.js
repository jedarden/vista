#!/usr/bin/env node

/**
 * Deterministic Twitter/X dark+light screenshot capture (bf-2j2jr)
 *
 * Why this exists:
 *   The committed notes/vista-twitter-x-light-mode.png was a byte-identical
 *   copy of the dark-mode screenshot (same MD5). The original captures were
 *   taken via ADB on a real Pixel 6, which grabbed the second screenshot
 *   before the theme toggle had actually applied to the DOM/CSS.
 *
 *   This script removes that fragility: it drives the page headlessly, clicks
 *   the real theme-toggle button, and VERIFIES the theme applied (data-theme
 *   attribute + computed background color of a frame) before each capture.
 *   Both shots come from the same rendering pipeline so the only difference
 *   between them is the theme.
 *
 * Output:
 *   notes/vista-twitter-x-dark-mode.png
 *   notes/vista-twitter-x-light-mode.png
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = __dirname;
const TEST_FILE = `file://${path.join(REPO, 'test-twitter-frame.html')}`;
const NOTES_DIR = path.join(REPO, 'notes');
const DARK_OUT = path.join(NOTES_DIR, 'vista-twitter-x-dark-mode.png');
const LIGHT_OUT = path.join(NOTES_DIR, 'vista-twitter-x-light-mode.png');

// Phone-like capture: 540 CSS px is wide enough for the test grid's 380px
// frame minimum (no horizontal overflow) while still laying frames out in a
// single column like a phone. At DPR 2 that yields a 1080px-wide image
// matching the original Pixel 6 capture's width.
const VIEWPORT = { width: 540, height: 900 };
const DEVICE_SCALE_FACTOR = 2;

// On NixOS the Playwright-downloaded Chromium can't resolve system libs
// (libglib etc.). Prefer a Nix-managed Chromium when available.
const NIX_CHROMIUM = '/nix/store/7xr3qnq93srn4dgak7qw74dw836wpp1y-chromium-138.0.7204.49/bin/chromium';
const EXECUTABLE_PATH = process.env.CHROMIUM_EXECUTABLE || (fs.existsSync(NIX_CHROMIUM) ? NIX_CHROMIUM : undefined);

function md5(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

async function readThemeState(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const frame = document.querySelector('.twitter-context');
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const frameBg = frame ? getComputedStyle(frame).backgroundColor : null;
    return {
      dataTheme: html.getAttribute('data-theme'),
      bodyBg,
      frameBg,
      frameCount: document.querySelectorAll('.twitter-context').length,
    };
  });
}

(async () => {
  console.log('bf-2j2jr: capturing Twitter/X dark + light screenshots');
  const browser = await chromium.launch({
    headless: true,
    executablePath: EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  });
  const page = await context.newPage();

  try {
    console.log(`loading ${TEST_FILE}`);
    await page.goto(TEST_FILE, { waitUntil: 'networkidle' });
    // Let the inline verification suite + initial paint settle.
    await page.waitForTimeout(500);

    // ----- DARK -----
    const darkBefore = await readThemeState(page);
    if (darkBefore.dataTheme !== 'dark') {
      throw new Error(`expected initial theme 'dark', got '${darkBefore.dataTheme}'`);
    }
    await page.screenshot({ path: DARK_OUT, fullPage: true });
    const darkState = await readThemeState(page);
    console.log(`DARK  : data-theme=${darkState.dataTheme} bodyBg=${darkState.bodyBg} frames=${darkState.frameCount}`);

    // ----- TOGGLE via the real button, then VERIFY it took effect -----
    console.log('clicking #themeToggle');
    await page.click('#themeToggle');
    // 3rd arg is options (2nd is the function's arg) — without this the
    // timeout defaults to 30s and the predicate never short-circuits.
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-theme') === 'light',
      null,
      { timeout: 5000 },
    );
    await page.waitForTimeout(300); // let the frame background repaint

    // ----- LIGHT -----
    await page.screenshot({ path: LIGHT_OUT, fullPage: true });
    const lightState = await readThemeState(page);
    console.log(`LIGHT : data-theme=${lightState.dataTheme} bodyBg=${lightState.bodyBg} frames=${lightState.frameCount}`);

    if (lightState.dataTheme !== 'light') {
      throw new Error(`toggle failed: data-theme is '${lightState.dataTheme}', expected 'light'`);
    }
    // Frame background must actually be light (white-ish), proving the CSS
    // variables repainted — not just the attribute flipping.
    const lightRgb = (lightState.frameBg || '').match(/\d+/g);
    if (!lightRgb || lightRgb.map(Number).some(n => n < 240)) {
      throw new Error(`toggle failed: light frame background is ${lightState.frameBg}, expected white`);
    }

    // ----- VERIFY the two captures actually differ -----
    const darkMd5 = md5(DARK_OUT);
    const lightMd5 = md5(LIGHT_OUT);
    console.log(`dark  md5=${darkMd5} (${fs.statSync(DARK_OUT).size} bytes)`);
    console.log(`light md5=${lightMd5} (${fs.statSync(LIGHT_OUT).size} bytes)`);

    if (darkMd5 === lightMd5) {
      throw new Error('FATAL: dark and light screenshots are byte-identical — theme did not apply');
    }
    console.log('PASS: dark and light screenshots differ');

  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('capture failed:', err.message);
  process.exit(1);
});
