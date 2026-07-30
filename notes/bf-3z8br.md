# Cleanup Stale Entries and Platform Ordering Implementation

**Date:** 2026-07-23  
**Task:** Clean up stale entries and improve platform ordering  
**Bead:** bf-3z8br  
**Status:** ✅ COMPLETE

## Summary

Implemented cleanup functions and improved platform ordering to handle edge cases with orphan and missing group bugs.

## Implementation Details

### 1. cleanupStaleCardOrderEntries() Function

**Location:** `src/public/app.js:7742-7762`

```javascript
function cleanupStaleCardOrderEntries() {
  if (!platformPrefs.cardOrder) return;

  const validGroupIds = new Set(PLATFORM_GROUPS.map(g => g.id));
  let hasChanges = false;

  for (const groupId in platformPrefs.cardOrder) {
    if (!validGroupIds.has(groupId)) {
      console.log(`[cleanupStaleCardOrderEntries] Removing dangling entry for group: ${groupId}`);
      delete platformPrefs.cardOrder[groupId];
      if (platformPrefs.cardOrderMetadata && platformPrefs.cardOrderMetadata[groupId]) {
        delete platformPrefs.cardOrderMetadata[groupId];
      }
      hasChanges = true;
    }
  }

  if (hasChanges) {
    savePlatformPrefs();
  }
}
```

**Features:**
- Iterates through all cardOrder entries
- Compares against valid group IDs from PLATFORM_GROUPS
- Removes both cardOrder and cardOrderMetadata for deleted groups
- Persists changes if any cleanup occurred

### 2. Integration with loadPlatformPrefs()

**Location:** `src/public/app.js:7725`

The cleanup function is called automatically when preferences are loaded:
```javascript
function loadPlatformPrefs() {
  const saved = localStorage.getItem('vista-platform-prefs');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      platformPrefs.favorites = new Set(parsed.favorites || []);
      platformPrefs.hidden = new Set(parsed.hidden || []);
      platformPrefs.columnCount = parsed.columnCount || 3;
      platformPrefs.smartOrdering = parsed.smartOrdering !== false;
      platformPrefs.cardOrder = parsed.cardOrder || {};
      platformPrefs.cardOrderMetadata = parsed.cardOrderMetadata || {};
      
      // Clean up dangling cardOrder entries for groups that no longer exist
      cleanupStaleCardOrderEntries();
    } catch (e) {
      console.warn('Failed to load platform preferences', e);
    }
  }
  // ...
}
```

### 3. Improved Platform Ordering Algorithm

**Location:** `src/public/app.js:1646-1693`

The algorithm now properly handles platforms that exist in `group.platforms` but are missing from `cardOrder`:

```javascript
// P2 - Filter Orphan Bug fix: Properly handle platforms that exist in group.platforms
// but not in cardOrder, without treating them as "new" platforms that get appended
const cardOrderForGroup = platformPrefs.cardOrder[group.id];

// First, collect all platforms that exist in both places
const existingInCardOrder = cardOrderForGroup.filter(pid => group.platforms.includes(pid));

// Then, collect platforms that are in the group but NOT in cardOrder
const missingFromCardOrder = group.platforms.filter(pid => !cardOrderForGroup.includes(pid));

// For missing platforms, insert them at their original group position, not at the end
// This prevents order drift when cardOrder is stale
const platformsWithProperPosition = [];
let cardOrderIdx = 0;
let groupIdx = 0;

while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length) {
  const cardOrderNext = existingInCardOrder[cardOrderIdx];
  const groupNext = group.platforms[groupIdx];

  if (cardOrderNext && cardOrderNext === groupNext) {
    // Platform exists in both - use cardOrder position
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
    groupIdx++;
  } else if (missingFromCardOrder.includes(groupNext)) {
    // Platform is in group but missing from cardOrder - insert here
    platformsWithProperPosition.push(groupNext);
    groupIdx++;
  } else if (cardOrderNext) {
    // Platform is in cardOrder but we've passed it in group - add from cardOrder
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
  } else {
    groupIdx++;
  }
}

platforms = platformsWithProperPosition;
```

**Key Improvements:**
- Separates platforms into "existing in cardOrder" and "missing from cardOrder"
- Merges them at their original group positions instead of appending
- Prevents order drift when cardOrder becomes stale
- Maintains user's custom order while handling group membership changes

## Acceptance Criteria Verification

✅ **cleanupStaleCardOrderEntries() function removes deleted group references**
   - Function implemented at line 7742

✅ **Called on loadPlatformPrefs() to clean non-existent groups**
   - Called at line 7725

✅ **Removes cardOrder and cardOrderMetadata entries for deleted groups**
   - Lines 7751-7754 remove both entries

✅ **Improved platform ordering algorithm in renderPreviews()**
   - Implemented at lines 1646-1693

✅ **Platforms missing from cardOrder are inserted at original group position**
   - Lines 1657-1683 implement proper positioning

✅ **Order drift prevention when cardOrder is stale**
   - Algorithm maintains original positions (line 1657 comment)

## Edge Cases Handled

1. **Orphan Platforms:** Platforms in cardOrder but not in group.platforms are filtered out
2. **Missing Platforms:** Platforms in group.platforms but not in cardOrder are inserted at correct positions
3. **Deleted Groups:** Entire groups removed from PLATFORM_GROUPS are cleaned up from preferences
4. **Stale cardOrder:** When platforms are added/removed from groups, order is preserved correctly
5. **Race Conditions:** Cleanup happens during preference load, preventing inconsistent state

## Testing

The implementation was verified through:
- Manual code review showing all acceptance criteria met
- Existing tests for platform ordering (test-renderpreviews-platform-ordering.js)
- Integration with atomic storage system for reliable persistence

## Related Work

This bead builds on:
- bf-1xb2o: Render guards and page type tracking
- bf-5m48c: Atomic localStorage implementation
- bf-3fl99: cardOrderMetadata structure and drag override protection
- bf-iij4j: Card ordering race conditions (umbrella)
