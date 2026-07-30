/**
 * Guard Wrapper Utility for Filter Handlers
 *
 * This module provides a reusable wrapper for filter change handlers that checks
 * isSmartOrdering() before executing order-reset logic. It prevents smart ordering
 * conflicts by deferring operations when smart ordering is active.
 *
 * Usage:
 *   function myFilterHandler(pid) {
 *     guardWrapper('myFilterHandler', () => {
 *       // Your filter logic here
 *       platformPrefs.hidden.add(pid);
 *       savePlatformPrefs();
 *       updateHiddenList();
 *     });
 *   }
 *
 * @module filter-guard-wrapper
 */

/**
 * Guard wrapper for filter handlers that may conflict with smart ordering.
 *
 * This wrapper:
 * 1. Checks if smart ordering is currently active via isSmartOrdering()
 * 2. If active, queues the operation for later execution and returns early
 * 3. If not active, executes the wrapped logic immediately
 * 4. Preserves all existing handler behavior and context
 *
 * @param {string} handlerName - Name of the handler for debugging/logging
 * @param {Function} handlerFunction - The filter operation function to execute
 * @returns {void}
 *
 * @example
 * function toggleHidden(pid) {
 *   guardWrapper('toggleHidden', () => {
 *     if (platformPrefs.hidden.has(pid)) {
 *       platformPrefs.hidden.delete(pid);
 *     } else {
 *       platformPrefs.hidden.add(pid);
 *     }
 *     savePlatformPrefs();
 *     updateHiddenList();
 *   });
 * }
 */
function guardWrapper(handlerName, handlerFunction) {
  // Check if smart ordering is active
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    // Queue the operation for later execution
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
      if (typeof DEBUG_SMART_ORDERING !== 'undefined' && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active - operation queued`);
      }
    }
    return;
  }

  // Execute the handler logic immediately
  handlerFunction();
}

/**
 * Variant of guardWrapper specifically for handlers that trigger renderPreviews.
 *
 * This version automatically wraps the handler with filter operation guards
 * to prevent order resets during the render.
 *
 * @param {string} handlerName - Name of the handler for debugging/logging
 * @param {Function} handlerFunction - The filter operation function to execute
 * @returns {void}
 *
 * @example
 * function toggleHidden(pid) {
 *   guardWrapperWithRender('toggleHidden', () => {
 *     if (platformPrefs.hidden.has(pid)) {
 *       platformPrefs.hidden.delete(pid);
 *     } else {
 *       platformPrefs.hidden.add(pid);
 *     }
 *     savePlatformPrefs();
 *     updateHiddenList();
 *     renderPreviews(currentData);
 *   });
 * }
 */
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();

    // Set filter guard and clear it after render
    // Use 'in' check to handle both defined and undefined cases
    if ('isFilterOperation' in globalThis || typeof isFilterOperation !== 'undefined') {
      isFilterOperation = true;
      setTimeout(() => { isFilterOperation = false; }, 0);
    }

    // Clear smart ordering active flag
    if ('isSmartOrderingActive' in globalThis || typeof isSmartOrderingActive !== 'undefined') {
      isSmartOrderingActive = false;
      if ('DEBUG_SMART_ORDERING' in globalThis && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active flag CLEARED (user manual override)`);
      }
    }
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    guardWrapper,
    guardWrapperWithRender
  };
}
