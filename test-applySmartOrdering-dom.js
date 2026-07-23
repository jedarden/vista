/**
 * Comprehensive test for applySmartOrdering() DOM reordering
 *
 * This test verifies:
 * 1. applySmartOrdering() function exists and is callable
 * 2. The function modifies PLATFORM_GROUPS and platformPrefs.cardOrder
 * 3. renderPreviews() uses the updated order to reorder DOM cards
 * 4. The reordering is visible in the actual DOM
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Headless Chrome needs extracted system libs on this server
const LIBS_PATH = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
if (fs.existsSync(LIBS_PATH)) {
  process.env.LD_LIBRARY_PATH = LIBS_PATH + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
}

async function runTest() {
  console.log('=== COMPREHENSIVE applySmartOrdering DOM REORDERING TEST ===\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('applySmartOrdering') || text.includes('handleResult') || text.includes('smartOrdering')) {
      console.log('  [Browser Console]', text);
    }
  });

  try {
    // Step 1: Navigate to VISTA
    console.log('Step 1: Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Step 2: Check if applySmartOrdering function exists
    console.log('\nStep 2: Checking if applySmartOrdering function exists...');
    const functionCheck = await page.evaluate(() => {
      return {
        exists: typeof applySmartOrdering === 'function',
        hasWindowApply: typeof window.applySmartOrdering === 'function',
        hasPLATFORM_GROUPS: typeof PLATFORM_GROUPS !== 'undefined',
        hasPlatformPrefs: typeof platformPrefs !== 'undefined'
      };
    });

    console.log('  Function exists:', functionCheck.exists ? '✅' : '❌');
    console.log('  window.applySmartOrdering:', functionCheck.hasWindowApply ? '✅' : '❌');
    console.log('  PLATFORM_GROUPS:', functionCheck.hasPLATFORM_GROUPS ? '✅' : '❌');
    console.log('  platformPrefs:', functionCheck.hasPlatformPrefs ? '✅' : '❌');

    if (!functionCheck.exists) {
      throw new Error('applySmartOrdering function does not exist!');
    }

    // Step 3: Enable smart ordering and debug mode
    console.log('\nStep 3: Enabling smart ordering and debug mode...');
    await page.evaluate(() => {
      platformPrefs.smartOrdering = true;
      window.DEBUG_SMART_ORDERING = true;
      localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
      console.log('[Test] Smart ordering enabled, debug mode on');
    });
    await page.waitForTimeout(500);

    // Step 4: Get initial PLATFORM_GROUPS state before reordering
    console.log('\nStep 4: Getting initial PLATFORM_GROUPS state...');
    const initialState = await page.evaluate(() => {
      return {
        platformGroups: PLATFORM_GROUPS.map(g => ({
          id: g.id,
          title: g.title,
          platforms: [...g.platforms]
        })),
        cardOrder: platformPrefs.cardOrder
      };
    });

    console.log('  Initial PLATFORM_GROUPS:');
    initialState.platformGroups.forEach(g => {
      console.log(`    ${g.title} [${g.id}]:`, g.platforms.slice(0, 3).join(', ') + '...');
    });

    // Step 5: Trigger a URL inspection to get real data
    console.log('\nStep 5: Triggering URL inspection to get data...');
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button[type="submit"]');

    console.log('  Waiting for inspection to complete...');
    await page.waitForSelector('.platform-card:not(.platform-skeleton-card)', { timeout: 30000 });
    await page.waitForTimeout(3000); // Extra time for applySmartOrdering to run

    // Step 6: Check if applySmartOrdering was called
    console.log('\nStep 6: Checking if applySmartOrdering was called...');
    const hasFunctionCall = logs.some(l => l.includes('[applySmartOrdering]'));
    const hasComplete = logs.some(l => l.includes('[applySmartOrdering] ===== FUNCTION COMPLETE'));
    const hasReordering = logs.some(l => l.includes('[applySmartOrdering] ===== REORDERING PLATFORMS ====='));

    console.log('  Function called:', hasFunctionCall ? '✅' : '❌');
    console.log('  Function completed:', hasComplete ? '✅' : '❌');
    console.log('  Reordering occurred:', hasReordering ? '✅' : '❌');

    // Step 7: Check PLATFORM_GROUPS state after inspection
    console.log('\nStep 7: Getting PLATFORM_GROUPS state after inspection...');
    const afterState = await page.evaluate(() => {
      return {
        platformGroups: PLATFORM_GROUPS.map(g => ({
          id: g.id,
          title: g.title,
          platforms: [...g.platforms]
        })),
        cardOrder: platformPrefs.cardOrder ? JSON.parse(JSON.stringify(platformPrefs.cardOrder)) : null
      };
    });

    console.log('  After PLATFORM_GROUPS:');
    afterState.platformGroups.forEach(g => {
      console.log(`    ${g.title} [${g.id}]:`, g.platforms.slice(0, 3).join(', ') + '...');
    });

    if (afterState.cardOrder) {
      console.log('  cardOrder updated:');
      Object.keys(afterState.cardOrder).forEach(gid => {
        console.log(`    ${gid}:`, afterState.cardOrder[gid].slice(0, 3).join(', ') + '...');
      });
    }

    // Step 8: Get actual DOM order
    console.log('\nStep 8: Getting actual DOM card order...');
    const domOrder = await page.evaluate(() => {
      const groups = [];
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
        groups.push({ groupId, cards });
      });
      return groups;
    });

    console.log('  DOM order by group:');
    domOrder.forEach(g => {
      console.log(`    ${g.groupId}:`, g.cards.slice(0, 3).join(', ') + '...');
    });

    // Step 9: Verify DOM matches cardOrder
    console.log('\nStep 9: Verifying DOM order matches cardOrder...');
    let allMatch = true;
    domOrder.forEach(group => {
      const expectedOrder = afterState.cardOrder?.[group.groupId];
      if (expectedOrder) {
        // Compare first few cards
        const domCards = group.cards.slice(0, expectedOrder.length);
        const matches = JSON.stringify(domCards) === JSON.stringify(expectedOrder);
        console.log(`  ${group.groupId}:`, matches ? '✅' : '❌');
        if (!matches) {
          console.log(`    Expected: ${expectedOrder.slice(0, 5).join(', ')}`);
          console.log(`    Got: ${domCards.slice(0, 5).join(', ')}`);
          allMatch = false;
        }
      }
    });

    // Step 10: Manually call applySmartOrdering and verify DOM updates
    console.log('\nStep 10: Manually calling applySmartOrdering...');
    const beforeManual = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card[data-pid]');
      return Array.from(cards).map(card => card.dataset.pid);
    });

    await page.evaluate(() => {
      if (typeof applySmartOrdering === 'function') {
        applySmartOrdering();
      }
    });

    await page.waitForTimeout(1000);

    const afterManual = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card[data-pid]');
      return Array.from(cards).map(card => card.dataset.pid);
    });

    const manualChanged = JSON.stringify(beforeManual) !== JSON.stringify(afterManual);
    console.log('  Manual call changed DOM:', manualChanged ? '✅' : '⚠️');

    // Final summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Function exists:', functionCheck.exists ? '✅' : '❌');
    console.log('Function called:', hasFunctionCall ? '✅' : '❌');
    console.log('Function completed:', hasComplete ? '✅' : '❌');
    console.log('cardOrder updated:', afterState.cardOrder ? '✅' : '❌');
    console.log('DOM matches cardOrder:', allMatch ? '✅' : '❌');
    console.log('Manual call works:', manualChanged ? '✅' : '⚠️');

    const overallPass = functionCheck.exists && hasFunctionCall && afterState.cardOrder && allMatch;

    if (overallPass) {
      console.log('\n✅✅✅ applySmartOrdering DOM REORDERING IS WORKING ✅✅✅');
    } else {
      console.log('\n❌ applySmartOrdering DOM REORDERING HAS ISSUES');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
