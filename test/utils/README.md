# DOM Helper Utilities

Testable, reusable DOM inspection utilities for VISTA testing.

## Overview

This module provides foundation utilities for DOM-based testing and verification. These functions are designed to work with both Playwright and Puppeteer, making them suitable for various testing scenarios.

## Functions

### `getPlatformOrder(page, options)`

Extracts platform card order from DOM.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `options.selector` - CSS selector for platform cards (default: `.platform-card`)
- `options.timeout` - Maximum wait time in ms (default: 5000)

**Returns:** `Promise<string[]>` - Array of platform identifiers in DOM order

**Example:**
```javascript
const platforms = await getPlatformOrder(page);
// Returns: ['twitter', 'facebook', 'linkedin', 'reddit']
```

### `compareOrders(expected, actual)`

Compares expected vs actual platform order.

**Parameters:**
- `expected` - Array of expected platform identifiers
- `actual` - Array of actual platform identifiers from DOM

**Returns:** Object with:
- `passed` - Boolean: true if perfect match
- `matches` - Number of matching positions
- `total` - Total expected platforms
- `passRate` - Percentage of correct positions
- `results` - Array of position-by-position comparison details
- `missing` - Platforms in expected but not in actual
- `extra` - Platforms in actual but not in expected

**Example:**
```javascript
const comparison = compareOrders(
  ['twitter', 'facebook', 'linkedin'],
  ['twitter', 'linkedin', 'facebook']
);
// Returns:
// {
//   passed: false,
//   matches: 1,
//   total: 3,
//   passRate: 33.33,
//   results: [...],
//   missing: [],
//   extra: []
// }
```

### `waitForDOMStable(page, options)`

Waits for DOM to stabilize after reordering.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `options.selector` - CSS selector for elements to monitor (default: `.platform-card`)
- `options.maxWait` - Maximum wait time in ms (default: 5000)
- `options.interval` - Check interval in ms (default: 100)
- `options.stableCount` - Consecutive stable checks required (default: 10)

**Returns:** `Promise<boolean>` - true if DOM stabilized, false if timeout

**Example:**
```javascript
const stable = await waitForDOMStable(page);
if (!stable) {
  console.warn('DOM did not stabilize');
}
```

### `checkElementsPresent(page, selectors)`

Checks if elements are present in DOM.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `selectors` - CSS selector(s) (string or array)

**Returns:** Object with count/present for single selector, or object with booleans for array

**Example:**
```javascript
const present = await checkElementsPresent(page, '.platform-card');
// Returns: { count: 5, present: true }

const checks = await checkElementsPresent(page, ['.platform-card', '#url-input']);
// Returns: { '.platform-card': true, '#url-input': false }
```

### `extractTextContent(page, selector, options)`

Extracts text content from elements.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `selector` - CSS selector
- `options.trim` - Trim whitespace (default: true)
- `options.filterEmpty` - Remove empty strings (default: true)

**Returns:** `Promise<string[]>` - Array of text content

**Example:**
```javascript
const names = await extractTextContent(page, '.platform-name');
// Returns: ['Twitter', 'Facebook', 'LinkedIn']
```

### `getElementAttributes(page, selector, attrNames)`

Extracts attributes from elements.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `selector` - CSS selector
- `attrNames` - Attribute name(s) to extract

**Returns:** `Promise<Object[]>` - Array of objects with attribute values

**Example:**
```javascript
const data = await getElementAttributes(page, '.platform-card', 'data-platform');
// Returns: [{ 'data-platform': 'twitter' }, { 'data-platform': 'facebook' }]
```

### `findByText(page, selector, searchText, exact)`

Finds elements by text content.

**Parameters:**
- `page` - Playwright or Puppeteer page object
- `selector` - CSS selector
- `searchText` - Text or array of texts to find
- `exact` - Use exact match vs contains (default: false)

**Returns:** `Promise<number[]>` - Array of 1-based indices of matching elements

**Example:**
```javascript
const indices = await findByText(page, '.platform-card', 'Twitter');
// Returns: [1]
```

## Usage

### CommonJS
```javascript
const { getPlatformOrder, compareOrders } = require('./test/utils/dom-helpers');

const platforms = await getPlatformOrder(page);
const comparison = compareOrders(expectedOrder, platforms);
```

### ESM
```javascript
import { getPlatformOrder, compareOrders } from './test/utils/dom-helpers.js';

const platforms = await getPlatformOrder(page);
const comparison = compareOrders(expectedOrder, platforms);
```

## Testing

Run unit tests:
```bash
node test/utils/dom-helpers.test.js
```

## Browser Compatibility

- Playwright (recommended)
- Puppeteer (with minor syntax differences)

Functions automatically handle browser API differences (e.g., `page.waitForTimeout` vs `setTimeout`).
