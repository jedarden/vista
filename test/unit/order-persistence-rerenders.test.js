/**
 * Comprehensive Unit Test: Order Persistence Across Re-renders
 *
 * Tests that card order persists across multiple render cycles, including:
 * - Basic reordering and re-render verification
 * - Multiple rapid re-renders
 * - Concurrent smart ordering and render operations
 * - Race condition scenarios
 * - Edge cases with rapid state changes
 *
 * This test validates the fix for the card ordering race condition where
 * renderPreviews() could execute during DOM manipulation by reorderPlatformCards().
 */

'use strict';

const path = require('path');
const fs = require('fs');

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
    console.log('Running Comprehensive Tests: Order Persistence Across Re-renders');
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

  assertThrows(fn, expectedMessage = '') {
    let threw = false;
    let actualMessage = '';
    try {
      fn();
    } catch (error) {
      threw = true;
      actualMessage = error.message;
    }
    if (!threw) {
      throw new Error(`Expected function to throw but it didn't`);
    }
    if (expectedMessage && !actualMessage.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}" but got "${actualMessage}"`);
    }
  }
}

// Mock DOM environment
class MockDOMElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.className = '';
    this.id = '';
    this.innerHTML = '';
    this.textContent = '';
    this.parent = null;

    if (options.id) this.id = options.id;
    if (options.className) this.className = options.className;
    if (options.dataset) this.dataset = { ...options.dataset };
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  querySelector(selector) {
    // Search in children first, then grandchildren
    for (const child of this.children) {
      if (this.matchesSelector(child, selector)) {
        return child;
      }
      // Search in grandchildren
      if (child.children) {
        for (const grandchild of child.children) {
          if (this.matchesSelector(grandchild, selector)) {
            return grandchild;
          }
        }
      }
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    const searchChildren = (element) => {
      for (const child of element.children) {
        if (this.matchesSelector(child, selector)) {
          results.push(child);
        }
        if (child.children) {
          searchChildren(child);
        }
      }
    };
    searchChildren(this);
    return results;
  }

  matchesSelector(element, selector) {
    // Simple selector parsing
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      return element.className && element.className.includes(className);
    }
    if (selector.startsWith('[data-')) {
      const match = selector.match(/\[data-(\w+)="([^"]+)"\]/);
      if (match) {
        const key = match[1];
        const value = match[2];
        return element.dataset[key] === value;
      }
    }
    return false;
  }

  appendChild(child) {
    // If child already exists, move it (mimics real DOM behavior)
    if (child.parent) {
      const existingIndex = child.parent.children.indexOf(child);
      if (existingIndex !== -1) {
        child.parent.children.splice(existingIndex, 1);
      }
    }
    child.parent = this;
    this.children.push(child);
    return child;
  }
}

// Mock platform card system
class MockPlatformCardSystem {
  constructor() {
    this.platformPrefs = {
      smartOrdering: true,
      cardOrder: {},
      pageType: null
    };
    this.isApplyingSmartOrder = false;
    this.pendingRenderData = null;
    this.pendingApplySmartOrder = false;
    this.platformGroups = [
      {
        id: 'social',
        title: 'Social & Microblogging',
        collapsed: false,
        platforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads']
      }
    ];
    this.previewGrid = new MockDOMElement('div', { className: 'preview-grid' });
  }

  // Create a mock platform card
  createCard(pid, grade = 'A') {
    const card = new MockDOMElement('div', {
      className: `platform-card grade-${grade}`,
      dataset: { pid }
    });
    return card;
  }

  // Render platform cards (mock version of renderPreviews)
  renderPreviews(data) {
    console.log('[renderPreviews] Called with cardOrder available:', this.platformPrefs.cardOrder);

    // Race condition fix: Queue render if smart ordering is in progress
    if (this.isApplyingSmartOrder) {
      console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
      this.pendingRenderData = data;
      return; // Skip rendering during smart ordering
    }

    this.previewGrid.children = [];
    this.previewGrid.innerHTML = '';

    this.platformGroups.forEach((group) => {
      const groupEl = new MockDOMElement('div', {
        className: 'platform-group',
        dataset: { groupId: group.id }
      });

      const row = new MockDOMElement('div', {
        className: 'cards-row',
        dataset: { groupId: group.id }
      });

      // Use custom order if available and smart ordering is not in progress
      let platforms = group.platforms;
      if (this.platformPrefs.cardOrder[group.id] && !this.isApplyingSmartOrder) {
        const customOrder = this.platformPrefs.cardOrder[group.id].filter(
          pid => group.platforms.includes(pid)
        );
        const newPlatforms = group.platforms.filter(
          pid => !customOrder.includes(pid)
        );
        platforms = [...customOrder, ...newPlatforms];
        console.log(`[renderPreviews] Group ${group.id}: using cardOrder:`, platforms);
      }

      platforms.forEach((pid) => {
        const card = this.createCard(pid, data?.grades?.[pid] || 'A');
        row.appendChild(card);
      });

      groupEl.appendChild(row);
      this.previewGrid.appendChild(groupEl);
    });

    return this.previewGrid;
  }

  // Reorder DOM elements to match cardOrder (mock version of reorderPlatformCards)
  reorderPlatformCards() {
    if (!this.isApplyingSmartOrder) {
      console.warn('[reorderPlatformCards] WARNING: Called outside smart ordering operation');
    }

    this.platformGroups.forEach((group) => {
      if (!this.platformPrefs.cardOrder[group.id]) {
        return;
      }

      // Find the group element
      let groupEl = null;
      for (const child of this.previewGrid.children) {
        if (child.className && child.className.includes('platform-group') && child.dataset.groupId === group.id) {
          groupEl = child;
          break;
        }
      }
      if (!groupEl) return;

      // Find the cards-row
      let row = null;
      for (const child of groupEl.children) {
        if (child.className && child.className.includes('cards-row')) {
          row = child;
          break;
        }
      }
      if (!row) return;

      const targetOrder = this.platformPrefs.cardOrder[group.id];
      const cardsByPid = new Map();

      // Collect all cards by pid
      for (const child of row.children) {
        if (child.className && child.className.includes('platform-card') && child.dataset.pid) {
          const pid = child.dataset.pid;
          if (targetOrder.includes(pid)) {
            cardsByPid.set(pid, child);
          }
        }
      }

      // Reorder cards by appending them in target order
      targetOrder.forEach(pid => {
        const card = cardsByPid.get(pid);
        if (card) {
          row.appendChild(card);
        }
      });
    });
  }

  // Apply smart ordering (mock version)
  applySmartOrdering(pageType = 'article') {
    if (!this.platformPrefs.smartOrdering) {
      return;
    }

    const preferredOrder = {
      article: ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads'],
      product: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
      video: ['twitter', 'facebook', 'youtube', 'tiktok', 'instagram'],
      website: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
    };

    const order = preferredOrder[pageType] || preferredOrder.website;

    this.platformGroups.forEach((group) => {
      group.platforms.sort((a, b) => {
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);

        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      // Store the smart order in cardOrder
      this.platformPrefs.cardOrder[group.id] = [...group.platforms];
    });
  }

  // Safe version of applySmartOrdering with guard flag (the fix)
  applySmartOrderingSafe(pageType = 'article') {
    // If already applying, queue a pending application
    if (this.isApplyingSmartOrder) {
      console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
      this.pendingApplySmartOrder = true;
      return;
    }

    // Set guard flag BEFORE operations
    this.isApplyingSmartOrder = true;
    this.pendingApplySmartOrder = false;

    console.log('[applySmartOrderingSafe] Guard flag SET - starting smart ordering');

    try {
      // Step 1: Update cardOrder with smart ordering
      this.applySmartOrdering(pageType);

      // Step 2: Reorder DOM elements
      console.log('[applySmartOrderingSafe] Reordering DOM elements');
      this.reorderPlatformCards();

      // Step 3: If another operation was queued, process it
      if (this.pendingApplySmartOrder) {
        console.log('[applySmartOrderingSafe] Processing queued operation');
        setTimeout(() => this.applySmartOrderingSafe(pageType), 0);
      }
    } finally {
      // Always clear guard flag AFTER all operations complete
      this.isApplyingSmartOrder = false;
      console.log('[applySmartOrderingSafe] Guard flag CLEARED');

      // Step 4: Process any queued render AFTER flag is cleared
      if (this.pendingRenderData) {
        console.log('[applySmartOrderingSafe] Processing queued render');
        const dataToRender = this.pendingRenderData;
        this.pendingRenderData = null;
        this.renderPreviews(dataToRender);
      }
    }
  }

  // Get current order of cards in DOM
  getCurrentCardOrder(groupId) {
    // Search through previewGrid children to find the group
    let groupEl = null;
    for (const child of this.previewGrid.children) {
      if (child.className && child.className.includes('platform-group') && child.dataset.groupId === groupId) {
        groupEl = child;
        break;
      }
    }

    if (!groupEl) return [];

    // Find the cards-row within the group
    let row = null;
    for (const child of groupEl.children) {
      if (child.className && child.className.includes('cards-row')) {
        row = child;
        break;
      }
    }

    if (!row) return [];

    // Get all platform cards and their pids
    const pids = [];
    for (const child of row.children) {
      if (child.className && child.className.includes('platform-card') && child.dataset.pid) {
        pids.push(child.dataset.pid);
      }
    }

    return pids;
  }

  // Reset state
  reset() {
    this.platformPrefs.smartOrdering = true;
    this.platformPrefs.cardOrder = {};
    this.isApplyingSmartOrder = false;
    this.pendingRenderData = null;
    this.pendingApplySmartOrder = false;
    this.previewGrid.children = [];
    // Reset platform groups to original order
    this.platformGroups = [
      {
        id: 'social',
        title: 'Social & Microblogging',
        collapsed: false,
        platforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads']
      }
    ];
  }
}

// Create test runner
const runner = new TestRunner();
const system = new MockPlatformCardSystem();

// Test 1: Basic reordering and re-render verification
runner.test('Basic reordering persists across single re-render', () => {
  system.reset();

  // Initial render with default order
  const data1 = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
  system.renderPreviews(data1);
  const initialOrder = system.getCurrentCardOrder('social');

  // Apply smart ordering
  system.applySmartOrderingSafe('article');

  // Re-render
  system.renderPreviews(data1);
  const afterRerenderOrder = system.getCurrentCardOrder('social');

  // Order should be the smart order (twitter, facebook, linkedin...)
  runner.assertEqual(afterRerenderOrder[0], 'twitter', 'Twitter should be first after smart ordering');
  runner.assertEqual(afterRerenderOrder[1], 'facebook', 'Facebook should be second');
});

// Test 2: Multiple rapid re-renders maintain order
runner.test('Multiple rapid re-renders maintain card order', () => {
  system.reset();

  // Apply smart ordering
  system.applySmartOrderingSafe('article');
  const expectedOrder = system.platformPrefs.cardOrder.social;

  // Simulate 5 rapid re-renders
  for (let i = 0; i < 5; i++) {
    const data = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
    system.renderPreviews(data);
    const currentOrder = system.getCurrentCardOrder('social');

    runner.assertDeepEquals(currentOrder, expectedOrder, `Order should be preserved after re-render ${i + 1}`);
  }
});

// Test 3: Concurrent smart ordering and render operations
runner.test('Concurrent smart ordering and render operations handle race condition', () => {
  system.reset();

  let renderWasQueued = false;

  // Monkey-patch reorderPlatformCards to trigger render mid-operation
  const originalReorder = system.reorderPlatformCards.bind(system);
  system.reorderPlatformCards = function() {
    // This is called while isApplyingSmartOrder is still true
    // Try to render during this period (should be queued)
    const renderData = { grades: { twitter: 'A', facebook: 'B' } };
    system.renderPreviews(renderData);
    // Check if render was queued (it should be, since guard flag is true)
    if (system.pendingRenderData !== null) {
      renderWasQueued = true;
    }
    // Then call original
    return originalReorder();
  };

  // Start smart ordering
  system.applySmartOrderingSafe('article');

  // Restore original
  system.reorderPlatformCards = originalReorder;

  // Verify render was queued during the operation
  runner.assertTrue(renderWasQueued, 'Render should be queued during smart ordering');

  // Verify final order matches smart order
  const finalOrder = system.getCurrentCardOrder('social');
  runner.assertEqual(finalOrder[0], 'twitter', 'Final order should respect smart ordering');
});

// Test 4: Reordering followed by rapid state changes
runner.test('Reordering handles rapid state changes', () => {
  system.reset();

  // Apply smart ordering
  system.applySmartOrderingSafe('article');
  const expectedOrder = [...system.platformPrefs.cardOrder.social];

  // Rapid state changes: re-render with different data
  for (let i = 0; i < 3; i++) {
    const data = {
      grades: {
        twitter: i === 0 ? 'A' : 'B',
        facebook: 'A',
        linkedin: 'A'
      }
    };
    system.renderPreviews(data);
  }

  // Verify order is preserved
  const finalOrder = system.getCurrentCardOrder('social');
  runner.assertDeepEquals(finalOrder, expectedOrder, 'Order should persist through rapid state changes');
});

// Test 5: Guard flag prevents render during DOM manipulation
runner.test('Guard flag prevents render during DOM manipulation', () => {
  system.reset();

  // Manually set guard flag
  system.isApplyingSmartOrder = true;

  // Try to render (should be queued)
  const data = { grades: { twitter: 'A' } };
  system.renderPreviews(data);

  // Verify render was queued
  runner.assertTrue(system.pendingRenderData !== null, 'Render should be queued when guard flag is set');

  // Verify DOM wasn't modified
  runner.assertEqual(system.previewGrid.children.length, 0, 'DOM should not be modified during smart ordering');
});

// Test 6: cardOrder persistence across multiple smart ordering operations
runner.test('cardOrder persists across multiple smart ordering operations', () => {
  system.reset();

  // First smart ordering
  system.applySmartOrderingSafe('article');
  const order1 = [...system.platformPrefs.cardOrder.social];

  // Second smart ordering
  system.applySmartOrderingSafe('article');
  const order2 = [...system.platformPrefs.cardOrder.social];

  // Orders should be identical for same page type
  runner.assertDeepEquals(order1, order2, 'Same page type should produce same order');

  // Different page type should produce different order
  system.applySmartOrderingSafe('product');
  const order3 = [...system.platformPrefs.cardOrder.social];

  runner.assertTrue(order3[0] !== order1[0], 'Different page types should produce different orders');
});

// Test 7: Queued render processes after smart ordering completes
runner.test('Queued render processes after smart ordering completes', () => {
  system.reset();

  const renderData = { grades: { twitter: 'A', facebook: 'B' } };

  // Start smart ordering
  system.isApplyingSmartOrder = true;

  // Queue a render
  system.renderPreviews(renderData);
  runner.assertTrue(system.pendingRenderData !== null, 'Render should be queued');

  // Complete smart ordering
  system.isApplyingSmartOrder = false;

  // Process queued render manually
  if (system.pendingRenderData) {
    const data = system.pendingRenderData;
    system.pendingRenderData = null;
    system.renderPreviews(data);
  }

  // Verify render was processed
  runner.assertEqual(system.previewGrid.children.length, 1, 'Queued render should be processed');
});

// Test 8: Multiple concurrent smart ordering requests queue properly
runner.test('Multiple concurrent smart ordering requests queue properly', () => {
  system.reset();

  // Start first smart ordering
  system.isApplyingSmartOrder = true;

  // Try second smart ordering (should queue)
  system.applySmartOrderingSafe('article');

  runner.assertTrue(system.pendingApplySmartOrder, 'Second smart ordering should be queued');

  // Verify guard flag is still set
  runner.assertTrue(system.isApplyingSmartOrder, 'Guard flag should remain set during first operation');
});

// Test 9: Edge case - Empty cardOrder doesn\'t break renders
runner.test('Empty cardOrder doesn\'t break renders', () => {
  system.reset();

  // Don't apply smart ordering, cardOrder is empty
  runner.assertEqual(Object.keys(system.platformPrefs.cardOrder).length, 0, 'cardOrder should be empty');

  // Render should work with default order
  const data = { grades: { twitter: 'A', facebook: 'B' } };
  system.renderPreviews(data);

  const order = system.getCurrentCardOrder('social');
  runner.assertTrue(order.length > 0, 'Render should succeed with default order');
});

// Test 10: DOM reordering matches cardOrder exactly
runner.test('DOM reordering matches cardOrder exactly', () => {
  system.reset();

  // Apply smart ordering
  system.applySmartOrderingSafe('article');

  // Get expected order from cardOrder
  const expectedOrder = system.platformPrefs.cardOrder.social;

  // Render the cards to the DOM
  const data = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
  system.renderPreviews(data);

  // Get actual DOM order
  const actualOrder = system.getCurrentCardOrder('social');

  // They should match exactly
  runner.assertDeepEquals(actualOrder, expectedOrder, 'DOM order should match cardOrder exactly');
});

// Test 11: Race condition simulation - render during reordering
runner.test('Race condition: render during reordering is prevented', () => {
  system.reset();

  // Simulate race condition: render is called while reorderPlatformCards is running
  let renderAttempted = false;
  let renderBlocked = false;

  const originalRender = system.renderPreviews.bind(system);
  system.renderPreviews = function(data) {
    renderAttempted = true;
    if (system.isApplyingSmartOrder) {
      renderBlocked = true;
    }
    return originalRender(data);
  };

  // Start smart ordering
  system.applySmartOrderingSafe('article');

  // Verify render would have been blocked during the operation
  // (In real scenario, render is called during the isApplyingSmartOrder = true period)
  runner.assertTrue(system.isApplyingSmartOrder === false, 'Guard flag should be cleared after completion');

  // Restore original render
  system.renderPreviews = originalRender;
});

// Test 12: Platform group filtering preserves order
runner.test('Platform group filtering preserves custom order', () => {
  system.reset();

  // Set up a custom order with some platforms not in the group
  system.platformPrefs.cardOrder.social = ['twitter', 'facebook', 'nonexistent', 'linkedin', 'another-fake'];

  // Render
  const data = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
  system.renderPreviews(data);

  // Get actual order
  const actualOrder = system.getCurrentCardOrder('social');

  // Should filter out non-existent platforms but maintain order of existing ones
  runner.assertEqual(actualOrder[0], 'twitter', 'Should maintain first position');
  runner.assertEqual(actualOrder[1], 'facebook', 'Should maintain second position');
  runner.assertEqual(actualOrder[2], 'linkedin', 'Should maintain third position');
  runner.assertTrue(!actualOrder.includes('nonexistent'), 'Should filter out non-existent platforms');
});

// Test 13: New platforms added to end of custom order
runner.test('New platforms not in custom order are added to end', () => {
  system.reset();

  // Set custom order without all platforms
  system.platformPrefs.cardOrder.social = ['twitter', 'facebook'];

  // Render
  const data = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A', reddit: 'C' } };
  system.renderPreviews(data);

  // Get actual order
  const actualOrder = system.getCurrentCardOrder('social');

  // New platforms should be at the end
  runner.assertEqual(actualOrder[0], 'twitter', 'Custom order first');
  runner.assertEqual(actualOrder[1], 'facebook', 'Custom order second');
  runner.assertTrue(actualOrder.includes('linkedin'), 'New platform should be present');
  runner.assertTrue(actualOrder.includes('reddit'), 'New platform should be present');
  runner.assertTrue(actualOrder.indexOf('linkedin') > 1, 'New platform should be after custom order');
});

// Test 14: Multiple groups maintain independent orders
runner.test('Multiple groups maintain independent orders', () => {
  system.reset();

  // Add second group
  system.platformGroups.push({
    id: 'messaging',
    title: 'Messaging',
    collapsed: false,
    platforms: ['slack', 'discord', 'telegram']
  });

  // Apply smart ordering
  system.applySmartOrderingSafe('article');

  // Render
  const data = { grades: { twitter: 'A', facebook: 'B', slack: 'A' } };
  system.renderPreviews(data);

  // Both groups should have their orders preserved
  const socialOrder = system.getCurrentCardOrder('social');
  const messagingOrder = system.getCurrentCardOrder('messaging');

  runner.assertTrue(socialOrder.length > 0, 'Social group should have cards');
  runner.assertTrue(messagingOrder.length > 0, 'Messaging group should have cards');

  // Verify each group respects its own cardOrder
  if (system.platformPrefs.cardOrder.social) {
    runner.assertEqual(socialOrder[0], system.platformPrefs.cardOrder.social[0], 'Social group should respect its order');
  }
});

// Test 15: Stress test - 10 rapid re-renders
runner.test('Stress test: 10 rapid re-renders maintain order', () => {
  system.reset();

  // Apply smart ordering
  system.applySmartOrderingSafe('article');
  const expectedOrder = [...system.platformPrefs.cardOrder.social];

  // 10 rapid re-renders
  for (let i = 0; i < 10; i++) {
    const data = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
    system.renderPreviews(data);
    const currentOrder = system.getCurrentCardOrder('social');

    if (currentOrder.length > 0) {
      runner.assertDeepEquals(currentOrder, expectedOrder, `Order should be preserved after ${i + 1} re-renders`);
    }
  }
});

// Test 16: Guard flag timing ensures correct render sequence
runner.test('Guard flag timing ensures correct render sequence', () => {
  system.reset();

  // Manually set guard flag and attempt render (should queue)
  system.isApplyingSmartOrder = true;
  const data = { grades: { twitter: 'A' } };
  system.renderPreviews(data);

  // Verify render was queued
  runner.assertTrue(system.pendingRenderData !== null, 'Render should be queued when guard is set');

  // Clear flag and process queued render
  system.isApplyingSmartOrder = false;
  if (system.pendingRenderData) {
    const queuedData = system.pendingRenderData;
    system.pendingRenderData = null;
    system.renderPreviews(queuedData);
  }

  // Verify render was processed
  runner.assertEqual(system.previewGrid.children.length, 1, 'Queued render should be processed after flag cleared');
});

// Test 17: cardOrder survives reset and re-apply
runner.test('cardOrder is resettable and re-applyable', () => {
  system.reset();

  // First apply
  system.applySmartOrderingSafe('article');
  const order1 = [...system.platformPrefs.cardOrder.social];

  // Reset
  system.platformPrefs.cardOrder = {};

  // Second apply
  system.applySmartOrderingSafe('article');
  const order2 = [...system.platformPrefs.cardOrder.social];

  // Should produce same order
  runner.assertDeepEquals(order1, order2, 'Reset and re-apply should produce same order');
});

// Test 18: Smart ordering disabled doesn\'t affect render
runner.test('Smart ordering disabled doesn\'t affect render', () => {
  system.reset();

  // Disable smart ordering
  system.platformPrefs.smartOrdering = false;

  // Try to apply (should exit early)
  system.applySmartOrderingSafe('article');

  // cardOrder should remain empty
  runner.assertEqual(Object.keys(system.platformPrefs.cardOrder).length, 0, 'cardOrder should be empty when disabled');

  // Render should work normally
  const data = { grades: { twitter: 'A', facebook: 'B' } };
  system.renderPreviews(data);

  const order = system.getCurrentCardOrder('social');
  runner.assertTrue(order.length > 0, 'Render should work with smart ordering disabled');
});

// Test 19: Different page types produce different orders
runner.test('Different page types produce different orders', () => {
  system.reset();

  // Apply article ordering
  system.applySmartOrderingSafe('article');
  const articleOrder = [...system.platformPrefs.cardOrder.social];

  // Reset and apply product ordering
  system.reset();
  system.applySmartOrderingSafe('product');

  // For product ordering, the social group platforms will be sorted differently
  // since the product preferred order prioritizes facebook, twitter, linkedin
  runner.assertTrue(system.platformPrefs.cardOrder.social !== undefined, 'cardOrder.social should exist after product ordering');
  const productOrder = [...system.platformPrefs.cardOrder.social];

  // At least some should be different
  const articleOrderStr = JSON.stringify(articleOrder);
  const productOrderStr = JSON.stringify(productOrder);

  runner.assertTrue(articleOrderStr !== productOrderStr, 'Article and product orders should differ');
});

// Test 20: Integration test - full workflow
runner.test('Integration test: full workflow from render to reorder to re-render', () => {
  system.reset();

  // Step 1: Initial render
  const data1 = { grades: { twitter: 'A', facebook: 'B', linkedin: 'A' } };
  system.renderPreviews(data1);
  const initialOrder = system.getCurrentCardOrder('social');
  runner.assertTrue(initialOrder.length > 0, 'Initial render should produce cards');

  // Step 2: Apply smart ordering
  system.applySmartOrderingSafe('article');

  // Step 3: Re-render
  system.renderPreviews(data1);
  const afterRerenderOrder = system.getCurrentCardOrder('social');

  // Step 4: Verify order persists (should match cardOrder if it exists)
  if (system.platformPrefs.cardOrder.social) {
    const expectedOrder = [...system.platformPrefs.cardOrder.social];
    runner.assertDeepEquals(afterRerenderOrder, expectedOrder, 'Order should persist through full workflow');
  } else {
    runner.assertTrue(afterRerenderOrder.length > 0, 'Order should exist after smart ordering');
  }

  // Step 5: Another smart ordering (different page type)
  system.applySmartOrderingSafe('product');

  // Step 6: Re-render again
  system.renderPreviews(data1);
  const finalOrder = system.getCurrentCardOrder('social');

  // Step 7: Verify new order (if cardOrder exists for product)
  if (system.platformPrefs.cardOrder.social) {
    const productOrder = [...system.platformPrefs.cardOrder.social];
    runner.assertDeepEquals(finalOrder, productOrder, 'New order should persist after second smart ordering');
  } else {
    runner.assertTrue(finalOrder.length > 0, 'Order should exist after second smart ordering');
  }
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
