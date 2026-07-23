/**
 * DOM Order Extraction Utility for Playwright
 *
 * Extracts the current card order from the DOM and returns platform names.
 * This utility is designed to work with Playwright Page objects.
 *
 * @module extract-dom-order
 */

/**
 * Extract platform card order from the DOM
 *
 * This function takes a Playwright Page object and extracts all platform cards
 * from the preview grid, returning their order as an array of platform names.
 *
 * @param {import('playwright').Page} page - Playwright Page object
 * @returns {Promise<string[]>} Array of platform names in DOM order
 *
 * @example
 * const { chromium } = require('playwright');
 * const extractDomOrder = require('./src/utils/extract-dom-order');
 *
 * (async () => {
 *   const browser = await chromium.launch();
 *   const page = await browser.newPage();
 *
 *   await page.goto('http://localhost:3000');
 *   await page.waitForSelector('.platform-card');
 *
 *   const order = await extractDomOrder(page);
 *   console.log('Platform order:', order);
 *   // Output: ['twitter', 'facebook', 'linkedin', ...]
 *
 *   await browser.close();
 * })();
 */
async function extractDomOrder(page) {
  if (!page) {
    throw new Error('A valid Playwright Page object is required');
  }

  try {
    // Extract platform order from DOM using evaluate
    const platformOrder = await page.evaluate(() => {
      // Find all platform cards in the preview grid
      const cards = document.querySelectorAll('#previewGrid .platform-card[data-pid]');

      if (cards.length === 0) {
        return []; // No cards present - return empty array
      }

      // Extract platform IDs and names
      const order = Array.from(cards).map(card => {
        // Get platform ID from data-pid attribute
        const pid = card.getAttribute('data-pid');

        // Try to get platform name from card content
        const nameElement = card.querySelector('.card-platform-name, .platform-name');
        const name = nameElement ? nameElement.textContent.trim() : null;

        // Return both pid and name for verification
        return { pid, name };
      });

      return order;
    });

    // Handle missing or empty card sets
    if (!platformOrder || platformOrder.length === 0) {
      return [];
    }

    // Return just the platform IDs as the primary order
    return platformOrder.map(item => item.pid);

  } catch (error) {
    // If page evaluation fails, provide helpful error context
    throw new Error(`Failed to extract DOM order: ${error.message}`);
  }
}

/**
 * Extract platform card order with detailed information
 *
 * Returns an array of objects containing both platform IDs and display names.
 * Useful for debugging and verification.
 *
 * @param {import('playwright').Page} page - Playwright Page object
 * @returns {Promise<Array<{pid: string, name: string|null}>>} Array of platform info objects
 *
 * @example
 * const details = await extractDomOrderDetailed(page);
 * console.log('Detailed order:', details);
 * // Output: [{ pid: 'twitter', name: 'X (Twitter)' }, { pid: 'facebook', name: 'Facebook' }, ...]
 */
async function extractDomOrderDetailed(page) {
  if (!page) {
    throw new Error('A valid Playwright Page object is required');
  }

  try {
    const platformDetails = await page.evaluate(() => {
      const cards = document.querySelectorAll('#previewGrid .platform-card[data-pid]');

      if (cards.length === 0) {
        return [];
      }

      return Array.from(cards).map(card => {
        const pid = card.getAttribute('data-pid');
        const nameElement = card.querySelector('.card-platform-name, .platform-name');
        const name = nameElement ? nameElement.textContent.trim() : null;

        return { pid, name };
      });
    });

    return platformDetails;

  } catch (error) {
    throw new Error(`Failed to extract detailed DOM order: ${error.message}`);
  }
}

/**
 * Verify that DOM order matches an expected order
 *
 * Compares the extracted DOM order against an expected array and returns
 * whether they match, along with detailed differences if they don't.
 *
 * @param {import('playwright').Page} page - Playwright Page object
 * @param {string[]} expectedOrder - Expected array of platform IDs
 * @returns {Promise<{matches: boolean, actual: string[], expected: string[], differences: string[]}>}
 *
 * @example
 * const verification = await verifyDomOrder(page, ['twitter', 'facebook', 'linkedin']);
 * if (!verification.matches) {
 *   console.log('Order mismatch:', verification.differences);
 * }
 */
async function verifyDomOrder(page, expectedOrder) {
  if (!Array.isArray(expectedOrder)) {
    throw new Error('Expected order must be an array of platform IDs');
  }

  const actualOrder = await extractDomOrder(page);
  const matches = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);

  const differences = [];
  if (!matches) {
    const maxLength = Math.max(actualOrder.length, expectedOrder.length);

    for (let i = 0; i < maxLength; i++) {
      if (actualOrder[i] !== expectedOrder[i]) {
        differences.push(
          `Position ${i}: expected "${expectedOrder[i]}" but got "${actualOrder[i]}"`
        );
      }
    }

    if (actualOrder.length !== expectedOrder.length) {
      differences.push(
        `Length mismatch: expected ${expectedOrder.length} items but got ${actualOrder.length}`
      );
    }
  }

  return {
    matches,
    actual: actualOrder,
    expected: expectedOrder,
    differences
  };
}

/**
 * Wait for platform cards to be present in DOM and extract order
 *
 * Combines waiting for the selector and extracting order in one operation.
 *
 * @param {import('playwright').Page} page - Playwright Page object
 * @param {Object} options - Options for waiting
 * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<string[]>} Array of platform names in DOM order
 *
 * @example
 * const order = await extractDomOrderAndWait(page, { timeout: 5000 });
 */
async function extractDomOrderAndWait(page, options = {}) {
  const { timeout = 10000 } = options;

  try {
    await page.waitForSelector('.platform-card', { timeout });
  } catch (error) {
    // If timeout occurs, still try to extract any cards that might exist
    console.warn('Timeout waiting for platform cards, attempting extraction anyway');
  }

  return extractDomOrder(page);
}

module.exports = {
  extractDomOrder,
  extractDomOrderDetailed,
  verifyDomOrder,
  extractDomOrderAndWait
};
