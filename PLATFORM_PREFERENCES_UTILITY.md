# Platform Preference Change Utility

## Overview

This utility provides functions to programmatically change platform preferences in the VISTA application using Playwright. It enables automated testing and interaction with the platform preference system.

## Files

- `change-platform-preferences.js` - Main utility module
- `change-platform-preferences.example.js` - Usage examples
- `test-change-platform-preferences.js` - Verification tests

## API Reference

### `setPlatformPreferences(page, platformNames, options)`

Set platform preferences in the VISTA application.

**Parameters:**
- `page` (Page) - Playwright page object
- `platformNames` (string[]) - Array of platform names (e.g., ['twitter', 'facebook', 'linkedin'])
- `options` (Object) - Configuration options
  - `clearExisting` (boolean) - Whether to clear existing favorites first (default: true)
  - `triggerReordering` (boolean) - Whether to trigger smart reordering (default: true)
  - `timeout` (number) - Timeout in ms (default: 30000)

**Returns:**
- `Promise<Object>` - Result object with:
  - `success` (boolean) - Whether the operation succeeded
  - `platformIds` (string[]) - Array of platform IDs that were set
  - `count` (number) - Number of platforms set
  - `duration` (number) - Time taken in ms
  - `error` (string) - Error message if failed

**Example:**
```javascript
const { setPlatformPreferences } = require('./change-platform-preferences');

const result = await setPlatformPreferences(page, ['twitter', 'linkedin'], {
  clearExisting: true,
  triggerReordering: true
});

if (result.success) {
  console.log(`Set ${result.count} platforms as favorites`);
}
```

### `triggerPreferenceReordering(page, options)`

Trigger platform preference reordering in the UI.

**Parameters:**
- `page` (Page) - Playwright page object
- `options` (Object) - Configuration options
  - `timeout` (number) - Timeout in ms (default: 10000)

**Returns:**
- `Promise<boolean>` - Whether reordering was triggered successfully

**Example:**
```javascript
const { triggerPreferenceReordering } = require('./change-platform-preferences');

const triggered = await triggerPreferenceReordering(page);
if (triggered) {
  console.log('Reordering triggered');
}
```

### `waitDOMStable(page, options)`

Wait for DOM to stabilize after preference changes.

**Parameters:**
- `page` (Page) - Playwright page object
- `options` (Object) - Configuration options
  - `stableTime` (number) - Time in ms with no changes before considering stable (default: 1000)
  - `maxWait` (number) - Maximum time to wait in ms (default: 10000)

**Returns:**
- `Promise<boolean>` - Whether DOM stabilized successfully

**Example:**
```javascript
const { waitDOMStable } = require('./change-platform-preferences');

await waitDOMStable(page, { stableTime: 2000 });
```

### `getPlatformPreferences(page)`

Get current platform preferences from the page.

**Parameters:**
- `page` (Page) - Playwright page object

**Returns:**
- `Promise<Object|null>` - Current platform preferences or null if unavailable

**Example:**
```javascript
const { getPlatformPreferences } = require('./change-platform-preferences');

const prefs = await getPlatformPreferences(page);
console.log('Favorites:', prefs.favorites);
console.log('Smart ordering:', prefs.smartOrdering);
```

### `setSmartOrdering(page, enabled)`

Enable or disable smart ordering.

**Parameters:**
- `page` (Page) - Playwright page object
- `enabled` (boolean) - Whether smart ordering should be enabled

**Returns:**
- `Promise<boolean>` - Whether the setting was changed successfully

**Example:**
```javascript
const { setSmartOrdering } = require('./change-platform-preferences');

await setSmartOrdering(page, false); // Disable smart ordering
```

### `normalizePlatformIds(platformNames)`

Convert platform names to platform IDs. Handles both direct IDs and human-readable names.

**Parameters:**
- `platformNames` (string[]) - Array of platform names

**Returns:**
- `string[]` - Array of normalized platform IDs

**Supported Platforms:**
- Twitter/X: 'twitter', 'x'
- Social platforms: 'facebook', 'threads', 'linkedin', 'instagram', 'pinterest', 'slack', 'discord', 'telegram', 'whatsapp', 'signal', 'teams', 'imessage'
- Messaging: 'googlechat', 'zoom', 'line', 'kakaotalk'
- Blogging: 'mastodon', 'bluesky', 'medium', 'substack', 'tumblr', 'reddit'
- Search: 'google'
- Productivity: 'notion', 'jira', 'github', 'trello', 'figma', 'outlook', 'gmail', 'feedly'

## How It Works

1. **Platform ID Normalization**: Human-readable platform names are converted to internal IDs
2. **Browser Context Execution**: The utility executes code in the browser's JavaScript context to:
   - Access `window.platformPrefs` object
   - Modify the `favorites` Set
   - Call `savePlatformPrefs()` or manually save to localStorage
3. **Reordering Trigger**: If enabled, triggers `applySmartOrdering()` to reorder platforms based on page type
4. **DOM Stabilization**: Monitors the preview grid for changes and waits until no new updates occur

## Usage Example

```javascript
const { chromium } = require('playwright');
const {
  setPlatformPreferences,
  waitDOMStable,
  getPlatformPreferences
} = require('./change-platform-preferences');

async function example() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to VISTA
    await page.goto('http://localhost:3000');

    // Get initial preferences
    const beforePrefs = await getPlatformPreferences(page);
    console.log('Before:', beforePrefs);

    // Set new platform preferences
    const result = await setPlatformPreferences(page, [
      'twitter', 'facebook', 'linkedin', 'threads'
    ]);

    if (result.success) {
      console.log(`Set ${result.count} platforms as favorites`);
    }

    // Wait for DOM to update
    await waitDOMStable(page);

    // Get updated preferences
    const afterPrefs = await getPlatformPreferences(page);
    console.log('After:', afterPrefs);

  } finally {
    await browser.close();
  }
}

example();
```

## Integration with VISTA

The utility integrates with VISTA's existing platform preference system:

- **Storage**: Preferences stored in `localStorage` under key `'vista-platform-prefs'`
- **Object**: `window.platformPrefs` contains:
  - `favorites` (Set) - Platform IDs marked as favorites
  - `hidden` (Set) - Platform IDs that are hidden
  - `columnCount` (number) - Grid column layout
  - `smartOrdering` (boolean) - Whether smart ordering is enabled
  - `cardOrder` (Object) - Custom platform order per group

## Testing

Run the verification tests:

```bash
node test-change-platform-preferences.js
```

The tests verify:
1. Page loading
2. Getting initial preferences
3. Setting platform preferences
4. Preference persistence
5. DOM stabilization
6. Adding platforms without clearing
7. Disabling smart ordering
8. Re-enabling smart ordering
9. Platform ID normalization

## Error Handling

The utility provides detailed error information:

```javascript
const result = await setPlatformPreferences(page, ['invalid_platform']);

if (!result.success) {
  console.error('Failed:', result.error);
  console.log('Attempted IDs:', result.platformIds);
}
```

Common errors:
- `'platformPrefs not found - page may not be fully loaded'` - Page not fully initialized
- Invalid platform names will be normalized but may not affect the UI

## Browser Requirements

- Playwright with Chromium browser
- JavaScript execution enabled
- Access to localStorage

## Notes

- The utility modifies the page's JavaScript state directly, not through UI elements
- Changes are persisted to localStorage and survive page refreshes
- Smart ordering must be enabled for automatic reordering to occur
- DOM stabilization monitors the `.platform-card` elements for changes
