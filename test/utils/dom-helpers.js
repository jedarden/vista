/**
 * DOM Inspection Helper Utilities
 *
 * Foundation utilities for DOM-based testing and verification.
 * These functions are designed to be testable, reusable, and robust.
 *
 * @module test/utils/dom-helpers
 */

/**
 * Extract platform card order from DOM
 *
 * Locates all platform-card elements and extracts their platform identifiers.
 * Handles multiple selector strategies to find platform names.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {Object} options - Configuration options
 * @param {string} options.selector - CSS selector for platform cards (default: '.platform-card')
 * @param {number} options.timeout - Maximum time to wait in ms (default: 5000)
 * @returns {Promise<string[]>} Array of platform identifiers in DOM order
 *
 * @example
 * const platforms = await getPlatformOrder(page);
 * // Returns: ['twitter', 'facebook', 'linkedin', 'reddit']
 */
async function getPlatformOrder(page, options = {}) {
  const {
    selector = '.platform-card',
    timeout = 5000
  } = options;

  try {
    // Wait for cards to be present
    if (page.waitForSelector) {
      await page.waitForSelector(selector, { timeout }).catch(() => {
        // Not fatal - continue with empty result
      });
    }

    const platforms = await page.evaluate((sel) => {
      const cards = document.querySelectorAll(sel);
      if (cards.length === 0) {
        return { success: false, error: 'No cards found', platforms: [] };
      }

      const extracted = Array.from(cards).map((card, index) => {
        // Try multiple strategies to get platform identifier
        const strategies = [
          // 1. data-platform attribute on card
          () => card.dataset.platform,
          // 2. data-platform attribute on nested element
          () => card.querySelector('[data-platform]')?.getAttribute('data-platform'),
          // 3. .platform-name text content
          () => card.querySelector('.platform-name')?.textContent?.trim(),
          // 4. Platform class name pattern (platform-twitter)
          () => {
            const match = card.className.match(/platform-(\w+)/);
            return match ? match[1] : null;
          },
          // 5. ARIA label
          () => card.getAttribute('aria-label')?.toLowerCase().replace(/\s+/g, '-'),
          // 6. Alt text on image
          () => card.querySelector('img')?.getAttribute('alt')?.toLowerCase()
        ];

        for (const strategy of strategies) {
          const result = strategy();
          if (result && typeof result === 'string' && result.length > 0) {
            return result.toLowerCase().trim();
          }
        }

        // If all strategies fail, log the problematic card
        console.warn(`Could not extract platform from card at index ${index}`, {
          className: card.className,
          innerHTML: card.innerHTML.substring(0, 200)
        });

        return null;
      }).filter(p => p !== null); // Remove null entries, keep empty strings

      return {
        success: true,
        platforms: extracted,
        count: extracted.length
      };
    }, selector);

    if (!platforms.success) {
      console.warn(`getPlatformOrder: ${platforms.error}`);
      return [];
    }

    return platforms.platforms;

  } catch (error) {
    console.error(`Error in getPlatformOrder: ${error.message}`);
    return [];
  }
}

/**
 * Compare expected vs actual platform order
 *
 * Performs detailed comparison of two platform order arrays and returns
 * comprehensive statistics about the match.
 *
 * @param {string[]} expected - Expected platform order
 * @param {string[]} actual - Actual platform order from DOM
 * @returns {Object} Comparison result with details
 *
 * @returns {boolean} returns.passed - True if perfect match
 * @returns {number} returns.matches - Count of matching positions
 * @returns {number} returns.total - Total expected platforms
 * @returns {number} returns.passRate - Percentage of correct positions
 * @returns {Array} returns.results - Detailed position-by-position results
 * @returns {Array} returns.missing - Platforms in expected but not in actual
 * @returns {Array} returns.extra - Platforms in actual but not in expected
 *
 * @example
 * const comparison = compareOrders(
 *   ['twitter', 'facebook', 'linkedin'],
 *   ['twitter', 'linkedin', 'facebook']
 * );
 * // Returns:
 * // {
 * //   passed: false,
 * //   matches: 1,
 * //   total: 3,
 * //   passRate: 33.33,
 * //   results: [...],
 * //   missing: [],
 * //   extra: []
 * // }
 */
function compareOrders(expected, actual) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    throw new Error('compareOrders requires both arguments to be arrays');
  }

  // Handle empty arrays
  if (expected.length === 0 && actual.length === 0) {
    return {
      passed: true,
      matches: 0,
      total: 0,
      passRate: 100,
      results: [],
      missing: [],
      extra: []
    };
  }

  const limit = Math.min(expected.length, actual.length);
  const results = [];

  // Compare positions up to the shorter array length
  for (let i = 0; i < limit; i++) {
    results.push({
      position: i + 1,
      expected: expected[i],
      actual: actual[i],
      match: expected[i] === actual[i]
    });
  }

  // Mark extra actual platforms (beyond expected length)
  for (let i = limit; i < actual.length; i++) {
    results.push({
      position: i + 1,
      expected: null,
      actual: actual[i],
      match: false,
      extra: true
    });
  }

  // Mark missing expected platforms (not found in actual)
  const missing = expected.filter(p => !actual.includes(p));
  const extra = actual.filter(p => !expected.includes(p));

  const matches = results.filter(r => r.match && !r.extra).length;
  const total = expected.length;
  const passRate = total > 0 ? (matches / total) * 100 : 0;

  return {
    passed: matches === total && missing.length === 0 && extra.length === 0,
    matches,
    total,
    passRate: Math.round(passRate * 100) / 100, // Round to 2 decimal places
    results,
    missing,
    extra
  };
}

/**
 * Wait for DOM to stabilize after reordering
 *
 * Polls the DOM at regular intervals checking if the platform order
 * has stopped changing. Useful for waiting for animations/reordering
 * to complete before asserting results.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {Object} options - Configuration options
 * @param {string} options.selector - CSS selector for elements to monitor (default: '.platform-card')
 * @param {number} options.maxWait - Maximum time to wait in ms (default: 5000)
 * @param {number} options.interval - Check interval in ms (default: 100)
 * @param {number} options.stableCount - Number of consecutive stable checks required (default: 10)
 * @returns {Promise<boolean>} True if DOM stabilized, false if timeout
 *
 * @example
 * const stable = await waitForDOMStable(page);
 * if (!stable) {
 *   console.warn('DOM did not stabilize within timeout');
 * }
 */
async function waitForDOMStable(page, options = {}) {
  const {
    selector = '.platform-card',
    maxWait = 5000,
    interval = 100,
    stableCount = 10
  } = options;

  const startTime = Date.now();
  let lastState = '';
  let currentStableCount = 0;

  while (Date.now() - startTime < maxWait) {
    try {
      const currentState = await page.evaluate((sel) => {
        const cards = document.querySelectorAll(sel);
        const platforms = Array.from(cards).map(card =>
          card.dataset.platform || card.className || ''
        ).join('|');
        return `${cards.length}:${platforms}`;
      }, selector);

      if (currentState === lastState) {
        currentStableCount++;
        if (currentStableCount >= stableCount) {
          return true;
        }
      } else {
        currentStableCount = 0;
        lastState = currentState;
      }

      // Wait appropriate delay based on browser API
      if (page.waitForTimeout) {
        await page.waitForTimeout(interval);
      } else {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`Error checking DOM stability: ${error.message}`);
      return false;
    }
  }

  // Timeout reached
  console.warn(`waitForDOMStable: Timeout after ${maxWait}ms`);
  return false;
}

/**
 * Check if elements are present in DOM
 *
 * Simple presence check for one or more CSS selectors.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {string|string[]} selectors - CSS selector(s) to check
 * @returns {Promise<Object|boolean>} Object with counts if single selector, boolean for array
 *
 * @example
 * const present = await checkElementsPresent(page, '.platform-card');
 * // Returns: { count: 5, present: true }
 *
 * const checks = await checkElementsPresent(page, ['.platform-card', '#url-input']);
 * // Returns: { '.platform-card': true, '#url-input': false }
 */
async function checkElementsPresent(page, selectors) {
  const isArray = Array.isArray(selectors);
  const selectorList = isArray ? selectors : [selectors];

  try {
    const results = await page.evaluate((sels) => {
      const output = {};
      sels.forEach(sel => {
        const elements = document.querySelectorAll(sel);
        output[sel] = {
          count: elements.length,
          present: elements.length > 0
        };
      });
      return output;
    }, selectorList);

    if (isArray) {
      // Return simplified object with just boolean for each selector
      const simplified = {};
      for (const sel of selectorList) {
        simplified[sel] = results[sel].present;
      }
      return simplified;
    }

    // Single selector - return the first result
    return Object.values(results)[0];

  } catch (error) {
    console.error(`Error checking elements: ${error.message}`);
    return isArray ? {} : { count: 0, present: false };
  }
}

/**
 * Extract text content from elements
 *
 * Get text content from one or more elements matching a selector.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {Object} options - Configuration options
 * @param {boolean} options.trim - Trim whitespace (default: true)
 * @param {boolean} options.filterEmpty - Remove empty strings (default: true)
 * @returns {Promise<string[]>} Array of text content
 *
 * @example
 * const names = await extractTextContent(page, '.platform-name');
 * // Returns: ['Twitter', 'Facebook', 'LinkedIn']
 */
async function extractTextContent(page, selector, options = {}) {
  const {
    trim = true,
    filterEmpty = true
  } = options;

  try {
    const texts = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => el.textContent);
    }, selector);

    let result = texts;
    if (trim) {
      result = result.map(t => t?.trim() || '');
    }
    if (filterEmpty) {
      result = result.filter(t => t.length > 0);
    }

    return result;

  } catch (error) {
    console.error(`Error extracting text content: ${error.message}`);
    return [];
  }
}

/**
 * Get element attributes
 *
 * Extract attributes from elements matching a selector.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string|string[]} attrNames - Attribute name(s) to extract
 * @returns {Promise<Object[]>} Array of objects with attribute values
 *
 * @example
 * const data = await getElementAttributes(page, '.platform-card', 'data-platform');
 * // Returns: [{ 'data-platform': 'twitter' }, { 'data-platform': 'facebook' }]
 */
async function getElementAttributes(page, selector, attrNames) {
  const names = Array.isArray(attrNames) ? attrNames : [attrNames];

  try {
    const attributes = await page.evaluate((sel, attrs) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => {
        const result = {};
        attrs.forEach(attr => {
          result[attr] = el.getAttribute(attr);
        });
        return result;
      });
    }, selector, names);

    return attributes;

  } catch (error) {
    console.error(`Error getting element attributes: ${error.message}`);
    return [];
  }
}

/**
 * Find elements by text content
 *
 * Locate elements containing specific text.
 *
 * @param {Page} page - Playwright or Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string|string[]} searchText - Text or array of texts to find
 * @param {boolean} exact - Use exact match vs contains (default: false)
 * @returns {Promise<number[]>} Array of 1-based indices of matching elements
 *
 * @example
 * const indices = await findByText(page, '.platform-card', 'Twitter');
 * // Returns: [1]
 */
async function findByText(page, selector, searchText, exact = false) {
  const texts = Array.isArray(searchText) ? searchText : [searchText];

  try {
    const indices = await page.evaluate((sel, searchTerms, isExact) => {
      const elements = document.querySelectorAll(sel);
      const matches = [];

      Array.from(elements).forEach((el, index) => {
        const content = el.textContent?.trim() || '';

        for (const term of searchTerms) {
          const found = isExact ? content === term : content.includes(term);
          if (found) {
            matches.push(index + 1); // 1-based index
            break;
          }
        }
      });

      return matches;
    }, selector, texts, exact);

    return indices;

  } catch (error) {
    console.error(`Error finding by text: ${error.message}`);
    return [];
  }
}

// Export all functions
module.exports = {
  getPlatformOrder,
  compareOrders,
  waitForDOMStable,
  checkElementsPresent,
  extractTextContent,
  getElementAttributes,
  findByText
};

// Export for ESM if needed
if (typeof module.exports.default !== 'function') {
  module.exports.default = module.exports;
}
