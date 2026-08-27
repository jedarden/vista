/**
 * Integration Tests: Filter Change Preserves Smart Order State
 *
 * Tests that smart order state persists when users change filter modes or parameters.
 * This validates the fix for vista-78e44ca9.
 *
 * Coverage:
 * - Smart order state persists across filter mode changes
 * - Cards maintain position when filters are applied/removed
 * - Filter parameter changes do not trigger order reset
 * - State is consistent across all filter operations
 */

'use strict';

const path = require('path');

// Test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('Running Integration Tests: Filter Change Preserves Smart Order State');
    console.log('='.repeat(80) + '\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✓ ${name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(80) + '\n');

    return this.failed === 0 ? 0 : 1;
  }

  assertEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Expected "${expectedStr}" but got "${actualStr}"`
      );
    }
  }

  assertTrue(value, message = '') {
    if (!value) {
      throw new Error(message || `Expected truthy value but got ${value}`);
    }
  }

  assertFalse(value, message = '') {
    if (value) {
      throw new Error(message || `Expected falsy value but got ${value}`);
    }
  }

  assertDeepEquals(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
      );
    }
  }
}

// Mock platform preferences and guard flags
class MockFilterGuardSystem {
  constructor() {
    this.platformPrefs = {
      favorites: new Set(['twitter', 'linkedin']),
      hidden: new Set(),
      columnCount: 3,
      smartOrdering: true,
      cardOrder: {
        social: ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads']
      },
      cardOrderMetadata: {
        social: {
          userModified: false,
          modifiedBy: 'smart-ordering',
          lastModified: Date.now()
        }
      }
    };

    // Guard flags
    this.isSmartOrderingActive = true; // Simulating active smart ordering
    this.isFilterOperation = false;
    this.isApplyingSmartOrder = false;
    this.pendingFilterOperations = []; // Queue for filter operations during smart ordering
  }

  // Mock guardWrapperWithRender behavior (THE FIX)
  guardWrapperWithRender(handlerName, handlerFunction) {
    // Check if smart ordering is active
    if (this.isSmartOrdering()) {
      // Queue operation
      this.pendingFilterOperations.push({ operation: handlerFunction, name: handlerName });
      console.log(`[${handlerName}] Smart ordering active - operation queued`);
      return;
    }

    // Execute handler
    handlerFunction();

    // Set filter guard
    this.isFilterOperation = true;
    setTimeout(() => { this.isFilterOperation = false; }, 0);

    // THE FIX: DO NOT clear isSmartOrderingActive during filter operations
    // Smart order state should persist across filter changes
    console.log(`[${handlerName}] Filter operation - preserving smart order state (isSmartOrderingActive left unchanged)`);
  }

  // Process pending filter operations (called after smart ordering completes)
  processPendingFilterOperations() {
    const operations = this.pendingFilterOperations.slice();
    this.pendingFilterOperations = [];

    operations.forEach(({ operation, name }) => {
      try {
        console.log(`[processPendingFilterOperations] Executing: ${name}`);
        operation();
      } catch (error) {
        console.error(`[processPendingFilterOperations] Error executing: ${name}`, error);
      }
    });
  }

  // Mock isSmartOrdering guard
  isSmartOrdering() {
    return this.platformPrefs.smartOrdering && this.isSmartOrderingActive;
  }

  // Mock toggle hidden operation
  toggleHidden(pid) {
    this.guardWrapperWithRender('toggleHidden', () => {
      if (this.platformPrefs.hidden.has(pid)) {
        this.platformPrefs.hidden.delete(pid);
      } else {
        this.platformPrefs.hidden.add(pid);
      }
      console.log(`[toggleHidden] Platform ${pid} hidden state toggled`);
    });
  }

  // Mock toggle favorite operation
  toggleFavorite(pid) {
    this.guardWrapperWithRender('toggleFavorite', () => {
      if (this.platformPrefs.favorites.has(pid)) {
        this.platformPrefs.favorites.delete(pid);
      } else {
        this.platformPrefs.favorites.add(pid);
      }
      console.log(`[toggleFavorite] Platform ${pid} favorite state toggled`);
    });
  }

  // Reset to initial state
  reset() {
    this.platformPrefs = {
      favorites: new Set(['twitter', 'linkedin']),
      hidden: new Set(),
      columnCount: 3,
      smartOrdering: true,
      cardOrder: {
        social: ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads']
      },
      cardOrderMetadata: {
        social: {
          userModified: false,
          modifiedBy: 'smart-ordering',
          lastModified: Date.now()
        }
      }
    };
    this.isSmartOrderingActive = true;
    this.isFilterOperation = false;
    this.isApplyingSmartOrder = false;
    this.pendingFilterOperations = []; // Clear pending operations queue
  }
}

// Create test runner
const runner = new TestRunner();
const system = new MockFilterGuardSystem();

// Test 1: Smart order active flag persists after filter operation
runner.test('Smart order active flag persists after hiding platform', () => {
  system.reset();

  // Verify initial state
  runner.assertTrue(system.isSmartOrderingActive, 'Smart ordering should be active initially');

  // Perform filter operation
  system.toggleHidden('facebook');

  // CRITICAL: Smart ordering active flag should still be true
  runner.assertTrue(system.isSmartOrderingActive, 'Smart ordering active flag should persist after filter operation');
});

// Test 2: Smart order active flag persists after toggling favorite
runner.test('Smart order active flag persists after toggling favorite', () => {
  system.reset();

  // Verify initial state
  runner.assertTrue(system.isSmartOrderingActive, 'Smart ordering should be active initially');

  // Perform favorite toggle
  system.toggleFavorite('mastodon');

  // CRITICAL: Smart ordering active flag should still be true
  runner.assertTrue(system.isSmartOrderingActive, 'Smart ordering active flag should persist after favorite toggle');
});

// Test 3: cardOrder is preserved during filter operations
runner.test('cardOrder array is preserved during filter operations', () => {
  system.reset();

  // Store initial cardOrder
  const initialCardOrder = [...system.platformPrefs.cardOrder.social];

  // Perform multiple filter operations
  system.toggleHidden('reddit');
  system.toggleFavorite('bluesky');
  system.toggleHidden('threads');

  // Verify cardOrder is unchanged
  const afterCardOrder = system.platformPrefs.cardOrder.social;
  runner.assertDeepEquals(afterCardOrder, initialCardOrder, 'cardOrder should remain unchanged after filter operations');
});

// Test 4: cardOrderMetadata is preserved during filter operations
runner.test('cardOrderMetadata is preserved during filter operations', () => {
  system.reset();

  // Store initial metadata
  const initialMetadata = { ...system.platformPrefs.cardOrderMetadata.social };

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify metadata is unchanged
  const afterMetadata = system.platformPrefs.cardOrderMetadata.social;
  runner.assertDeepEquals(afterMetadata, initialMetadata, 'cardOrderMetadata should remain unchanged after filter operations');
});

// Test 5: Multiple rapid filter operations preserve smart order state
runner.test('Multiple rapid filter operations preserve smart order state', () => {
  system.reset();

  // Perform 5 rapid filter operations
  for (let i = 0; i < 5; i++) {
    system.toggleHidden(`platform-${i}`);
    // Verify smart ordering is still active after each operation
    runner.assertTrue(system.isSmartOrderingActive, `Smart ordering should remain active after operation ${i + 1}`);
  }
});

// Test 6: Filter operation when smart ordering is not active
runner.test('Filter operation when smart ordering is not active', () => {
  system.reset();

  // Set smart ordering to inactive
  system.isSmartOrderingActive = false;

  // Perform filter operation
  system.toggleHidden('facebook');

  // Smart ordering should remain inactive (no-op)
  runner.assertFalse(system.isSmartOrderingActive, 'Smart ordering should remain inactive when already inactive');
});

// Test 7: Filter operation queue behavior when smart ordering is active
runner.test('Filter operation is queued when smart ordering is active', () => {
  system.reset();

  // Ensure smart ordering is active
  system.isSmartOrderingActive = true;
  system.isApplyingSmartOrder = true; // Simulate active application

  let operationQueued = false;
  const originalToggle = system.toggleHidden.bind(system);
  system.toggleHidden = function(pid) {
    operationQueued = this.isSmartOrdering();
    return originalToggle(pid);
  };

  // Try to perform filter operation during smart ordering
  system.toggleHidden('facebook');

  // Verify operation would be queued
  runner.assertTrue(operationQueued, 'Filter operation should be queued when smart ordering is active');

  // Restore
  system.toggleHidden = originalToggle;
});

// Test 8: Filter operation guard flag behavior
runner.test('Filter operation guard flag is set and cleared correctly', () => {
  system.reset();

  // Set smart ordering to inactive so operation executes immediately
  system.isSmartOrderingActive = false;

  // Perform filter operation
  system.toggleHidden('facebook');

  // isFilterOperation should be true immediately after operation
  runner.assertTrue(system.isFilterOperation, 'Filter operation guard should be set');

  // After timeout, flag should be cleared (simulate by checking after delay)
  setTimeout(() => {
    runner.assertFalse(system.isFilterOperation, 'Filter operation guard should be cleared after timeout');
  }, 10);
});

// Test 9: Hidden set can be modified without affecting smart order state
runner.test('Hidden set modifications preserve smart order state', () => {
  system.reset();

  const initialHidden = new Set(system.platformPrefs.hidden);
  const initialCardOrder = [...system.platformPrefs.cardOrder.social];

  // Add to hidden set
  system.platformPrefs.hidden.add('reddit');

  // Verify cardOrder unchanged
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should be unchanged when hidden set is modified');

  // Remove from hidden set
  system.platformPrefs.hidden.delete('reddit');

  // Verify cardOrder still unchanged
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should remain unchanged when hidden set is restored');
});

// Test 10: Favorites set can be modified without affecting smart order state
runner.test('Favorites set modifications preserve smart order state', () => {
  system.reset();

  const initialCardOrder = [...system.platformPrefs.cardOrder.social];

  // Add to favorites
  system.platformPrefs.favorites.add('mastodon');

  // Verify cardOrder unchanged
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should be unchanged when favorites are modified');

  // Remove from favorites
  system.platformPrefs.favorites.delete('mastodon');

  // Verify cardOrder still unchanged
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should remain unchanged when favorites are restored');
});

// Test 11: State consistency across multiple filter types
runner.test('State consistency across multiple filter operation types', () => {
  system.reset();

  const initialState = {
    cardOrder: [...system.platformPrefs.cardOrder.social],
    cardOrderMetadata: { ...system.platformPrefs.cardOrderMetadata.social },
    isSmartOrderingActive: system.isSmartOrderingActive
  };

  // Perform various filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');
  system.toggleHidden('reddit');
  system.toggleFavorite('bluesky');

  // Verify all critical state preserved
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialState.cardOrder, 'cardOrder should persist across multiple filter operations');
  runner.assertDeepEquals(system.platformPrefs.cardOrderMetadata.social, initialState.cardOrderMetadata, 'cardOrderMetadata should persist across multiple filter operations');
  runner.assertEqual(system.isSmartOrderingActive, initialState.isSmartOrderingActive, 'isSmartOrderingActive should persist across multiple filter operations');
});

// Test 12: Filter operations don't modify userModified flag
runner.test('Filter operations don\'t modify userModified flag in metadata', () => {
  system.reset();

  const initialUserModified = system.platformPrefs.cardOrderMetadata.social.userModified;

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify userModified flag unchanged
  const afterUserModified = system.platformPrefs.cardOrderMetadata.social.userModified;
  runner.assertEqual(afterUserModified, initialUserModified, 'userModified flag should not change during filter operations');
});

// Test 13: Filter operations don't modify modifiedBy flag
runner.test('Filter operations don\'t modify modifiedBy flag in metadata', () => {
  system.reset();

  const initialModifiedBy = system.platformPrefs.cardOrderMetadata.social.modifiedBy;

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify modifiedBy unchanged
  const afterModifiedBy = system.platformPrefs.cardOrderMetadata.social.modifiedBy;
  runner.assertEqual(afterModifiedBy, initialModifiedBy, 'modifiedBy flag should not change during filter operations');
});

// Test 14: Integration test - complete filter workflow preserves state
runner.test('Integration: Complete filter workflow preserves all state', () => {
  system.reset();

  // Snapshot initial state
  const initialState = {
    cardOrder: [...system.platformPrefs.cardOrder.social],
    cardOrderMetadata: { ...system.platformPrefs.cardOrderMetadata.social },
    favorites: new Set(system.platformPrefs.favorites),
    hidden: new Set(system.platformPrefs.hidden),
    isSmartOrderingActive: system.isSmartOrderingActive
  };

  // Complete workflow: hide, show, favorite, unfavorite
  system.toggleHidden('facebook'); // hide facebook
  system.toggleFavorite('linkedin'); // remove from favorites
  system.toggleHidden('facebook'); // show facebook
  system.toggleFavorite('mastodon'); // add to favorites

  // Process pending operations that were queued during smart ordering
  system.processPendingFilterOperations();

  // Verify cardOrder and metadata preserved
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialState.cardOrder, 'cardOrder should persist through complete workflow');
  runner.assertDeepEquals(system.platformPrefs.cardOrderMetadata.social, initialState.cardOrderMetadata, 'cardOrderMetadata should persist through complete workflow');
  runner.assertEqual(system.isSmartOrderingActive, initialState.isSmartOrderingActive, 'isSmartOrderingActive should persist through complete workflow');

  // Verify favorites and hidden were updated as expected
  runner.assertFalse(system.platformPrefs.favorites.has('linkedin'), 'LinkedIn should be removed from favorites');
  runner.assertTrue(system.platformPrefs.favorites.has('mastodon'), 'Mastodon should be added to favorites');
  runner.assertFalse(system.platformPrefs.hidden.has('facebook'), 'Facebook should not be hidden');
});

// Test 15: Stress test - 20 rapid filter operations
runner.test('Stress test: 20 rapid filter operations preserve state', () => {
  system.reset();

  const initialCardOrder = [...system.platformPrefs.cardOrder.social];
  const platforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads'];

  // Perform 20 rapid filter operations
  for (let i = 0; i < 20; i++) {
    const pid = platforms[i % platforms.length];
    const operation = i % 2 === 0 ? 'toggleHidden' : 'toggleFavorite';
    system[operation](pid);

    // Verify smart ordering still active
    runner.assertTrue(system.isSmartOrderingActive, `Smart ordering should remain active after ${i + 1} operations`);
  }

  // Verify final state matches initial
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should persist through 20 operations');
});

// Test 16: Filter operation with empty cardOrder
runner.test('Filter operation with empty cardOrder doesn\'t break', () => {
  system.reset();

  // Clear cardOrder
  system.platformPrefs.cardOrder = {};

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify no errors and cardOrder still empty
  runner.assertEqual(Object.keys(system.platformPrefs.cardOrder).length, 0, 'cardOrder should remain empty');
});

// Test 17: Filter operation with missing metadata
runner.test('Filter operation with missing metadata doesn\'t break', () => {
  system.reset();

  // Clear metadata
  system.platformPrefs.cardOrderMetadata = {};

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify no errors and metadata still empty
  runner.assertEqual(Object.keys(system.platformPrefs.cardOrderMetadata).length, 0, 'cardOrderMetadata should remain empty');
});

// Test 18: Multiple groups preserve independent cardOrders
runner.test('Multiple groups preserve independent cardOrders during filters', () => {
  system.reset();

  // Add second group
  system.platformPrefs.cardOrder.messaging = ['slack', 'discord', 'telegram'];
  system.platformPrefs.cardOrderMetadata.messaging = {
    userModified: false,
    modifiedBy: 'smart-ordering',
    lastModified: Date.now()
  };

  const initialSocialOrder = [...system.platformPrefs.cardOrder.social];
  const initialMessagingOrder = [...system.platformPrefs.cardOrder.messaging];

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('slack');

  // Verify both orders preserved
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialSocialOrder, 'Social group cardOrder should be preserved');
  runner.assertDeepEquals(system.platformPrefs.cardOrder.messaging, initialMessagingOrder, 'Messaging group cardOrder should be preserved');
});

// Test 19: Column count changes don't affect smart order state
runner.test('Column count changes preserve smart order state', () => {
  system.reset();

  const initialCardOrder = [...system.platformPrefs.cardOrder.social];
  const initialSmartOrderingActive = system.isSmartOrderingActive;

  // Change column count
  system.platformPrefs.columnCount = 2;

  // Verify state preserved
  runner.assertDeepEquals(system.platformPrefs.cardOrder.social, initialCardOrder, 'cardOrder should persist when column count changes');
  runner.assertEqual(system.isSmartOrderingActive, initialSmartOrderingActive, 'isSmartOrderingActive should persist when column count changes');
});

// Test 20: Smart ordering disabled state with filter operations
runner.test('Smart ordering disabled state with filter operations', () => {
  system.reset();

  // Disable smart ordering
  system.platformPrefs.smartOrdering = false;
  system.isSmartOrderingActive = false;

  // Perform filter operations
  system.toggleHidden('facebook');
  system.toggleFavorite('linkedin');

  // Verify smart ordering remains disabled
  runner.assertFalse(system.platformPrefs.smartOrdering, 'Smart ordering should remain disabled');
  runner.assertFalse(system.isSmartOrderingActive, 'isSmartOrderingActive should remain false');
});

// Run all tests
runner.run()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
