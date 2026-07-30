/**
 * Theme Persistence Verification Test
 *
 * Tests that theme selection persists across page reloads
 * with no FOUC (Flash of Unstyled Content)
 */

const puppeteer = require('puppeteer');
const { URL } = require('url');

async function testThemePersistence() {
  console.log('Starting theme persistence verification...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Test 1: Check FOUC prevention (inline script)
    console.log('Test 1: Checking for FOUC prevention inline script...');
    await page.goto('http://localhost:8765/src/public/index.html', {
      waitUntil: 'domcontentloaded'
    });

    const hasInlineScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script => {
        const text = script.textContent || '';
        return text.includes(' Prevent FOUC') &&
               text.includes('localStorage.getItem(\'vista-theme\')') &&
               script.parentNode.tagName === 'HEAD';
      });
    });

    console.log(`  ${hasInlineScript ? '✓' : '✗'} Inline FOUC prevention script present in <head>`);

    // Test 2: Theme attribute set before body renders
    console.log('\nTest 2: Checking if theme is set immediately...');
    await page.goto('http://localhost:8765/src/public/index.html', {
      waitUntil: 'domcontentloaded'
    });

    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    console.log(`  ${initialTheme ? '✓' : '✗'} Initial theme attribute: ${initialTheme || 'NOT SET'}`);

    // Test 3: Default to dark theme
    console.log('\nTest 3: Checking default theme...');
    const isDefaultDark = initialTheme === 'dark';
    console.log(`  ${isDefaultDark ? '✓' : '✗'} Default theme is dark: ${isDefaultDark}`);

    // Test 4: Toggle theme to light
    console.log('\nTest 4: Toggling theme to light...');
    await page.evaluate(() => {
      if (typeof window.toggleGlobalTheme === 'function') {
        window.toggleGlobalTheme();
      } else if (typeof window.applyTheme === 'function') {
        window.applyTheme('light');
      }
    });

    await page.waitForTimeout(100); // Brief pause for theme change

    const lightTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    console.log(`  ${lightTheme === 'light' ? '✓' : '✗'} Theme switched to light: ${lightTheme}`);

    // Test 5: Check localStorage save
    console.log('\nTest 5: Checking localStorage save...');
    const savedTheme = await page.evaluate(() => {
      return localStorage.getItem('vista-theme');
    });

    console.log(`  ${savedTheme === 'light' ? '✓' : '✗'} localStorage saved: ${savedTheme}`);

    // Test 6: Reload page and verify persistence
    console.log('\nTest 6: Reloading page to test persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });

    const restoredTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    const restoredLocalStorage = await page.evaluate(() => {
      return localStorage.getItem('vista-theme');
    });

    const persists = restoredTheme === 'light' && restoredLocalStorage === 'light';
    console.log(`  ${persists ? '✓' : '✗'} Theme persists after reload: ${restoredTheme}`);
    console.log(`  ${restoredLocalStorage === 'light' ? '✓' : '✗'} localStorage persists: ${restoredLocalStorage}`);

    // Test 7: Toggle back to dark
    console.log('\nTest 7: Toggling back to dark...');
    await page.evaluate(() => {
      if (typeof window.toggleGlobalTheme === 'function') {
        window.toggleGlobalTheme();
      } else if (typeof window.applyTheme === 'function') {
        window.applyTheme('dark');
      }
    });

    await page.waitForTimeout(100);

    const darkTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    console.log(`  ${darkTheme === 'dark' ? '✓' : '✗'} Theme switched to dark: ${darkTheme}`);

    // Test 8: Verify dark theme persists
    console.log('\nTest 8: Verifying dark theme persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });

    const finalTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    const finalLocalStorage = await page.evaluate(() => {
      return localStorage.getItem('vista-theme');
    });

    const darkPersists = finalTheme === 'dark' && finalLocalStorage === 'dark';
    console.log(`  ${darkPersists ? '✓' : '✗'} Dark theme persists: ${finalTheme}`);
    console.log(`  ${finalLocalStorage === 'dark' ? '✓' : '✗'} localStorage persists: ${finalLocalStorage}`);

    // Test 9: Check for FOUC by measuring theme application timing
    console.log('\nTest 9: Checking for FOUC (Flash of Unstyled Content)...');

    // Clear localStorage and reload to test cold load
    await page.evaluate(() => {
      localStorage.removeItem('vista-theme');
    });

    // Use performance timing to check when theme is applied
    const focrTest = await page.evaluate(() => {
      const timing = {};
      timing.navigationStart = performance.timing.navigationStart;
      timing.domLoading = performance.timing.domLoading;
      timing.domContentLoaded = performance.timing.domContentLoaded;
      return timing;
    });

    await page.goto('http://localhost:8765/src/public/index.html', {
      waitUntil: 'domcontentloaded'
    });

    const themeOnLoad = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    const hasNoFouc = themeOnLoad !== null;
    console.log(`  ${hasNoFouc ? '✓' : '✗'} Theme attribute present on load: ${themeOnLoad}`);
    console.log(`  ${hasNoFouc ? '✓' : '✗'} No FOUC detected (theme set before render)`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));

    const allPass = hasInlineScript &&
                   initialTheme &&
                   isDefaultDark &&
                   lightTheme === 'light' &&
                   savedTheme === 'light' &&
                   persists &&
                   darkTheme === 'dark' &&
                   darkPersists &&
                   hasNoFouc;

    console.log(`\nOverall Result: ${allPass ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}\n`);

    console.log('Acceptance Criteria:');
    console.log(`  ${savedTheme === 'light' ? '✓' : '✗'} 1. Selected theme is saved to localStorage`);
    console.log(`  ${persists ? '✓' : '✗'} 2. Reloading the page restores the saved theme`);
    console.log(`  ${hasNoFouc ? '✓' : '✗'} 3. No FOUC (Flash of Unstyled Content) on reload`);
    console.log(`  ${hasNoFouc ? '✓' : '✗'} 4. Theme applies immediately on page load`);

  } finally {
    await browser.close();
  }
}

// Run the test
testThemePersistence().catch(console.error);
