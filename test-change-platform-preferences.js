/**
 * Verification test for change-platform-preferences utility
 *
 * This test verifies that the utility correctly:
 * 1. Accepts page object and platform array
 * 2. Sets each platform preference in the UI
 * 3. Triggers the reordering action
 * 4. Waits for DOM to stabilize
 *
 * Run: node test-change-platform-preferences.js
 */

const { chromium } = require('playwright');
const {
  setPlatformPreferences,
  waitDOMStable,
  getPlatformPreferences,
  setSmartOrdering
} = require('./change-platform-preferences');

const BASE_URL = 'http://localhost:3000';
const RESULTS = { passed: [], failed: [], startTime: new Date().toISOString() };

function log(name, passed, details = '') {
  const result = { test: name, passed, details, timestamp: new Date().toISOString() };
  (passed ? RESULTS.passed : RESULTS.failed).push(result);
  console.log(`[${passed ? '✓' : '✗'}] ${name}${details ? ': ' + details : ''}`);
}

async function runTests() {
  console.log('Starting Platform Preference Change Utility Tests...\n');

  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    // Test 1: Load the page
    console.log('Test 1: Loading VISTA page');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      const hasTitle = title.includes('VISTA') || title.includes('Social Share Preview');
      log('Page Load', hasTitle, `Title: "${title}"`);
    } catch (error) {
      log('Page Load', false, error.message);
      throw error;
    }

    // Test 2: Get initial preferences
    console.log('\nTest 2: Getting initial preferences');
    try {
      const prefs = await getPlatformPreferences(page);
      const hasPrefs = prefs !== null;
      log('Get Initial Preferences', hasPrefs, hasPrefs ? JSON.stringify(prefs) : 'No preferences retrieved');

      if (hasPrefs) {
        console.log('  → Favorites:', prefs.favorites);
        console.log('  → Smart ordering:', prefs.smartOrdering);
      }
    } catch (error) {
      log('Get Initial Preferences', false, error.message);
    }

    // Test 3: Set platform preferences
    console.log('\nTest 3: Setting platform preferences');
    try {
      const platforms = ['twitter', 'facebook', 'linkedin'];
      const result = await setPlatformPreferences(page, platforms);

      const success = result.success && result.count === platforms.length;
      log('Set Platform Preferences', success,
        success ? `Set ${result.count} platforms: ${result.platformIds.join(', ')}`
                 : result.error || 'Failed to set preferences');

      if (success) {
        console.log('  → Set platforms:', result.platformIds);
        console.log('  → Duration:', result.duration, 'ms');
      }
    } catch (error) {
      log('Set Platform Preferences', false, error.message);
    }

    // Test 4: Verify preferences were actually set
    console.log('\nTest 4: Verifying preferences were set');
    try {
      const prefs = await getPlatformPreferences(page);
      const expected = ['twitter', 'facebook', 'linkedin'];

      const allSet = expected.every(p => prefs?.favorites?.includes(p));
      log('Preferences Persisted', allSet,
        allSet ? `All ${expected.length} platforms found in favorites`
                : `Missing platforms: ${expected.filter(p => !prefs?.favorites?.includes(p)).join(', ')}`);

      console.log('  → Current favorites:', prefs?.favorites);
    } catch (error) {
      log('Preferences Persisted', false, error.message);
    }

    // Test 5: Wait for DOM stabilization
    console.log('\nTest 5: Waiting for DOM stabilization');
    try {
      const stable = await waitDOMStable(page, { stableTime: 500, maxWait: 5000 });
      log('DOM Stabilization', stable, stable ? 'DOM stabilized within timeout' : 'DOM did not stabilize');
    } catch (error) {
      log('DOM Stabilization', false, error.message);
    }

    // Test 6: Add more platforms without clearing
    console.log('\nTest 6: Adding platforms without clearing existing');
    try {
      const beforePrefs = await getPlatformPreferences(page);
      const beforeCount = beforePrefs?.favorites?.length || 0;

      const result = await setPlatformPreferences(page, ['pinterest', 'instagram'], { clearExisting: false });
      const afterPrefs = await getPlatformPreferences(page);
      const afterCount = afterPrefs?.favorites?.length || 0;

      const added = result.success && afterCount > beforeCount;
      log('Add Without Clear', added,
        added ? `Added platforms, total went from ${beforeCount} to ${afterCount}`
              : 'Failed to add platforms');

      console.log('  → Before:', beforeCount, 'favorites');
      console.log('  → After:', afterCount, 'favorites');
    } catch (error) {
      log('Add Without Clear', false, error.message);
    }

    // Test 7: Disable smart ordering
    console.log('\nTest 7: Disabling smart ordering');
    try {
      const disabled = await setSmartOrdering(page, false);
      const prefs = await getPlatformPreferences(page);

      const verified = disabled && prefs?.smartOrdering === false;
      log('Disable Smart Ordering', verified,
        verified ? 'Smart ordering disabled and verified'
                  : 'Failed to disable or verify');

      console.log('  → Smart ordering enabled:', prefs?.smartOrdering);
    } catch (error) {
      log('Disable Smart Ordering', false, error.message);
    }

    // Test 8: Re-enable smart ordering
    console.log('\nTest 8: Re-enabling smart ordering');
    try {
      const enabled = await setSmartOrdering(page, true);
      const prefs = await getPlatformPreferences(page);

      const verified = enabled && prefs?.smartOrdering === true;
      log('Re-enable Smart Ordering', verified,
        verified ? 'Smart ordering enabled and verified'
                  : 'Failed to enable or verify');

      console.log('  → Smart ordering enabled:', prefs?.smartOrdering);
    } catch (error) {
      log('Re-enable Smart Ordering', false, error.message);
    }

    // Test 9: Normalize platform IDs
    console.log('\nTest 9: Testing platform ID normalization');
    try {
      const { normalizePlatformIds } = require('./change-platform-preferences');
      const inputs = ['Twitter', 'FACEBOOK', 'X', 'LinkedIn'];
      const normalized = normalizePlatformIds(inputs);

      const expected = ['twitter', 'facebook', 'twitter', 'linkedin'];
      const correct = JSON.stringify(normalized) === JSON.stringify(expected);

      log('Normalize Platform IDs', correct,
        correct ? `Correctly normalized: ${normalized.join(', ')}`
                  : `Expected ${expected.join(', ')}, got ${normalized.join(', ')}`);

      console.log('  → Input:', inputs);
      console.log('  → Normalized:', normalized);
    } catch (error) {
      log('Normalize Platform IDs', false, error.message);
    }

  } finally {
    await browser.close();
  }

  // Print summary
  RESULTS.endTime = new Date().toISOString();
  RESULTS.summary = {
    total: RESULTS.passed.length + RESULTS.failed.length,
    passed: RESULTS.passed.length,
    failed: RESULTS.failed.length
  };

  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${RESULTS.summary.total}`);
  console.log(`Passed: ${RESULTS.summary.passed}`);
  console.log(`Failed: ${RESULTS.summary.failed}`);
  console.log('');

  if (RESULTS.failed.length > 0) {
    console.log('Failed tests:');
    RESULTS.failed.forEach(f => {
      console.log(`  - ${f.test}: ${f.details}`);
    });
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const resultsPath = path.join(__dirname, 'notes', 'bf-3bb0p-test-results.json');

  // Ensure notes directory exists
  if (!fs.existsSync(path.dirname(resultsPath))) {
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  process.exit(RESULTS.summary.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
