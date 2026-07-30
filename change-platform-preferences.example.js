/**
 * Platform Preference Change Utility - Usage Example
 *
 * This file demonstrates how to use the change-platform-preferences utility
 * to programmatically modify platform preferences in the VISTA application.
 *
 * Run this example:
 *   node change-platform-preferences.example.js
 */

const { chromium } = require('playwright');
const {
  setPlatformPreferences,
  waitDOMStable,
  getPlatformPreferences,
  setSmartOrdering
} = require('./change-platform-preferences');

const BASE_URL = 'http://localhost:3000';

/**
 * Example 1: Basic usage - Set preferred platforms
 */
async function example1_basicUsage() {
  console.log('\n=== Example 1: Basic Platform Preference Setting ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to VISTA
    await page.goto(BASE_URL);
    console.log('Navigated to VISTA');

    // Set platform preferences
    const result = await setPlatformPreferences(page, ['twitter', 'linkedin', 'facebook']);

    if (result.success) {
      console.log(`✅ Successfully set ${result.count} platforms as favorites:`);
      result.platformIds.forEach(pid => console.log(`   - ${pid}`));
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }

    // Wait for DOM to stabilize
    await waitDOMStable(page);
    console.log('DOM stabilized');

  } finally {
    await browser.close();
  }
}

/**
 * Example 2: Get current preferences
 */
async function example2_getPreferences() {
  console.log('\n=== Example 2: Getting Current Preferences ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL);

    // Get current preferences
    const prefs = await getPlatformPreferences(page);

    if (prefs) {
      console.log('Current preferences:');
      console.log(`  Favorites: ${prefs.favorites.join(', ') || 'none'}`);
      console.log(`  Hidden: ${prefs.hidden.join(', ') || 'none'}`);
      console.log(`  Column count: ${prefs.columnCount}`);
      console.log(`  Smart ordering: ${prefs.smartOrdering ? 'enabled' : 'disabled'}`);
    } else {
      console.log('Could not retrieve preferences');
    }

  } finally {
    await browser.close();
  }
}

/**
 * Example 3: Disable smart ordering
 */
async function example3_disableSmartOrdering() {
  console.log('\n=== Example 3: Disabling Smart Ordering ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL);

    // Disable smart ordering
    const success = await setSmartOrdering(page, false);

    if (success) {
      console.log('✅ Smart ordering disabled');
    } else {
      console.log('❌ Failed to disable smart ordering');
    }

  } finally {
    await browser.close();
  }
}

/**
 * Example 4: Advanced - Set preferences without clearing existing
 */
async function example4_preserveExisting() {
  console.log('\n=== Example 4: Add to Existing Preferences ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL);

    // Get current preferences first
    const beforePrefs = await getPlatformPreferences(page);
    console.log('Before:', beforePrefs?.favorites || []);

    // Add new platforms without clearing existing ones
    const result = await setPlatformPreferences(
      page,
      ['pinterest', 'instagram'],
      { clearExisting: false }
    );

    if (result.success) {
      console.log(`✅ Added platforms. Total favorites: ${result.count}`);
    }

    // Get updated preferences
    const afterPrefs = await getPlatformPreferences(page);
    console.log('After:', afterPrefs?.favorites || []);

  } finally {
    await browser.close();
  }
}

/**
 * Example 5: Full workflow - Search and customize
 */
async function example5_fullWorkflow() {
  console.log('\n=== Example 5: Full Workflow with Search ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate and search
    await page.goto(BASE_URL);
    console.log('Navigated to VISTA');

    // Enter a URL to analyze
    await page.fill('#urlInput', 'https://example.com');
    console.log('Entered URL');

    // Click analyze button
    const analyzeBtn = page.locator('#analyzeBtn, button[type="submit"]');
    await analyzeBtn.click();
    console.log('Clicked analyze button');

    // Wait for results to load
    await page.waitForSelector('#previewGrid', { timeout: 15000 });
    console.log('Results loaded');

    // Customize platform preferences
    console.log('Setting platform preferences...');
    const prefResult = await setPlatformPreferences(
      page,
      ['twitter', 'facebook', 'linkedin', 'threads'],
      { triggerReordering: true }
    );

    if (prefResult.success) {
      console.log(`✅ Set ${prefResult.count} preferred platforms`);
    }

    // Wait for DOM to update
    await waitDOMStable(page, { stableTime: 2000 });
    console.log('DOM stabilized with new preferences');

    // Get final state
    const finalPrefs = await getPlatformPreferences(page);
    console.log('Final preferences:', finalPrefs);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/preference-change-result.png', fullPage: true });
    console.log('Screenshot saved');

  } finally {
    await browser.close();
  }
}

/**
 * Example 6: Error handling
 */
async function example6_errorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL);

    // Try with invalid platform names
    const result = await setPlatformPreferences(page, ['invalid_platform', 'another_fake']);

    if (!result.success) {
      console.log(`Expected error occurred: ${result.error}`);
      console.log('Attempted platform IDs:', result.platformIds);
    } else {
      console.log('Unexpected success - some platforms may have been added');
    }

  } finally {
    await browser.close();
  }
}

/**
 * Main runner
 */
async function main() {
  const example = process.argv[2] || '1';

  const examples = {
    '1': example1_basicUsage,
    '2': example2_getPreferences,
    '3': example3_disableSmartOrdering,
    '4': example4_preserveExisting,
    '5': example5_fullWorkflow,
    '6': example6_errorHandling
  };

  const selected = examples[example];
  if (!selected) {
    console.log(`Invalid example number. Choose from: ${Object.keys(examples).join(', ')}`);
    process.exit(1);
  }

  try {
    await selected();
    console.log('\n✅ Example completed successfully\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  example1_basicUsage,
  example2_getPreferences,
  example3_disableSmartOrdering,
  example4_preserveExisting,
  example5_fullWorkflow,
  example6_errorHandling
};
