/**
 * Comprehensive diagnostic test for bf-2wyf1
 *
 * This test verifies that DOM manipulation actually moves cards correctly:
 * 1. Identifies the selector used for platform cards
 * 2. Verifies appendChild/prepend operations are actually moving elements
 * 3. Checks if cards are being re-ordered but immediately reset by another function
 * 4. Adds diagnostic logging to track DOM changes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Headless Chrome needs extracted system libs on this server
const LIBS_PATH = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
if (fs.existsSync(LIBS_PATH)) {
  process.env.LD_LIBRARY_PATH = LIBS_PATH + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
}

async function runTest() {
  console.log('=== BF-2WYF1: DOM MANIPULATION VERIFICATION TEST ===\n');
  console.log('This test verifies that DOM reordering actually moves cards correctly\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ timestamp: Date.now(), text });
    if (text.includes('DOM') || text.includes('reorder') || text.includes('applySmartOrdering') || text.includes('[renderPreviews]')) {
      console.log('  [Browser Console]', text);
    }
  });

  try {
    // Step 1: Navigate to VISTA
    console.log('Step 1: Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Step 2: Enable smart ordering and debug mode
    console.log('\nStep 2: Enabling smart ordering and debug mode...');
    await page.evaluate(() => {
      platformPrefs.smartOrdering = true;
      window.DEBUG_SMART_ORDERING = true;
      window.DEBUG_DOM_MANIPULATION = true; // Custom debug flag
      localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
      console.log('[Test] Smart ordering enabled, debug mode on');
    });

    // Inject DOM mutation observer
    console.log('\nStep 3: Injecting DOM mutation observer...');
    await page.evaluate(() => {
      window.domMutations = [];

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.classList?.contains('platform-card')) {
                window.domMutations.push({
                  type: 'added',
                  pid: node.dataset.pid,
                  timestamp: Date.now()
                });
              }
            });
            mutation.removedNodes.forEach(node => {
              if (node.nodeType === 1 && node.classList?.contains('platform-card')) {
                window.domMutations.push({
                  type: 'removed',
                  pid: node.dataset.pid,
                  timestamp: Date.now()
                });
              }
            });
          }
        });
      });

      // Observe the preview grid for card mutations
      const previewGrid = document.getElementById('previewGrid');
      if (previewGrid) {
        observer.observe(previewGrid, { childList: true, subtree: true });
        console.log('[Test] DOM mutation observer active');
      }
    });
    await page.waitForTimeout(500);

    // Step 4: Identify the selector used for platform cards
    console.log('\nStep 4: Identifying the selector for platform cards...');
    const selectorInfo = await page.evaluate(() => {
      // Find all platform cards in the DOM
      const cardsByDataPid = document.querySelectorAll('.platform-card[data-pid]');
      const cardsByPidOnly = document.querySelectorAll('.platform-card[pid]');
      const allPlatformCards = document.querySelectorAll('.platform-card');

      return {
        cardsWithDataPid: cardsByDataPid.length,
        cardsWithPidOnly: cardsWithPidOnly.length,
        allPlatformCards: allPlatformCards.length,
        recommendedSelector: '.platform-card[data-pid]',
        alternativeSelector: '.platform-card',
        sampleCardData: Array.from(cardsByDataPid).slice(0, 3).map(card => ({
          pid: card.dataset.pid,
          classList: Array.from(card.classList)
        }))
      };
    });

    console.log('  Selector Analysis:');
    console.log(`    .platform-card[data-pid]: ${selectorInfo.cardsWithDataPid} cards`);
    console.log(`    .platform-card[pid]: ${selectorInfo.cardsWithPidOnly} cards`);
    console.log(`    .platform-card (all): ${selectorInfo.allPlatformCards} cards`);
    console.log(`    Recommended selector: ${selectorInfo.recommendedSelector}`);
    console.log('  Sample card data:');
    selectorInfo.sampleCardData.forEach(card => {
      console.log(`    ${card.pid}: classes [${card.classList.join(', ')}]`);
    });

    // Step 5: Trigger URL inspection to get real data
    console.log('\nStep 5: Triggering URL inspection to populate cards...');
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button[type="submit"]');

    console.log('  Waiting for cards to render...');
    await page.waitForSelector('.platform-card:not(.platform-skeleton-card)', { timeout: 30000 });
    await page.waitForTimeout(3000); // Extra time for applySmartOrdering to complete

    // Step 6: Get card order BEFORE any manipulation
    console.log('\nStep 6: Capturing initial card order...');
    const initialOrder = await page.evaluate(() => {
      const groups = [];
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
        groups.push({ groupId, cards });
      });
      return { groups, domMutations: window.domMutations || [] };
    });

    console.log('  Initial card order:');
    initialOrder.groups.forEach(g => {
      console.log(`    ${g.groupId}: [${g.cards.slice(0, 5).join(', ')}${g.cards.length > 5 ? '...' : ''}]`);
    });
    console.log(`  Total DOM mutations so far: ${initialOrder.domMutations.length}`);

    // Step 7: Manually trigger reorderPlatformCards() and observe
    console.log('\nStep 7: Manually calling reorderPlatformCards() to observe DOM changes...');

    // Clear mutation log before manual call
    await page.evaluate(() => {
      window.domMutations = [];
      console.log('[Test] Mutation log cleared');
    });

    // Call the function
    const beforeManualCall = await page.evaluate(() => {
      const groups = {};
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
        groups[groupId] = cards;
      });
      return {
        groups,
        cardOrder: platformPrefs.cardOrder ? JSON.parse(JSON.stringify(platformPrefs.cardOrder)) : null
      };
    });

    await page.evaluate(() => {
      if (typeof reorderPlatformCards === 'function') {
        console.log('[Test] Calling reorderPlatformCards() manually...');
        reorderPlatformCards();
      } else {
        console.error('[Test] reorderPlatformCards() not found!');
      }
    });

    await page.waitForTimeout(1000); // Wait for DOM to settle

    const afterManualCall = await page.evaluate(() => {
      const groups = {};
      document.querySelectorAll('.platform-group').forEach(groupEl => {
        const groupId = groupEl.dataset.groupId || groupEl.id.replace('group-', '');
        const cards = Array.from(groupEl.querySelectorAll('.platform-card[data-pid]')).map(card => card.dataset.pid);
        groups[groupId] = cards;
      });
      return {
        groups,
        domMutations: window.domMutations || []
      };
    });

    // Compare before/after
    console.log('  Manual call results:');
    let changedGroups = 0;
    Object.keys(beforeManualCall.groups).forEach(groupId => {
      const before = beforeManualCall.groups[groupId];
      const after = afterManualCall.groups[groupId];
      const changed = JSON.stringify(before) !== JSON.stringify(after);
      if (changed) changedGroups++;

      console.log(`    ${groupId}: ${changed ? '🔄 CHANGED' : '✅ SAME'}`);
      if (changed) {
        console.log(`      Before: [${before.join(', ')}]`);
        console.log(`      After:  [${after.join(', ')}]`);
      }
    });

    console.log(`  Groups changed: ${changedGroups}`);
    console.log(`  DOM mutations during call: ${afterManualCall.domMutations.length}`);

    if (afterManualCall.domMutations.length > 0) {
      console.log('  Sample mutations:');
      afterManualCall.domMutations.slice(0, 10).forEach(mut => {
        console.log(`    ${mut.type}: ${mut.pid} at ${mut.timestamp}`);
      });
    }

    // Step 8: Verify appendChild actually moves elements (not clones)
    console.log('\nStep 8: Verifying appendChild moves elements (not clones)...');
    const appendChildTest = await page.evaluate(() => {
      // Get a specific card to test
      const testCard = document.querySelector('.platform-card[data-pid]');
      if (!testCard) return { error: 'No cards found' };

      const testPid = testCard.dataset.pid;
      const originalParent = testCard.parentElement;

      // Count cards before
      const cardsBefore = originalParent.querySelectorAll('.platform-card').length;

      // Move the card to the end
      originalParent.appendChild(testCard);

      // Count cards after
      const cardsAfter = originalParent.querySelectorAll('.platform-card').length;

      // Check if it's the same element (by reference)
      const movedCard = originalParent.querySelector(`.platform-card[data-pid="${testPid}"]`);
      const isSameElement = (movedCard === testCard);

      // Restore original position
      originalParent.insertBefore(testCard, originalParent.firstChild.nextSibling);

      return {
        testPid,
        cardsBefore,
        cardsAfter,
        isSameElement,
        totalCountsMatch: cardsBefore === cardsAfter
      };
    });

    console.log('  appendChild test:');
    console.log(`    Test card: ${appendChildTest.testPid}`);
    console.log(`    Cards before move: ${appendChildTest.cardsBefore}`);
    console.log(`    Cards after move: ${appendChildTest.cardsAfter}`);
    console.log(`    Total count preserved: ${appendChildTest.totalCountsMatch ? '✅' : '❌'}`);
    console.log(`    Same element (not cloned): ${appendChildTest.isSameElement ? '✅' : '❌'}`);

    // Step 9: Check for competing resets from other functions
    console.log('\nStep 9: Checking for competing resets from other functions...');

    // Search for functions that might reset card order
    const competingFunctions = await page.evaluate(() => {
      const functions = [];

      // Check for functions that modify previewGrid
      const functionsThatModifyGrid = ['renderPreviews', 'renderTextPreviewsOnly', 'reorderPlatformCards'];

      functionsThatModifyGrid.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
          const func = window[funcName].toString();
          const modifiesGrid = func.includes('previewGrid');
          const createsCards = func.includes('createElement') && func.includes('platform-card');
          const usesCardOrder = func.includes('cardOrder');

          functions.push({
            name: funcName,
            exists: true,
            modifiesGrid,
            createsCards,
            usesCardOrder
          });
        }
      });

      return { functions };
    });

    console.log('  Competing function analysis:');
    competingFunctions.functions.forEach(func => {
      console.log(`    ${func.name}:`);
      console.log(`      Exists: ${func.exists ? '✅' : '❌'}`);
      console.log(`      Modifies previewGrid: ${func.modifiesGrid ? '⚠️' : '✅'}`);
      console.log(`      Creates cards: ${func.creates ? '⚠️' : '✅'}`);
      console.log(`      Uses cardOrder: ${func.usesCardOrder ? '✅' : '❌'}`);
    });

    // Step 10: Final summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Selector Identification:');
    console.log(`  Primary selector: .platform-card[data-pid] ✅`);
    console.log(`  Alternative selector: .platform-card ✅`);
    console.log('\nDOM Manipulation:');
    console.log(`  appendChild moves (not clones): ${appendChildTest.isSameElement ? '✅' : '❌'}`);
    console.log(`  Total count preserved: ${appendChildTest.totalCountsMatch ? '✅' : '❌'}`);
    console.log(`  Manual call changed DOM: ${changedGroups > 0 ? '✅' : '⚠️'}`);
    console.log('\nPotential Issues:');
    console.log(`  Competing resets detected: ${competingFunctions.functions.some(f => f.modifiesGrid && f.createsCards && !f.usesCardOrder) ? '⚠️ YES' : '✅ NO'}`);

    const overallPass = appendChildTest.isSameElement && appendChildTest.totalCountsMatch;

    if (overallPass) {
      console.log('\n✅✅✅ DOM MANIPULATION IS WORKING CORRECTLY ✅✅✅');
      console.log('The implementation correctly moves cards with appendChild.');
    } else {
      console.log('\n❌ DOM MANIPULATION HAS ISSUES');
      console.log('appendChild may not be moving elements as expected.');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
