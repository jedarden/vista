/**
 * Quick example: Using the DOM order extraction utility
 *
 * This example shows the most common usage patterns.
 */

const { chromium } = require('playwright');
const {
  extractDomOrder,
  extractDomOrderDetailed,
  verifyDomOrder
} = require('./src/utils/extract-dom-order');

async function example() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to VISTA
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.platform-card', { timeout: 5000 });

    // Example 1: Get platform order
    const order = await extractDomOrder(page);
    console.log('Platform order:', order);
    // Output: ['twitter', 'facebook', 'linkedin', ...]

    // Example 2: Get detailed information
    const details = await extractDomOrderDetailed(page);
    console.log('First 3 platforms:');
    details.slice(0, 3).forEach(item => {
      console.log(`  ${item.pid}: ${item.name}`);
    });

    // Example 3: Verify expected order
    const verification = await verifyDomOrder(page, ['twitter', 'facebook', 'linkedin']);
    if (verification.matches) {
      console.log('✓ Order is correct!');
    } else {
      console.log('✗ Order mismatch:', verification.differences);
    }

  } finally {
    await browser.close();
  }
}

// Run the example
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { example };
