# DOM Order Extraction Utility

A Playwright utility for extracting platform card order from the VISTA DOM.

## Overview

This utility provides functions to extract the current platform card order from a running VISTA instance using Playwright. It's designed to be used in tests, verification scripts, and any scenario where you need to verify or record the DOM order of platform cards.

## Installation

The utility is located at `src/utils/extract-dom-order.js` and uses Playwright, which should already be installed in the VISTA project.

## Functions

### `extractDomOrder(page)`

Extracts platform IDs from all platform cards in the DOM, returning them in order.

**Parameters:**
- `page` (Playwright Page) - A valid Playwright Page object

**Returns:**
- `Promise<string[]>` - Array of platform IDs in DOM order

**Example:**
```javascript
const { chromium } = require('playwright');
const { extractDomOrder } = require('./src/utils/extract-dom-order');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForSelector('.platform-card');

  const order = await extractDomOrder(page);
  console.log('Platform order:', order);
  // Output: ['twitter', 'facebook', 'linkedin', 'whatsapp', ...]

  await browser.close();
})();
```

### `extractDomOrderDetailed(page)`

Extracts detailed information about each platform card, including both the platform ID and display name.

**Parameters:**
- `page` (Playwright Page) - A valid Playwright Page object

**Returns:**
- `Promise<Array<{pid: string, name: string|null}>>` - Array of objects with pid and name

**Example:**
```javascript
const { extractDomOrderDetailed } = require('./src/utils/extract-dom-order');

const details = await extractDomOrderDetailed(page);
console.log('Detailed order:', details);
// Output:
// [
//   { pid: 'twitter', name: 'X (Twitter)' },
//   { pid: 'facebook', name: 'Facebook' },
//   { pid: 'linkedin', name: 'LinkedIn' },
//   ...
// ]
```

### `verifyDomOrder(page, expectedOrder)`

Verifies that the actual DOM order matches an expected order and provides detailed differences if they don't match.

**Parameters:**
- `page` (Playwright Page) - A valid Playwright Page object
- `expectedOrder` (string[]) - Expected array of platform IDs

**Returns:**
- `Promise<{matches: boolean, actual: string[], expected: string[], differences: string[]}>`

**Example:**
```javascript
const { verifyDomOrder } = require('./src/utils/extract-dom-order');

const expectedOrder = ['twitter', 'facebook', 'linkedin'];
const verification = await verifyDomOrder(page, expectedOrder);

if (!verification.matches) {
  console.log('Order mismatch!');
  verification.differences.forEach(diff => console.log('  -', diff));
}
```

### `extractDomOrderAndWait(page, options)`

Combines waiting for platform cards to appear and extracting their order in one operation.

**Parameters:**
- `page` (Playwright Page) - A valid Playwright Page object
- `options` (Object) - Optional configuration
  - `timeout` (number) - Maximum wait time in milliseconds (default: 10000)

**Returns:**
- `Promise<string[]>` - Array of platform IDs in DOM order

**Example:**
```javascript
const { extractDomOrderAndWait } = require('./src/utils/extract-dom-order');

const order = await extractDomOrderAndWait(page, { timeout: 5000 });
console.log('Order after wait:', order);
```

## Error Handling

The utility handles several edge cases gracefully:

1. **No page object provided**: Throws a clear error message
2. **No platform cards present**: Returns an empty array `[]` rather than throwing
3. **Missing platform names**: Returns `null` for the name field in detailed extraction
4. **Page evaluation failures**: Throws descriptive error messages

## DOM Structure Requirements

The utility expects the following DOM structure:

```html
<div id="previewGrid">
  <div class="platform-card" data-pid="twitter">
    <span class="card-platform-name">X (Twitter)</span>
    <!-- card content -->
  </div>
  <div class="platform-card" data-pid="facebook">
    <span class="card-platform-name">Facebook</span>
    <!-- card content -->
  </div>
  <!-- more cards -->
</div>
```

## Acceptance Criteria

All acceptance criteria from the task specification have been met:

- ✅ Function takes a page object and returns platform array
- ✅ Extracts cards from the correct DOM selector (`.platform-card` with `data-pid`)
- ✅ Returns order as e.g. `['twitter', 'facebook', 'linkedin']`
- ✅ Handles case when no cards are present (returns empty array)
- ✅ Documented with comprehensive usage examples

## Testing

A syntax validation script is provided at `test-extract-dom-order-syntax.js`:

```bash
node test-extract-dom-order-syntax.js
```

This validates that:
- The utility file exists and is valid JavaScript
- All required functions are properly exported
- JSDoc documentation is present
- Required DOM selectors are used
- Error handling is implemented
- Empty state handling is implemented

## Integration with Existing Tests

The utility can be integrated into existing test scripts that use Playwright:

```javascript
// In your test file
const { extractDomOrder, verifyDomOrder } = require('./src/utils/extract-dom-order');

// After smart ordering is applied
const newOrder = await extractDomOrder(page);
console.log('New platform order:', newOrder);

// Or verify against expected order
const verification = await verifyDomOrder(page, ['twitter', 'facebook', 'linkedin']);
assert(verification.matches, 'Platform order should match expected order');
```
