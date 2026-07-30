/**
 * Minimal Reproduction Case for Card Ordering Race Condition
 *
 * This script demonstrates the race condition that occurs when renderPreviews()
 * is called during smart ordering, before the fix was applied.
 *
 * Usage:
 *   node test-race-condition-minimal-reproduction.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Race Condition Minimal Reproduction ===\n');

// Read the app.js file
const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

console.log('✓ Loaded app.js\n');

// ============================================================================
// SIMULATION: The Race Condition
// ============================================================================

console.log('--- SIMULATING RACE CONDITION (BUGGY VERSION) ---\n');

class RaceConditionSimulator {
  constructor() {
    this.reset();
  }

  reset() {
    this.isApplyingSmartOrder = false;
    this.pendingRenderData = null;
    this.platformPrefs = {
      cardOrder: null,
      smartOrdering: true
    };
    this.domElements = [];
    this.renderCalls = [];
    this.reorderCalls = [];
  }

  log(message, state = null) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const flagState = this.isApplyingSmartOrder ? '🟢' : '🔴';
    console.log(`[${timestamp}] ${flagState} ${message}`);
    if (state) {
      console.log(`         cardOrder: ${JSON.stringify(state.cardOrder)}`);
      console.log(`         DOM: ${JSON.stringify(state.dom)}`);
    }
  }

  // BUGGY VERSION: Flag cleared before reordering
  applySmartOrderingSafe_BUGGY() {
    if (this.isApplyingSmartOrder) {
      this.log('Already applying - queueing');
      return;
    }

    this.isApplyingSmartOrder = true;
    this.log('applySmartOrderingSafe_BUGGY: Set flag = true', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // Simulate applySmartOrdering updating cardOrder
    this.platformPrefs.cardOrder = ['linkedin', 'twitter', 'facebook'];
    this.log('applySmartOrdering: Updated cardOrder', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // BUGGY: Clear flag BEFORE reordering
    this.isApplyingSmartOrder = false;
    this.log('⚠️  CLEARED FLAG TOO EARLY!', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // Simulate delay that creates race window
    setTimeout(() => {
      this.reorderPlatformCards();
    }, 10);
  }

  // FIXED VERSION: Flag cleared after reordering
  applySmartOrderingSafe_FIXED() {
    if (this.isApplyingSmartOrder) {
      this.log('Already applying - queueing');
      return;
    }

    this.isApplyingSmartOrder = true;
    this.log('applySmartOrderingSafe_FIXED: Set flag = true', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // Simulate applySmartOrdering updating cardOrder
    this.platformPrefs.cardOrder = ['linkedin', 'twitter', 'facebook'];
    this.log('applySmartOrdering: Updated cardOrder', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // FIXED: Reorder BEFORE clearing flag
    this.reorderPlatformCards();

    // Clear flag in finally block
    this.isApplyingSmartOrder = false;
    this.log('✓ Cleared flag AFTER reordering', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });
  }

  reorderPlatformCards() {
    this.reorderCalls.push(new Date());
    this.log('reorderPlatformCards: Moving DOM elements', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // Simulate DOM reordering
    if (this.platformPrefs.cardOrder) {
      this.domElements = [...this.platformPrefs.cardOrder];
    }
  }

  renderPreviews(data) {
    this.renderCalls.push(new Date());

    if (this.isApplyingSmartOrder) {
      this.pendingRenderData = data;
      this.log('renderPreviews: QUEUED (flag is true)');
      return;
    }

    this.log('renderPreviews: Creating NEW DOM elements', {
      cardOrder: this.platformPrefs.cardOrder,
      dom: this.domElements
    });

    // BUG: If called during race window, creates new DOM while reorderPlatformCards is moving old DOM
    if (this.platformPrefs.cardOrder) {
      this.domElements = [...this.platformPrefs.cardOrder];
    }
  }
}

// ============================================================================
// TEST 1: Buggy Version - Race Condition Occurs
// ============================================================================

console.log('TEST 1: Buggy Version (flag cleared before reordering)\n');

const sim1 = new RaceConditionSimulator();
sim1.domElements = ['twitter', 'facebook', 'linkedin'];
sim1.log('Initial state', {
  cardOrder: sim1.platformPrefs.cardOrder,
  dom: sim1.domElements
});

// Start smart ordering
sim1.applySmartOrderingSafe_BUGGY();

// Call renderPreviews during race window (10ms delay)
setTimeout(() => {
  sim1.renderPreviews('test-data');
}, 5);

// Wait for everything to complete
setTimeout(() => {
  console.log('\n--- FINAL STATE (BUGGY) ---');
  console.log(`cardOrder: ${JSON.stringify(sim1.platformPrefs.cardOrder)}`);
  console.log(`DOM: ${JSON.stringify(sim1.domElements)}`);
  console.log(`Render calls: ${sim1.renderCalls.length}`);
  console.log(`Reorder calls: ${sim1.reorderCalls.length}`);

  // Check for race condition
  const renderDuringReorder = sim1.renderCalls.some(renderCall =>
    sim1.reorderCalls.some(reorderCall =>
      renderCall > reorderCall && renderCall < new Date(reorderCall.getTime() + 100)
    )
  );

  if (renderDuringReorder) {
    console.log('\n❌ RACE CONDITION DETECTED!');
    console.log('   renderPreviews() executed during reordering window');
  } else {
    console.log('\n✅ No race condition (timing dependent)');
  }

  // ============================================================================
  // TEST 2: Fixed Version - Race Condition Prevented
  // ============================================================================

  console.log('\n\n=== TEST 2: Fixed Version (flag cleared after reordering) ===\n');

  const sim2 = new RaceConditionSimulator();
  sim2.domElements = ['twitter', 'facebook', 'linkedin'];
  sim2.log('Initial state', {
    cardOrder: sim2.platformPrefs.cardOrder,
    dom: sim2.domElements
  });

  // Start smart ordering
  sim2.applySmartOrderingSafe_FIXED();

  // Try to call renderPreviews during operation (should be queued)
  setTimeout(() => {
    sim2.renderPreviews('test-data');
  }, 5);

  // Wait for everything to complete
  setTimeout(() => {
    console.log('\n--- FINAL STATE (FIXED) ---');
    console.log(`cardOrder: ${JSON.stringify(sim2.platformPrefs.cardOrder)}`);
    console.log(`DOM: ${JSON.stringify(sim2.domElements)}`);
    console.log(`pendingRenderData: ${sim2.pendingRenderData ? 'queued' : 'null'}`);
    console.log(`Render calls: ${sim2.renderCalls.length}`);
    console.log(`Reorder calls: ${sim2.reorderCalls.length}`);

    if (sim2.pendingRenderData) {
      console.log('\n✅ RACE CONDITION PREVENTED!');
      console.log('   renderPreviews() was queued because flag was still true');
    } else {
      console.log('\n❌ Fix did not queue the render');
    }

    // ============================================================================
    // TEST 3: Verify Actual Implementation
    // ============================================================================

    console.log('\n\n=== TEST 3: Verifying Actual Implementation ===\n');

    // Check if the fix is present in the code
    const hasFinallyBlock = /}\s*finally\s*{[\s\S]*?isApplyingSmartOrder\s*=\s*false/.test(appJs);
    const hasReorderInTry = /try\s*{[\s\S]*?applySmartOrdering\(\)[\s\S]*?reorderPlatformCards\(\)[\s\S]*?}\s*finally/.test(appJs);
    const hasRenderQueue = /if\s*\(\s*isApplyingSmartOrder\s*\)\s*{[\s\S]*?pendingRenderData\s*=\s*data/.test(appJs);
    const hasPendingRenderProcess = /if\s*\(\s*pendingRenderData\s*\)[\s\S]*?renderPreviews\(dataToRender\)/.test(appJs);

    console.log('Implementation checks:');
    console.log(`${hasFinallyBlock ? '✅' : '❌'} Flag cleared in finally block`);
    console.log(`${hasReorderInTry ? '✅' : '❌'} reorderPlatformCards() inside try block`);
    console.log(`${hasRenderQueue ? '✅' : '❌'} renderPreviews() queues when flag is true`);
    console.log(`${hasPendingRenderProcess ? '✅' : '❌'} pendingRenderData processed after flag cleared`);

    if (hasFinallyBlock && hasReorderInTry && hasRenderQueue && hasPendingRenderProcess) {
      console.log('\n✅✅✅ ALL FIXES PRESENT ✅✅✅');
      console.log('The race condition has been properly fixed in the code!');
    } else {
      console.log('\n❌ Some fixes are missing - race condition may still occur!');
    }

    console.log('\n=== SUMMARY ===\n');
    console.log('The race condition occurs when:');
    console.log('1. isApplyingSmartOrder flag is cleared BEFORE reorderPlatformCards() completes');
    console.log('2. renderPreviews() is called during this window');
    console.log('3. renderPreviews() sees flag=false and cardOrder updated');
    console.log('4. renderPreviews() creates new DOM while reorderPlatformCards() moves old DOM');
    console.log('5. Result: DOM conflict, duplicate cards, wrong order');
    console.log('\nThe fix prevents this by:');
    console.log('1. Keeping flag=true during entire operation (try/finally)');
    console.log('2. reorderPlatformCards() inside try block (flag still true)');
    console.log('3. renderPreviews() checks flag and queues if true');
    console.log('4. Processing queued renders after flag is cleared');
  }, 50);
}, 50);
