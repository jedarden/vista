/**
 * Platform Preference Change Utility
 *
 * This utility provides functions to programmatically change platform preferences
 * in the VISTA application and trigger DOM reordering.
 *
 * Usage:
 *   const { setPlatformPreferences, waitDOMStable } = require('./change-platform-preferences');
 *   await setPlatformPreferences(page, ['twitter', 'facebook', 'linkedin']);
 *   await waitDOMStable(page);
 */

const PLATFORM_NAME_TO_ID = {
  'twitter': 'twitter',
  'x': 'twitter',
  'facebook': 'facebook',
  'threads': 'threads',
  'linkedin': 'linkedin',
  'instagram': 'instagram',
  'pinterest': 'pinterest',
  'slack': 'slack',
  'discord': 'discord',
  'telegram': 'telegram',
  'whatsapp': 'whatsapp',
  'signal': 'signal',
  'teams': 'teams',
  'imessage': 'imessage',
  'googlechat': 'googlechat',
  'zoom': 'zoom',
  'line': 'line',
  'kakaotalk': 'kakaotalk',
  'mastodon': 'mastodon',
  'bluesky': 'bluesky',
  'medium': 'medium',
  'substack': 'substack',
  'tumblr': 'tumblr',
  'reddit': 'reddit',
  'google': 'google',
  'notion': 'notion',
  'jira': 'jira',
  'github': 'github',
  'trello': 'trello',
  'figma': 'figma',
  'outlook': 'outlook',
  'gmail': 'gmail',
  'feedly': 'feedly'
};

/**
 * Convert platform names to platform IDs
 * Handles both direct IDs and human-readable names
 *
 * @param {string[]} platformNames - Array of platform names (e.g., ['twitter', 'facebook'])
 * @returns {string[]} Array of platform IDs
 */
function normalizePlatformIds(platformNames) {
  return platformNames.map(name => {
    const lowerName = name.toLowerCase();
    return PLATFORM_NAME_TO_ID[lowerName] || lowerName;
  });
}

/**
 * Set platform preferences in the VISTA application
 * This function:
 * 1. Converts platform names to IDs
 * 2. Sets the platforms as favorites
 * 3. Saves preferences to localStorage
 * 4. Triggers reordering if smartOrdering is enabled
 *
 * @param {Page} page - Playwright page object
 * @param {string[]} platformNames - Array of platform names to set as preferred
 * @param {Object} options - Configuration options
 * @param {boolean} options.clearExisting - Whether to clear existing favorites first (default: true)
 * @param {boolean} options.triggerReordering - Whether to trigger smart reordering (default: true)
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @returns {Promise<Object>} Result object with success status and details
 */
async function setPlatformPreferences(
  page,
  platformNames,
  options = {}
) {
  const {
    clearExisting = true,
    triggerReordering = true,
    timeout = 30000
  } = options;

  console.log(`[setPlatformPreferences] Setting preferences for platforms: ${platformNames.join(', ')}`);

  const startTime = Date.now();
  const platformIds = normalizePlatformIds(platformNames);

  try {
    // Check if page is ready
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Execute in browser context to set preferences
    const result = await page.evaluate(async (ids, shouldClear) => {
      // Check if platformPrefs exists
      if (typeof window.platformPrefs === 'undefined') {
        return {
          success: false,
          error: 'platformPrefs not found - page may not be fully loaded'
        };
      }

      // Clear existing favorites if requested
      if (shouldClear && window.platformPrefs.favorites) {
        window.platformPrefs.favorites.clear();
      }

      // Add new platforms to favorites
      ids.forEach(pid => {
        if (window.platformPrefs.favorites) {
          window.platformPrefs.favorites.add(pid);
        }
      });

      // Save preferences to localStorage
      if (typeof window.savePlatformPrefs === 'function') {
        window.savePlatformPrefs();
      } else {
        // Fallback: manually save to localStorage
        const prefs = {
          favorites: Array.from(window.platformPrefs.favorites || []),
          hidden: Array.from(window.platformPrefs.hidden || []),
          columnCount: window.platformPrefs.columnCount || 3,
          smartOrdering: window.platformPrefs.smartOrdering !== false,
          cardOrder: window.platformPrefs.cardOrder || {}
        };
        localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
      }

      return {
        success: true,
        favorites: Array.from(window.platformPrefs.favorites || []),
        total: window.platformPrefs.favorites?.size || 0
      };
    }, platformIds, clearExisting);

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`[setPlatformPreferences] Successfully set ${result.total} platforms as favorites`);
    console.log(`[setPlatformPreferences] Favorites: ${result.favorites.join(', ')}`);

    // Trigger reordering if requested
    if (triggerReordering) {
      await triggerPreferenceReordering(page, { timeout });
    }

    const duration = Date.now() - startTime;
    console.log(`[setPlatformPreferences] Completed in ${duration}ms`);

    return {
      success: true,
      platformIds: result.favorites,
      count: result.total,
      duration
    };

  } catch (error) {
    console.error(`[setPlatformPreferences] Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      platformIds
    };
  }
}

/**
 * Trigger platform preference reordering in the UI
 * This simulates clicking the reorder trigger or calls applySmartOrdering directly
 *
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 * @returns {Promise<boolean>} Whether reordering was triggered successfully
 */
async function triggerPreferenceReordering(page, options = {}) {
  const { timeout = 10000 } = options;

  console.log('[triggerPreferenceReordering] Attempting to trigger reordering...');

  try {
    // Try to call applySmartOrdering directly if available
    const result = await page.evaluate(() => {
      if (typeof window.applySmartOrdering === 'function') {
        window.applySmartOrdering();
        return { method: 'direct', success: true };
      }

      // Check if smartOrdering is enabled
      if (typeof window.platformPrefs !== 'undefined') {
        const isEnabled = window.platformPrefs.smartOrdering !== false;
        return { method: 'none', success: false, smartOrderingEnabled: isEnabled };
      }

      return { method: 'none', success: false, error: 'platformPrefs not available' };
    });

    if (result.success) {
      console.log(`[triggerPreferenceReordering] Reordering triggered via ${result.method}`);
      return true;
    } else {
      console.log(`[triggerPreferenceReordering] Could not trigger: ${result.error || 'smartOrdering not enabled'}`);
      return false;
    }

  } catch (error) {
    console.error(`[triggerPreferenceReordering] Error: ${error.message}`);
    return false;
  }
}

/**
 * Wait for DOM to stabilize after preference changes
 * Monitors the preview grid for changes and waits until no new updates occur
 *
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {number} options.stableTime - Time in ms with no changes before considering stable (default: 1000)
 * @param {number} options.maxWait - Maximum time to wait in ms (default: 10000)
 * @returns {Promise<boolean>} Whether DOM stabilized successfully
 */
async function waitDOMStable(page, options = {}) {
  const { stableTime = 1000, maxWait = 10000 } = options;

  console.log(`[waitDOMStable] Waiting for DOM to stabilize (stable for ${stableTime}ms, max ${maxWait}ms)`);

  const startTime = Date.now();
  let lastChangeTime = Date.now();
  let lastCardCount = '';

  try {
    while (Date.now() - startTime < maxWait) {
      // Get current platform card count and order
      const currentState = await page.evaluate(() => {
        const cards = document.querySelectorAll('.platform-card');
        const platformNames = Array.from(cards).map(card => {
          const nameEl = card.querySelector('.platform-name');
          return nameEl ? nameEl.textContent.trim() : '';
        });
        return {
          count: cards.length,
          platforms: platformNames.join(',')
        };
      });

      const currentCardCount = currentState.count + currentState.platforms;

      // Check if state changed
      if (currentCardCount !== lastCardCount) {
        lastChangeTime = Date.now();
        lastCardCount = currentCardCount;
        console.log(`[waitDOMStable] State changed: ${currentState.count} cards`);
      }

      // Check if stable
      if (Date.now() - lastChangeTime >= stableTime) {
        const duration = Date.now() - startTime;
        console.log(`[waitDOMStable] DOM stabilized after ${duration}ms with ${currentState.count} cards`);
        return true;
      }

      // Poll interval
      await page.waitForTimeout(100);
    }

    console.log(`[waitDOMStable] Timed out after ${maxWait}ms`);
    return false;

  } catch (error) {
    console.error(`[waitDOMStable] Error: ${error.message}`);
    return false;
  }
}

/**
 * Get current platform preferences from the page
 *
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Current platform preferences
 */
async function getPlatformPreferences(page) {
  try {
    const prefs = await page.evaluate(() => {
      if (typeof window.platformPrefs === 'undefined') {
        return null;
      }

      return {
        favorites: Array.from(window.platformPrefs.favorites || []),
        hidden: Array.from(window.platformPrefs.hidden || []),
        columnCount: window.platformPrefs.columnCount || 3,
        smartOrdering: window.platformPrefs.smartOrdering !== false,
        hasCardOrder: !!window.platformPrefs.cardOrder
      };
    });

    return prefs;

  } catch (error) {
    console.error(`[getPlatformPreferences] Error: ${error.message}`);
    return null;
  }
}

/**
 * Enable or disable smart ordering
 *
 * @param {Page} page - Playwright page object
 * @param {boolean} enabled - Whether smart ordering should be enabled
 * @returns {Promise<boolean>} Whether the setting was changed successfully
 */
async function setSmartOrdering(page, enabled) {
  try {
    const result = await page.evaluate((isEnabled) => {
      if (typeof window.platformPrefs === 'undefined') {
        return { success: false, error: 'platformPrefs not available' };
      }

      window.platformPrefs.smartOrdering = isEnabled;

      // Save preferences
      if (typeof window.savePlatformPrefs === 'function') {
        window.savePlatformPrefs();
      }

      return { success: true, enabled: window.platformPrefs.smartOrdering };
    }, enabled);

    if (result.success) {
      console.log(`[setSmartOrdering] Smart ordering ${result.enabled ? 'enabled' : 'disabled'}`);
      return true;
    }

    return false;

  } catch (error) {
    console.error(`[setSmartOrdering] Error: ${error.message}`);
    return false;
  }
}

module.exports = {
  setPlatformPreferences,
  triggerPreferenceReordering,
  waitDOMStable,
  getPlatformPreferences,
  setSmartOrdering,
  normalizePlatformIds
};
