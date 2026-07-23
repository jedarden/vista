/**
 * Test to verify bf-7sa4s: DOM reordering based on cardOrder
 *
 * This test verifies:
 * 1. applySmartOrdering() updates cardOrder
 * 2. renderPreviews() uses cardOrder to reorder DOM elements
 * 3. Platform cards appear in correct visual order
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Headless Chrome needs extracted system libs on this server
const LIBS_PATH = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
if (fs.existsSync(LIBS_PATH)) {
  process.env.LD_LIBRARY_PATH = LIBS_PATH + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
}

async function runTest() {
  console.log('=== bf-7sa4s: DOM REORDERING VERIFICATION TEST ===\n');

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
    if (text.includes('applySmartOrdering') || text.includes('cardOrder') || text.includes('renderPreviews')) {
      console.log('  [Browser Console]', text);
    }
  });

  try {
    // Step 1: Navigate to VISTA
    console.log('Step 1: Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Step 2: Enable smart ordering
    console.log('\nStep 2: Enabling smart ordering...');
    await page.evaluate(() => {
      if (typeof platformPrefs !== 'undefined') {
        platformPrefs.smartOrdering = true;
        localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
        console.log('[Test] Smart ordering enabled');
      }
    });
    await page.waitForTimeout(500);

    // Step 3: Trigger URL inspection
    console.log('\nStep 3: Triggering URL inspection (article type)...');
    await page.fill('input[type="url"]', 'https://example.com/article/test');
    await page.click('button[type="submit"]');

    console.log('  Waiting for inspection to complete...');
    await page.waitForSelector('.platform-card:not(.platform-skeleton-card)', { timeout: 30000 });
    await page.waitForTimeout(3000); // Extra time for applySmartOrdering

    // Step 4: Check if applySmartOrdering was called
    console.log('\nStep 4: Checking if applySmartOrdering was called...');
    const hasFunctionCall = logs.some(l => l.includes('[applySmartOrdering]'));
    const hasReordering = logs.some(l => l.includes('[applySmartOrdering] ===== REORDERING PLATFORMS ====='));

    console.log('  Function called:', hasFunctionCall ? '✅' : '❌');
    console.log('  Reordering occurred:', hasReordering ? '✅' : '❌');

    if (!hasFunctionCall) {
      throw new Error('applySmartOrdering was not called!');
    }

    // Step 5: Get cardOrder state
    console.log('\nStep 5: Checking cardOrder state...');
    const cardOrderState = await page.evaluate(() => {
      if (!platformPrefs.cardOrder) {
        return { exists: false };
      }
      const result = { exists: true, groups: {} };
      Object.keys(platformPrefs.cardOrder).forEach(gid => {
        result.groups[gid] = [...platformPrefs.cardOrder[gid]];
      });
      return result;
    });

    if (cardOrderState.exists) {
      console.log('  cardOrder exists: ✅');
      Object.keys(cardOrderState.groups).forEach(gid => {
        console.log(`    ${gid}: ${cardOrderState.groups[gid].slice(0, 3).join(', ')}...`);
      });
    } else {
      console.log('  cardOrder exists: ❌');
    }

    // Step 6: Get actual DOM order
    console.log('\nStep 6: Getting actual DOM order...');
    const domState = await page.evaluate(() => {
      const groups = [];
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]'))
          .map(card => card.dataset.pid);
        groups.push({ groupId, cards });
      });
      return groups;
    });

    console.log('  DOM order by group:');
    domState.forEach(g => {
      console.log(`    ${g.groupId}: ${g.cards.slice(0, 3).join(', ')}...`);
    });

    // Step 7: Verify DOM matches cardOrder
    console.log('\nStep 7: Verifying DOM order matches cardOrder...');
    let allMatch = true;
    const mismatches = [];

    domState.forEach(group => {
      const expectedOrder = cardOrderState.groups?.[group.groupId];
      if (!expectedOrder) {
        console.log(`  ${group.groupId}: ⚠️  No cardOrder entry`);
        return;
      }

      // Compare the actual DOM order with expected cardOrder
      const matches = JSON.stringify(group.cards) === JSON.stringify(expectedOrder);
      if (matches) {
        console.log(`  ${group.groupId}: ✅ DOM matches cardOrder`);
      } else {
        console.log(`  ${group.groupId}: ❌ DOM does NOT match cardOrder`);
        console.log(`    Expected: ${expectedOrder.slice(0, 5).join(', ')}`);
        console.log(`    Got:      ${group.cards.slice(0, 5).join(', ')}`);
        allMatch = false;
        mismatches.push({ groupId: group.groupId, expected: expectedOrder, actual: group.cards });
      }
    });

    // Step 8: Manual verification - call renderPreviews directly
    console.log('\nStep 8: Manual renderPreviews call test...');
    await page.evaluate(() => {
      if (typeof currentData !== 'undefined' && typeof renderPreviews === 'function') {
        renderPreviews(currentData);
      }
    });
    await page.waitForTimeout(1000);

    const afterManualRender = await page.evaluate(() => {
      const groups = [];
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]'))
          .map(card => card.dataset.pid);
        groups.push({ groupId, cards });
      });
      return groups;
    });

    const manualStillMatches = afterManualRender.every(g => {
      const expected = cardOrderState.groups?.[g.groupId];
      return expected && JSON.stringify(g.cards) === JSON.stringify(expected);
    });

    console.log('  Manual renderPreviews still respects cardOrder:', manualStillMatches ? '✅' : '❌');

    // Final summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('applySmartOrdering called:', hasFunctionCall ? '✅' : '❌');
    console.log('cardOrder updated:', cardOrderState.exists ? '✅' : '❌');
    console.log('DOM matches cardOrder:', allMatch ? '✅' : '❌');
    console.log('Manual render respects cardOrder:', manualStillMatches ? '✅' : '❌');

    const overallPass = hasFunctionCall && cardOrderState.exists && allMatch && manualStillMatches;

    if (overallPass) {
      console.log('\n✅✅✅ bf-7sa4s DOM REORDERING IS COMPLETE ✅✅✅');
    } else {
      console.log('\n❌ bf-7sa4s DOM REORDERING HAS ISSUES');
      if (mismatches.length > 0) {
        console.log('\nMismatches found:');
        mismatches.forEach(m => {
          console.log(`  ${m.groupId}:`);
          console.log(`    Expected: ${m.expected.slice(0, 3).join(', ')}...`);
          console.log(`    Got:      ${m.actual.slice(0, 3).join(', ')}...`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
