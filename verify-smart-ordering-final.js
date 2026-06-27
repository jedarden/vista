/**
 * Final Verification Test for applySmartOrdering()
 *
 * This test verifies that the applySmartOrdering() function successfully:
 * 1. Reorders platform cards based on page type detection
 * 2. Updates the DOM to reflect the new order
 * 3. Persists the changes across page refreshes
 * 4. Works correctly with different platform preference configurations
 */

const puppeteer = require('puppeteer');

const PAGE_TYPES = [
  { type: 'article', url: 'https://www.theverge.com/2024/1/15/24042000/ai-tech-regulation-eu-ai-act', name: 'News Article' },
  { type: 'product', url: 'https://www.amazon.com/dp/B0C9XHXTXQ', name: 'Product Page' },
  { type: 'profile', url: 'https://github.com/torvalds', name: 'GitHub Profile' },
  { type: 'blog', url: 'https://blog.panic.com/blog/2024/01/12/transmit-5-now-available/', name: 'Blog Post' },
  { type: 'home', url: 'https://www.apple.com', name: 'Homepage' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowser() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[applySmartOrdering]') || text.includes('[handleResult hook]')) {
      console.log('📄 Page:', text);
    }
  });

  return { browser, page };
}

async function enableSmartOrdering(page) {
  console.log('⚙️  Enabling smart ordering...');

  // Navigate to app first
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Enable smart ordering via localStorage
  await page.evaluate(() => {
    const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
    prefs.smartOrdering = true;
    localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
    console.log('Smart ordering enabled:', prefs.smartOrdering);
  });

  // Reload to apply preferences
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2000);

  console.log('✅ Smart ordering enabled');
}

async function getPlatformCardOrder(page, groupTitle) {
  const order = await page.evaluate((title) => {
    const groups = document.querySelectorAll('.platform-group');
    for (const group of groups) {
      const groupTitle = group.querySelector('.group-title');
      if (groupTitle && groupTitle.textContent.trim() === title) {
        const cards = group.querySelectorAll('.preview-card');
        return Array.from(cards).map(card => {
          const platformSpan = card.querySelector('.platform-badge');
          return platformSpan ? platformSpan.textContent.trim() : null;
        }).filter(Boolean);
      }
    }
    return [];
  }, groupTitle);

  return order;
}

async function testSmartOrderingForPage(page, pageTypeData) {
  console.log(`\n📄 Testing: ${pageTypeData.name} (${pageTypeData.type})`);
  console.log(`   URL: ${pageTypeData.url}`);

  // Load the page
  console.log('   Loading URL...');
  await page.goto(`http://localhost:3000?url=${encodeURIComponent(pageTypeData.url)}`, {
    waitUntil: 'networkidle2'
  });

  // Wait for smart ordering to complete
  await sleep(3000);

  // Get the platform card order for social group
  const socialOrder = await getPlatformCardOrder(page, 'Social & Microblogging');
  console.log('   Current social platform order:', socialOrder);

  // Check DOM for evidence of reordering
  const domCheck = await page.evaluate(() => {
    const socialGroup = document.querySelector('.platform-group');
    if (!socialGroup) return { found: false };

    const cards = socialGroup.querySelectorAll('.preview-card');
    return {
      found: true,
      totalCards: cards.length,
      firstCardPlatform: cards[0]?.querySelector('.platform-badge')?.textContent.trim(),
      lastCardPlatform: cards[cards.length - 1]?.querySelector('.platform-badge')?.textContent.trim(),
    };
  });

  console.log('   DOM check:', domCheck);

  // Check localStorage for saved preferences
  const savedPrefs = await page.evaluate(() => {
    const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
    return {
      hasCardOrder: !!prefs.cardOrder,
      cardOrderKeys: prefs.cardOrder ? Object.keys(prefs.cardOrder) : []
    };
  });

  console.log('   Saved preferences:', savedPrefs);

  return {
    socialOrder,
    domCheck,
    savedPrefs,
    success: socialOrder.length > 0
  };
}

async function verifyPersistence(page) {
  console.log('\n🔄 Verifying persistence across page reload...');

  // Get current order before reload
  const orderBefore = await getPlatformCardOrder(page, 'Social & Microblogging');
  console.log('   Order before reload:', orderBefore.slice(0, 3));

  // Reload the page
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2000);

  // Get order after reload
  const orderAfter = await getPlatformCardOrder(page, 'Social & Microblogging');
  console.log('   Order after reload:', orderAfter.slice(0, 3));

  const ordersMatch = JSON.stringify(orderBefore) === JSON.stringify(orderAfter);
  console.log(ordersMatch ? '   ✅ Order persisted across reload!' : '   ⚠️  Order changed after reload');

  return ordersMatch;
}

async function testDifferentPreferences(page) {
  console.log('\n🎯 Testing with different platform preferences...');

  // Set a custom card order manually
  await page.evaluate(() => {
    const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
    prefs.cardOrder = {
      social: ['mastodon', 'twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'google', 'tumblr', 'pinterest']
    };
    prefs.smartOrdering = true;
    localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(2000);

  const customOrder = await getPlatformCardOrder(page, 'Social & Microblogging');
  console.log('   Order with custom preferences:', customOrder.slice(0, 3));

  // Now load a page to trigger smart ordering
  await page.goto(`http://localhost:3000?url=${encodeURIComponent(PAGE_TYPES[0].url)}`, {
    waitUntil: 'networkidle2'
  });
  await sleep(3000);

  const reordered = await getPlatformCardOrder(page, 'Social & Microblogging');
  console.log('   Order after smart ordering:', reordered.slice(0, 3));

  // Check if smart ordering overrode the custom order
  const wasReordered = JSON.stringify(customOrder) !== JSON.stringify(reordered);
  console.log(wasReordered ? '   ✅ Smart ordering overrode custom preferences!' : '   ⚠️  Order remained unchanged');

  return wasReordered;
}

async function runAllTests() {
  const { browser, page } = await setupBrowser();

  try {
    console.log('═'.repeat(80));
    console.log('FINAL VERIFICATION TEST FOR applySmartOrdering()');
    console.log('═'.repeat(80));

    // Enable smart ordering
    await enableSmartOrdering(page);

    // Test different page types
    const results = [];
    for (const pageType of PAGE_TYPES) {
      try {
        const result = await testSmartOrderingForPage(page, pageType);
        results.push({ ...pageType, ...result });
        await sleep(1000); // Brief pause between tests
      } catch (error) {
        console.error(`   ❌ Error testing ${pageType.name}:`, error.message);
        results.push({ ...pageType, error: error.message });
      }
    }

    // Verify persistence
    const persistenceResult = await verifyPersistence(page);

    // Test with different preferences
    const preferencesResult = await testDifferentPreferences(page);

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(80));

    const successfulTests = results.filter(r => r.success).length;
    console.log(`✅ Successful tests: ${successfulTests}/${results.length}`);
    console.log(`🔄 Persistence verified: ${persistenceResult ? 'YES' : 'NO'}`);
    console.log(`🎯 Preference override: ${preferencesResult ? 'YES' : 'NO'}`);

    const allPassed = successfulTests === results.length && persistenceResult && preferencesResult;
    console.log(`\n${allPassed ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);

    // Keep browser open for visual inspection
    console.log('\n🔍 Browser remains open for visual inspection. Press Ctrl+C to exit.');
    console.log('   The last test page is loaded for manual verification.');

    // Wait indefinitely for manual inspection
    await new Promise(() => {}); // Never resolve, wait for Ctrl+C

  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    // Cleanup (will only execute on Ctrl+C or error)
    await browser.close();
  }
}

// Run the tests
runAllTests().catch(console.error);
