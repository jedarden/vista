# BF-3hda8: DOM Ordering Verification for Preference Test

## Summary

Added DOM ordering verification to the single platform preference test (`test/integration/single-platform-preference-test.js`).

## Changes Made

### 1. Imported DOM Helper Functions
Added imports for DOM inspection utilities:
```javascript
const {
  getPlatformOrder,
  compareOrders
} = require('../utils/dom-helpers');
```

### 2. Added Test 8: DOM Order Preference Verification
New test case that:
- Waits for DOM to stabilize after page reload
- Extracts actual platform order from DOM using `getPlatformOrder()`
- Constructs expected order with Reddit (favorite platform) first
- Compares expected vs actual order using `compareOrders()`
- Verifies that the favorite platform appears first in DOM
- Reports detailed comparison results including pass rate

## Test Coverage

The extended test now includes 8 test scenarios:
1. ✅ Page Initialization
2. ✅ Get Initial Preferences
3. ✅ Set Reddit as Favorite Platform
4. ✅ Verify Preference Saved to localStorage
5. ✅ Wait for DOM Stabilization
6. ✅ Verify Preference Current State
7. ✅ Verify Preference Persists Across Page Reload
8. ✅ **NEW: DOM Order Preference Verification**

## How It Works

The DOM ordering verification test:
1. Captures the actual DOM order after preferences are set and persisted
2. Builds an expected order array with the favorite platform (Reddit) in first position
3. Uses `compareOrders()` to get detailed comparison metrics
4. Asserts that the favorite platform appears first in the DOM
5. Logs detailed results including pass rate and position information

## Acceptance Criteria Met

- ✅ Extended the single preference test to check DOM element ordering
- ✅ Used DOM inspection helpers (`getPlatformOrder`, `compareOrders`) to capture actual order
- ✅ Compared actual order against expected score-sorted order (favorite first)
- ✅ Test asserts that DOM reflects correct preference-based sorting
- ✅ Test includes the ordering check with detailed reporting

## Running the Test

```bash
node test/integration/single-platform-preference-test.js
```

The test will:
1. Launch a headless Chrome browser
2. Navigate to http://localhost:3000
3. Set Reddit as a favorite platform
4. Verify it saves to localStorage
5. Reload the page
6. Verify persistence
7. **Extract and verify DOM order matches preference-based sorting**

## Expected Behavior

When Reddit is set as a favorite platform:
- Reddit should appear first in the DOM order
- The comparison should show high pass rate
- The test should pass with Reddit in position 1

If the test fails:
- Detailed comparison results will show which positions don't match
- Error message will indicate the actual DOM order
- This helps diagnose preference sorting issues
