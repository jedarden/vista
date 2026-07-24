/**
 * VISTA Centralized Guard Functions
 *
 * This module provides centralized guard functions that check various
 * application states. These functions are exposed via the window object
 * for cross-module usage.
 *
 * @module guard-utils
 */

(function() {
  'use strict';

  /**
   * Check if smart ordering is currently active
   *
   * This function checks both the user preference and the runtime state
   * to determine if smart ordering should be applied.
   *
   * **Smart ordering is considered active when:**
   * 1. User preference `smartOrdering` is enabled (default: true)
   * 2. Runtime flag `isSmartOrderingActive` is true (smart ordering is in progress)
   *
   * **When to use this guard:**
   * - Before applying smart ordering logic
   * - Before resetting card order during filter changes
   * - Before any operation that should be skipped during smart ordering
   *
   * **Usage examples:**
   * ```javascript
   * if (window.isSmartOrdering()) {
   *   // Skip operation or handle differently during smart ordering
   *   return;
   * }
   * ```
   *
   * @returns {boolean} True if smart ordering is BOTH enabled AND currently active, false otherwise
   */
  function isSmartOrdering() {
    // Access state from window object for cross-module compatibility
    const prefs = window.platformPrefs || {};
    const userPreference = prefs.smartOrdering !== false; // Default is true
    const runtimeState = window.isSmartOrderingActive || false;

    return userPreference && runtimeState;
  }

  /**
   * Check if smart ordering is enabled in user preferences
   *
   * This function only checks the user preference setting, regardless of
   * whether smart ordering is currently active. Use this to check if the
   * feature is allowed to run.
   *
   * **When to use this guard:**
   * - To check if smart ordering feature is allowed (not necessarily active)
   * - To determine if smart ordering should be triggered
   *
   * @returns {boolean} True if smart ordering is enabled in preferences, false otherwise
   */
  function isSmartOrderingEnabled() {
    const prefs = window.platformPrefs || {};
    return prefs.smartOrdering !== false; // Default is true
  }

  /**
   * Check if a filter operation is currently in progress
   *
   * This function checks the runtime state to determine if a filter operation
   * (show/hide platforms) is currently executing.
   *
   * **When to use this guard:**
   * - Before operations that should be skipped during filtering
   * - To prevent race conditions with filter operations
   *
   * @returns {boolean} True if a filter operation is in progress, false otherwise
   */
  function isFilterOperationInProgress() {
    return window.isFilterOperation || false;
  }

  // Expose functions via window object for cross-module access
  window.isSmartOrdering = isSmartOrdering;
  window.isSmartOrderingEnabled = isSmartOrderingEnabled;
  window.isFilterOperationInProgress = isFilterOperationInProgress;

  // Log availability
  if (window.DEBUG_SMART_ORDERING) {
    console.log('[guard-utils] Centralized guard functions loaded');
  }
})();
