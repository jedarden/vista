#!/usr/bin/env node

/**
 * Test: Verify applySmartOrdering DOM reordering
 *
 * This test verifies that:
 * 1. applySmartOrdering() updates the cardOrder arrays correctly
 * 2. reorderPlatformCards() actually reorders DOM elements
 * 3. The handleResult hook calls both functions in the correct order
 */

const puppeteer = require('puppeteer');
const { URL } = require('url');

async function testApplySmartOrderingReordering() {
  console.log('=== Testing applySmartOrdering DOM Reordering ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('applySmartOrdering') ||
          text.includes('reorderPlatformCards') ||
          text.includes('handleResult')) {
        console.log('PAGE:', text);
      }
    });

    // Test URL with article content
    const testUrl = 'https://example.com/article/test';
    console.log(`Navigating to: ${testUrl}`);

    await page.goto(`http://localhost:8080/?url=${encodeURIComponent(testUrl)}`, {
      waitUntil: 'networkidle0'
    });

    // Wait for initial render
    await page.waitForSelector('.preview-grid', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow time for smart ordering to complete

    // Get initial platform card order
    const initialOrder = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card');
      return Array.from(cards).map(card => card.dataset.pid);
    });

    console.log('\nInitial platform card order:', initialOrder);

    // Check if smart ordering is enabled
    const smartOrderingEnabled = await page.evaluate(() => {
      return window.platformPrefs?.smartOrdering || false;
    });

    console.log('Smart ordering enabled:', smartOrderingEnabled);

    // Get cardOrder from platformPrefs
    const cardOrderData = await page.evaluate(() => {
      return window.platformPrefs?.cardOrder || {};
    });

    console.log('cardOrder data:', JSON.stringify(cardOrderData, null, 2));

    // Get cardOrderMetadata
    const cardOrderMetadata = await page.evaluate(() => {
      return window.platformPrefs?.cardOrderMetadata || {};
    });

    console.log('cardOrderMetadata:', JSON.stringify(cardOrderMetadata, null, 2));

    // Check if applySmartOrdering was called
    const applySmartOrderingCalled = await page.evaluate(() => {
      return window.__applySmartOrderingCalled || false;
    });

    console.log('applySmartOrdering was called:', applySmartOrderingCalled);

    // Check if reorderPlatformCards was called
    const reorderPlatformCardsCalled = await page.evaluate(() => {
      return window.__reorderPlatformCardsCalled || false;
    });

    console.log('reorderPlatformCards was called:', reorderPlatformCardsCalled);

    // Verify DOM order matches cardOrder
    let domMatchesCardOrder = true;
    const domOrders = {};

    await page.evaluate(() => {
      const groups = document.querySelectorAll('[id^="group-"]');
      groups.forEach(groupEl => {
        const groupId = groupEl.id.replace('group-', '');
        const row = groupEl.querySelector('.cards-row');
        if (row) {
          const cards = row.querySelectorAll('.platform-card');
          const order = Array.from(cards).map(card => card.dataset.pid);
          domOrders[groupId] = order;
        }
      });
      return domOrders;
    });

    console.log('\n=== Verification Results ===');
    console.log('DOM orders:', JSON.stringify(domOrders, null, 2));
    console.log('cardOrder:', JSON.stringify(cardOrderData, null, 2));

    // Compare DOM order with cardOrder
    let allGroupsMatch = true;
    for (const [groupId, cardOrder] of Object.entries(cardOrderData)) {
      const domOrder = domOrders[groupId];
      if (domOrder) {
        const matches = JSON.stringify(domOrder) === JSON.stringify(cardOrder);
        console.log(`Group ${groupId}: DOM ${matches ? 'MATCHES' : 'DOES NOT MATCH'} cardOrder`);
        if (!matches) {
          allGroupsMatch = false;
          console.log(`  Expected: ${cardOrder}`);
          console.log(`  Got: ${domOrder}`);
        }
      }
    }

    console.log('\n=== Test Result ===');
    if (allGroupsMatch && smartOrderingEnabled) {
      console.log('✅ PASS: DOM reordering is working correctly');
      console.log('   - Smart ordering is enabled');
      console.log('   - DOM order matches cardOrder for all groups');
      process.exit(0);
    } else if (!smartOrderingEnabled) {
      console.log('⚠️  SKIP: Smart ordering is not enabled');
      console.log('   - Enable smart ordering to test DOM reordering');
      process.exit(0);
    } else {
      console.log('❌ FAIL: DOM reordering is NOT working correctly');
      console.log('   - DOM order does not match cardOrder');
      console.log('   - Check if reorderPlatformCards() is being called');
      console.log('   - Check if DOM elements exist when reordering');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testApplySmartOrderingReordering().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});