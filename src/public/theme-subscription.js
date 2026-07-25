/**
 * Theme Subscription Utility for Platform Frames
 *
 * Provides a subscribe/unsubscribe interface for platform frame components
 * to receive and react to theme changes without page reload.
 *
 * This utility wraps the existing frames-theme.js theme management system
 * and provides a clean API for TypeScript components to consume theme updates.
 */

'use strict';

/* ============================================================================
   SUBSCRIPTION MANAGEMENT
   ============================================================================ */

/**
 * Subscriber callback type
 * @callback ThemeChangeCallback
 * @param {string} theme - Current theme ('dark' or 'light')
 */

/**
 * Active theme subscribers
 * @type {Map<string, ThemeChangeCallback>}
 */
const themeSubscribers = new Map();

/**
 * Next subscriber ID
 * @type {number}
 */
let nextSubscriberId = 1;

/**
 * Current global theme state
 * @type {string}
 */
let currentTheme = 'dark';

/* ============================================================================
   THEME DETECTION
   ============================================================================ */

/**
 * Get the current theme from the DOM
 * @returns {string} Current theme ('dark' or 'light')
 */
function getCurrentThemeFromDOM() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

/**
 * Initialize theme detection by watching DOM changes
 */
function initializeThemeDetection() {
  // Set initial theme
  currentTheme = getCurrentThemeFromDOM();

  // Watch for theme changes on document element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        const newTheme = getCurrentThemeFromDOM();
        if (newTheme !== currentTheme) {
          currentTheme = newTheme;
          notifySubscribers(newTheme);
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

/* ============================================================================
   SUBSCRIPTION API
   ============================================================================ */

/**
 * Subscribe to theme changes
 * @param {ThemeChangeCallback} callback - Function to call when theme changes
 * @returns {string} Subscriber ID (use this ID to unsubscribe)
 */
function subscribeToTheme(callback) {
  const subscriberId = `subscriber-${nextSubscriberId++}`;
  themeSubscribers.set(subscriberId, callback);

  // Immediately call with current theme
  callback(currentTheme);

  return subscriberId;
}

/**
 * Unsubscribe from theme changes
 * @param {string} subscriberId - The subscriber ID returned from subscribeToTheme
 * @returns {boolean} True if subscriber was found and removed, false otherwise
 */
function unsubscribeFromTheme(subscriberId) {
  return themeSubscribers.delete(subscriberId);
}

/**
 * Get the current theme value
 * @returns {string} Current theme ('dark' or 'light')
 */
function getCurrentTheme() {
  return currentTheme;
}

/**
 * Notify all subscribers of a theme change
 * @param {string} theme - New theme value
 */
function notifySubscribers(theme) {
  themeSubscribers.forEach((callback, subscriberId) => {
    try {
      callback(theme);
    } catch (error) {
      console.error(`[ThemeSubscription] Error in subscriber ${subscriberId}:`, error);
    }
  });
}

/* ============================================================================
   PLATFORM FRAME INTEGRATION HELPERS
   ============================================================================ */

/**
 * Apply theme to a platform frame element
 * Updates CSS classes and CSS variables for the platform
 *
 * @param {HTMLElement} frameElement - The frame DOM element
 * @param {string} platform - Platform ID (e.g., 'twitter', 'facebook')
 * @param {string} theme - Theme ('dark' or 'light')
 */
function applyThemeToFrame(frameElement, platform, theme) {
  if (!frameElement) {
    console.warn('[ThemeSubscription] applyThemeToFrame: frameElement is null/undefined');
    return;
  }

  // Update theme classes
  frameElement.classList.remove('dark-theme', 'light-theme');
  frameElement.classList.add(`${theme}-theme`);

  // Update data-theme attribute
  frameElement.setAttribute('data-theme', theme);

  // Update data-frame-theme attribute
  frameElement.setAttribute('data-frame-theme', theme);

  // Get platform-specific theme variables if PLATFORM_FRAMES is available
  if (typeof PLATFORM_FRAMES !== 'undefined' && PLATFORM_FRAMES[platform]) {
    const themeVars = PLATFORM_FRAMES[platform].themeVars?.[theme];
    if (themeVars) {
      Object.entries(themeVars).forEach(([varName, value]) => {
        frameElement.style.setProperty(varName, value);
      });
    }
  }
}

/**
 * Create a theme subscription for a specific platform frame
 * This is a convenience function that combines subscription with theme application
 *
 * @param {string} platform - Platform ID (e.g., 'twitter', 'facebook')
 * @param {string} frameId - The DOM element ID of the frame
 * @returns {Function} Unsubscribe function
 */
function subscribePlatformFrame(platform, frameId) {
  const callback = (theme) => {
    const frameElement = document.getElementById(frameId);
    if (frameElement) {
      applyThemeToFrame(frameElement, platform, theme);
    }
  };

  const subscriberId = subscribeToTheme(callback);

  // Return unsubscribe function
  return () => unsubscribeFromTheme(subscriberId);
}

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeDetection);
  } else {
    initializeThemeDetection();
  }
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

/**
 * Theme Subscription API
 *
 * @example
 * // Subscribe to theme changes
 * const subscriberId = ThemeSubscription.subscribe((theme) => {
 *   console.log('Theme changed to:', theme);
 *   // Update your component here
 * });
 *
 * @example
 * // Unsubscribe from theme changes
 * ThemeSubscription.unsubscribe(subscriberId);
 *
 * @example
 * // Get current theme
 * const currentTheme = ThemeSubscription.getCurrentTheme();
 *
 * @example
 * // Subscribe a platform frame (convenience method)
 * const unsubscribe = ThemeSubscription.subscribePlatformFrame('twitter', 'my-frame-id');
 * // Later: unsubscribe();
 */
const ThemeSubscription = {
  subscribe: subscribeToTheme,
  unsubscribe: unsubscribeFromTheme,
  getCurrentTheme,
  applyThemeToFrame,
  subscribePlatformFrame,

  // Readonly properties
  get subscriberCount() {
    return themeSubscribers.size;
  }
};

// Browser: expose to global scope
if (typeof window !== 'undefined') {
  window.ThemeSubscription = ThemeSubscription;
}

// CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSubscription;
}

// ES module default export
if (typeof exports !== 'undefined') {
  exports.default = ThemeSubscription;
}
