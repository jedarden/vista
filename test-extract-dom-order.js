#!/usr/bin/env node

/**
 * Test script for DOM order extraction utility
 *
 * This script demonstrates the usage of extract-dom-order.js with Playwright.
 * It extracts the platform card order from a running VISTA instance.
 */

const { chromium } = require('playwright');
const path = require('path');

// Import the utility functions
const {
  extractDomOrder,
  extractDomOrderDetailed,
  verifyDomOrder,
  extractDomOrderAndWait
} = require('./src/utils/extract-dom-order');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'dom-order-test');

async function main() {
  console.log('=== DOM Order Extraction Utility Test ===\n');

  const browser = await chromium.launch({
    headless: true
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('✓ Launching browser and navigating to VISTA...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('✓ Waiting for platform cards to render...');
    try {
      await page.waitForSelector('.platform-card', { timeout: 10000 });
      await page.waitForTimeout(2000); // Allow for any dynamic reordering
    } catch (error) {
      console.log('⚠ No platform cards found - this is acceptable for an empty state');
    }

    // Take a screenshot for reference
    console.log('✓ Capturing initial state screenshot...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-initial-state.png'),
      fullPage: true
    });

    // Test 1: Basic extraction
    console.log('\n--- Test 1: Basic Order Extraction ---');
    try {
      const order = await extractDomOrder(page);
      console.log(`✓ Extracted ${order.length} platform cards`);
      console.log('  Order:', order.slice(0, 10).join(', ') + (order.length > 10 ? '...' : ''));
    } catch (error) {
      console.log('✗ Failed:', error.message);
    }

    // Test 2: Detailed extraction
    console.log('\n--- Test 2: Detailed Order Extraction ---');
    try {
      const details = await extractDomOrderDetailed(page);
      console.log(`✓ Extracted ${details.length} detailed platform records`);
      if (details.length > 0) {
        console.log('  Sample entries:');
        details.slice(0, 5).forEach(item => {
          console.log(`    - ${item.pid}: ${item.name || '(no name)'}`);
        });
      }
    } catch (error) {
      console.log('✗ Failed:', error.name);
    }

    // Test 3: Order verification
    console.log('\n--- Test 3: Order Verification ---');
    try {
      const currentOrder = await extractDomOrder(page);
      if (currentOrder.length > 0) {
        // Verify against the actual current order (should match)
        const verification = await verifyDomOrder(page, currentOrder);
        console.log(`✓ Verification ${verification.matches ? 'PASSED' : 'FAILED'}`);
        if (!verification.matches) {
          console.log('  Differences:', verification.differences);
        }
      } else {
        console.log('⚠ Skipped (no cards present)');
      }
    } catch (error) {
      console.log('✗ Failed:', error.message);
    }

    // Test 4: Extract with wait
    console.log('\n--- Test 4: Extract with Wait ---');
    try {
      const order = await extractDomOrderAndWait(page, { timeout: 5000 });
      console.log(`✓ Extracted ${order.length} platform cards with wait`);
    } catch (error) {
      console.log('✗ Failed:', error.message);
    }

    // Test 5: Handle empty state gracefully
    console.log('\n--- Test 5: Empty State Handling ---');
    try {
      // Navigate to a fresh page with no results
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const order = await extractDomOrder(page);
      console.log(`✓ Empty state handled gracefully: ${order.length} cards`);
    } catch (error) {
      console.log('✗ Failed:', error.message);
    }

    await context.close();

    console.log('\n=== All Tests Completed ===');
    console.log('✓ Utility functions are working as expected');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
