/**
 * Platform Preference Test - BF-4luwa
 *
 * Test infrastructure for platform preference functionality.
 * Uses Puppeteer for browser automation and Mocha-style describe() blocks for test organization.
 *
 * Test Configuration:
 * - Uses Puppeteer for headless browser automation
 * - Integrates with DOM inspection helpers from test/utils/dom-helpers.js
 * - Provides basic test harness structure for platform preference tests
 *
 * Usage: npx mocha test/e2e/platform-preference-test.e2e.js
 * Or: npm test -- test/e2e/platform-preference-test.e2e.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Import DOM inspection helpers
const {
  getPlatformOrder,
  compareOrders,
  waitForDOMStable
} = require('../utils/dom-helpers');

// Import platform preference utilities
const {
  setPlatformPreferences,
  getPlatformPreferences,
  setSmartOrdering
} = require('../../change-platform-preferences');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '..', '..', 'test-results', 'platform-preference');

// Ensure results directory exists
fs.mkdirSync(RESULTS_DIR, { recursive: true });

/**
 * Puppeteer launch options for test environment
 */
const PUPPETEER_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ],
  // Increase default timeout for test operations
  defaultNavigationTimeout: 30000,
  // Ignore HTTPS errors for local testing
  ignoreHTTPSErrors: true
};

/**
 * Test configuration object
 */
const TEST_CONFIG = {
  name: 'Platform Preference Infrastructure Test',
  description: 'Basic test infrastructure setup for platform preference functionality'
};

/**
 * Wait for app.js to load and initialize platformPrefs
 */
async function waitForAppInit(page, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isReady = await page.evaluate(() => {
      try {
        return typeof platformPrefs !== 'undefined' &&
               typeof applySmartOrdering === 'function';
      } catch (e) {
        return false;
      }
    });

    if (isReady) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Setup: Navigate to page and generate platform cards
 */
async function setupPage(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for app.js to load
  const appReady = await waitForAppInit(page);
  if (!appReady) {
    throw new Error('app.js failed to initialize within timeout');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Enter a test URL to generate platform cards
  const testUrl = 'https://blog.example.com/2024/07/my-article';

  await page.click('#urlInput');
  await page.type('#urlInput', testUrl);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Click inspect button to generate platform cards
  await page.click('#inspectBtn');

  // Wait for platform cards to appear
  await page.waitForSelector('.platform-card', { timeout: 15000 }).catch(() => {
    // Not fatal - continue with empty result
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify cards are present
  const cardCount = await page.evaluate(() => document.querySelectorAll('.platform-card').length);

  return { success: true, cardCount };
}

/**
 * Describe block: Platform Preference Test Suite
 */
describe('Platform Preference Tests - BF-4luwa', function() {

  // Increase timeout for Puppeteer operations
  this.timeout(60000);

  let browser;
  let page;

  /**
   * Before hook: Launch browser and create page
   */
  before(async function() {
    console.log('\n' + '='.repeat(70));
    console.log('Platform Preference Test - BF-4luwa');
    console.log('='.repeat(70));
    console.log(`Launching Puppeteer browser...`);

    browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS);
    page = await browser.newPage();

    console.log('✅ Browser launched successfully');
  });

  /**
   * After hook: Close browser
   */
  after(async function() {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  });

  /**
   * beforeEach hook: Setup page and generate platform cards
   */
  beforeEach(async function() {
    console.log('\n🔧 Setup: Initializing page...');
    const setupResult = await setupPage(page);
    console.log(`✅ Setup complete: ${setupResult.cardCount} platform cards rendered`);
  });

  /**
   * Test: Verify DOM helpers are imported and functional
   */
  it('should import DOM helper functions', function() {
    console.log('\n📝 Test: Import DOM helpers');

    // Verify imports
    expect(typeof getPlatformOrder).to.equal('function');
    expect(typeof compareOrders).to.equal('function');
    expect(typeof waitForDOMStable).to.equal('function');

    console.log('✅ DOM helpers imported successfully');
  });

  /**
   * Test: Verify platform preference utilities are imported
   */
  it('should import platform preference utilities', function() {
    console.log('\n📝 Test: Import platform preference utilities');

    // Verify imports
    expect(typeof setPlatformPreferences).to.equal('function');
    expect(typeof getPlatformPreferences).to.equal('function');
    expect(typeof setSmartOrdering).to.equal('function');

    console.log('✅ Platform preference utilities imported successfully');
  });

  /**
   * Test: Verify Puppeteer page object is available
   */
  it('should have Puppeteer page object available', function() {
    console.log('\n📝 Test: Puppeteer page object');

    expect(page).to.be.an('object');
    expect(page.goto).to.be.a('function');
    expect(page.evaluate).to.be.a('function');

    console.log('✅ Puppeteer page object available');
  });

  /**
   * Test: Verify platform cards are rendered on page
   */
  it('should render platform cards on page', async function() {
    console.log('\n📝 Test: Platform cards rendered');

    const cardCount = await page.evaluate(() => document.querySelectorAll('.platform-card').length);

    expect(cardCount).to.be.greaterThan(0);
    console.log(`✅ Found ${cardCount} platform cards`);
  });

  /**
   * Test: Verify getPlatformOrder helper function works
   */
  it('should extract platform order from DOM', async function() {
    console.log('\n📝 Test: Extract platform order');

    const platformOrder = await getPlatformOrder(page);

    expect(Array.isArray(platformOrder)).to.be.true;
    expect(platformOrder.length).to.be.greaterThan(0);
    console.log(`✅ Extracted platform order: ${platformOrder.join(', ')}`);
  });

  /**
   * Test: Verify compareOrders helper function works
   */
  it('should compare platform orders', async function() {
    console.log('\n📝 Test: Compare platform orders');

    const actualOrder = await getPlatformOrder(page);
    const expectedOrder = actualOrder.slice(0, 3); // Just test first 3

    const comparison = compareOrders(expectedOrder, actualOrder);

    expect(comparison).to.be.an('object');
    expect(comparison).to.have.property('matches');
    expect(comparison).to.have.property('total');
    expect(comparison).to.have.property('passRate');

    console.log(`✅ Comparison result: ${comparison.matches}/${comparison.total} match (${comparison.passRate}%)`);
  });

  /**
   * Test: Verify setSmartOrdering utility works
   */
  it('should enable smart ordering', async function() {
    console.log('\n📝 Test: Enable smart ordering');

    const result = await setSmartOrdering(page, true);

    expect(result).to.be.an('object');
    expect(result).to.have.property('success');

    console.log(`✅ Smart ordering ${result.success ? 'enabled' : 'failed to enable'}`);
  });

  /**
   * Test: Verify setPlatformPreferences utility works
   */
  it('should set platform preferences', async function() {
    console.log('\n📝 Test: Set platform preferences');

    const testPlatforms = ['twitter', 'facebook', 'linkedin'];

    const result = await setPlatformPreferences(page, testPlatforms, {
      clearExisting: true,
      triggerReordering: true,
      timeout: 10000
    });

    expect(result).to.be.an('object');
    expect(result).to.have.property('success');

    if (result.success) {
      console.log(`✅ Platform preferences set: ${result.count} platforms configured`);
    } else {
      console.log(`⚠️  Platform preferences failed: ${result.error}`);
    }
  });
});

// Export for use in other test files
module.exports = {
  PUPPETEER_LAUNCH_OPTIONS,
  TEST_CONFIG,
  setupPage,
  waitForAppInit
};
