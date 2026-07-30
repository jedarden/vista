/**
 * Puppeteer Configuration and Test Structure
 *
 * This file sets up the Puppeteer configuration and test structure
 * with proper lifecycle hooks and configuration constants.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ─── Configuration Constants ───────────────────────────────────────────────────────

/**
 * Base URL for the VISTA application
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Directory for test results and screenshots
 */
const RESULTS_DIR = path.join(__dirname, '../test-results', 'puppeteer');

/**
 * Puppeteer Launch Options
 *
 * Configuration object for Puppeteer browser launch with:
 * - Headless mode for CI/CD environments
 * - Sandbox settings for containerized environments
 * - Performance and stability optimizations
 */
const PUPPETEER_LAUNCH_OPTIONS = {
  /**
   * Headless mode
   * Set to 'new' for the new headless mode (Chrome >= 112)
   * Set to true for legacy headless mode
   * Set to false for headed mode (useful for debugging)
   */
  headless: process.env.HEADLESS !== 'false' ? 'new' : false,

  /**
   * Additional launch arguments
   */
  args: [
    '--no-sandbox',              // Required for running in Docker/containers
    '--disable-setuid-sandbox',  // Additional sandbox security disable for containers
    '--disable-dev-shm-usage',   // Overcome limited resource problems in Docker
    '--disable-gpu',              // GPU hardware acceleration isn't needed
    '--no-first-run',             // Skip first-run tasks
    '--no-default-browser-check', // Disable default browser check
    '--disable-extensions',       // Disable extensions
  ],

  /**
   * Directory for user data (optional, for persistent sessions)
   * Commented out by default for clean sessions
   */
  // userDataDir: path.join(__dirname, '../test-results', 'puppeteer-profile'),

  /**
   * Timeout for browser launch (in milliseconds)
   */
  timeout: 30000,

  /**
   * Protocol options
   */
  protocolTimeout: 30000,
};

/**
 * Default viewport configuration
 */
const DEFAULT_VIEWPORT = {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
};

/**
 * Navigation options
 */
const NAVIGATION_OPTIONS = {
  waitUntil: 'networkidle2',
  timeout: 30000,
};

// ─── Test Suite Setup ─────────────────────────────────────────────────────────────

/**
 * Browser instance for the test suite
 * @type {import('puppeteer').Browser}
 */
let browser;

/**
 * Active page instance
 * @type {import('puppeteer').Page}
 */
let page;

/**
 * Setup hook - runs before all tests
 * Launches browser and creates results directory
 */
async function before() {
  console.log('Setting up Puppeteer test environment...');

  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Launch browser with configured options
  browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS);
  console.log(`Browser launched (headless: ${PUPPETEER_LAUNCH_OPTIONS.headless})`);

  // Create new page with default viewport
  page = await browser.newPage();
  await page.setViewport(DEFAULT_VIEWPORT);

  // Setup console logging for debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`  [Browser Console Error] ${text}`);
    } else if (type === 'warning') {
      console.warn(`  [Browser Console Warning] ${text}`);
    }
  });

  // Setup page error handling
  page.on('pageerror', error => {
    console.error(`  [Browser Page Error] ${error.message}`);
  });

  console.log('Puppeteer test environment ready\n');
}

/**
 * Teardown hook - runs after all tests
 * Closes browser and cleans up resources
 */
async function after() {
  console.log('\nTearing down Puppeteer test environment...');

  if (page && !page.isClosed()) {
    await page.close();
    console.log('Page closed');
  }

  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }

  console.log('Puppeteer test environment cleaned up');
}

/**
 * Setup hook for each test
 * Creates a fresh page for each test
 */
async function beforeEach() {
  if (!browser) {
    throw new Error('Browser not initialized. Call before() first.');
  }

  page = await browser.newPage();
  await page.setViewport(DEFAULT_VIEWPORT);
}

/**
 * Teardown hook for each test
 * Closes the page after each test
 */
async function afterEach() {
  if (page && !page.isClosed()) {
    await page.close();
  }
}

// ─── Test Suite Definition ───────────────────────────────────────────────────────

/**
 * Describe block for Puppeteer test suite
 *
 * Usage with testing frameworks (Mocha/Jest):
 *
 * describe('Puppeteer Test Suite', function() {
 *   this.timeout(60000); // Increase timeout for Puppeteer tests
 *
 *   before(async () => await before());
 *   after(async () => await after());
 *   beforeEach(async () => await beforeEach());
 *   afterEach(async () => await afterEach());
 *
 *   it('should navigate to base URL', async () => {
 *     await page.goto(BASE_URL, NAVIGATION_OPTIONS);
 *     const title = await page.title();
 *     assert(title.includes('VISTA'));
 *   });
 * });
 */
function describe(suiteName, callback) {
  console.log(`\n📋 Test Suite: ${suiteName}`);
  console.log('─'.repeat(60));

  // For standalone usage without a test framework
  if (typeof callback === 'function') {
    callback({
      before,
      after,
      beforeEach,
      afterEach,
      it: (testName, testFn) => {
        console.log(`  Test: ${testName}`);
        return testFn();
      }
    });
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────────

/**
 * Navigate to a URL with the configured options
 * @param {string} url - URL to navigate to
 * @param {object} options - Navigation options (overrides defaults)
 */
async function navigateTo(url, options = {}) {
  const mergedOptions = { ...NAVIGATION_OPTIONS, ...options };
  await page.goto(url, mergedOptions);
}

/**
 * Take a screenshot and save to results directory
 * @param {string} filename - Screenshot filename
 * @param {object} options - Screenshot options
 */
async function screenshot(filename, options = {}) {
  const filepath = path.join(RESULTS_DIR, filename);
  await page.screenshot({ path: filepath, ...options });
  console.log(`  📸 Screenshot saved: ${filename}`);
  return filepath;
}

/**
 * Wait for a selector to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {object} options - Wait options
 */
async function waitForSelector(selector, options = {}) {
  const defaultOptions = { timeout: 10000, visible: true };
  const mergedOptions = { ...defaultOptions, ...options };
  return await page.waitForSelector(selector, mergedOptions);
}

/**
 * Execute JavaScript in the browser context
 * @param {Function|string} pageFunction - Function to execute
 * @param {...any} args - Arguments to pass to the function
 */
async function evaluate(pageFunction, ...args) {
  return await page.evaluate(pageFunction, ...args);
}

// ─── Export for use in test files ─────────────────────────────────────────────────

module.exports = {
  // Configuration
  PUPPETEER_LAUNCH_OPTIONS,
  BASE_URL,
  RESULTS_DIR,
  DEFAULT_VIEWPORT,
  NAVIGATION_OPTIONS,

  // Lifecycle hooks
  before,
  after,
  beforeEach,
  afterEach,

  // Test suite
  describe,

  // Helper functions
  navigateTo,
  screenshot,
  waitForSelector,
  evaluate,

  // Browser and page access (for advanced usage)
  getBrowser: () => browser,
  getPage: () => page,
};

// ─── Standalone Execution (for direct node execution) ───────────────────────────

if (require.main === module) {
  (async () => {
    try {
      // Run setup
      await before();

      // Example test
      console.log('Running example test...');
      await navigateTo(BASE_URL);
      const title = await page.title();
      console.log(`Page title: ${title}`);

      // Take screenshot
      await screenshot('homepage.png');

      // Run teardown
      await after();

      console.log('\n✅ Test completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      await after();
      process.exit(1);
    }
  })();
}
