# applySmartOrdering Implementation Documentation

## Overview

The `applySmartOrdering` function automatically reorders platform preview cards based on the detected page type (article, product, video, or website). This feature prioritizes the most relevant social platforms for each content type.

## Function Location

**File:** `/home/coding/vista/src/public/app.js`  
**Line:** 6740-6762

## Function Signature and Parameters

```javascript
function applySmartOrdering()
```

**Parameters:** None (uses global state variables)
- `currentData` - Global variable holding the current page metadata
- `platformPrefs` - Global object containing user preferences

**Returns:** undefined (side effects only)

## Logic Flow

### 1. Guard Clause (Line 6741)
```javascript
if (!currentData || !platformPrefs.smartOrdering) return;
```
Exits early if:
- No data is currently loaded (`currentData` is null/undefined)
- Smart ordering feature is disabled in user preferences

### 2. Page Type Detection (Line 6743)
```javascript
const pageType = detectPageType(currentData.meta);
```

Calls `detectPageType()` helper function (defined at line 6701) which analyzes:
- Open Graph `og:type` meta tag
- Schema.org structured data
- URL patterns (e.g., `/blog/`, `/product/`)

**Returns:** One of `'article'`, `'product'`, `'video'`, `'website'`, or `'profile'`

### 3. Get Platform Ordering (Line 6744)
```javascript
const preferredOrder = getPlatformOrderForPageType(pageType);
```

Calls `getPlatformOrderForPageType()` helper function (defined at line 6729) which returns a platform priority array:

| Page Type | Platform Priority Order |
|-----------|------------------------|
| **article** | twitter, facebook, linkedin, reddit, bluesky, threads, mastodon |
| **product** | pinterest, facebook, instagram, twitter, linkedin |
| **video** | twitter, facebook, youtube, tiktok, instagram |
| **website** (default) | google, facebook, twitter, linkedin, slack, discord |

### 4. Reorder Platform Groups (Lines 6746-6756)
```javascript
PLATFORM_GROUPS.forEach(group => {
  group.platforms.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
});
```

**Mechanism:**
- Iterates through all `PLATFORM_GROUPS` (defined at line 1013)
  - `social` group (e.g., google, facebook, twitter, linkedin, reddit, etc.)
  - `messaging` group (e.g., slack, discord, whatsapp, etc.)
  - `collab` group (notion, jira, github, trello, figma)
  - `content` group (medium, substack, outlook, gmail, feedly)
- Sorts platforms within each group by their index in the `preferredOrder` array
- Platforms not in the priority list are pushed to the end (index = -1)

### 5. Re-render Previews (Line 6759)
```javascript
renderPreviews(currentData);
```

Re-renders the preview cards with the new platform order.

### 6. Show Toast Notification (Line 6761)
```javascript
showToast(`Page type detected: ${pageType}. Platforms reordered.`, 2000);
```

Displays a 2-second toast notification showing the detected page type.

## Call Sites

### Primary Call Site (Lines 6777-6783)
```javascript
const originalHandleResult2 = handleResult;
handleResult = function(data) {
  originalHandleResult2(data);
  if (platformPrefs.smartOrdering) {
    setTimeout(applySmartOrdering, 200);
  }
};
```

**When called:** After URL inspection results are loaded  
**Timing:** 200ms delay via `setTimeout` to allow UI to settle  
**Trigger:** Every time `handleResult()` is called (i.e., after every URL inspection)

## Configuration

### User Preference Storage
The `smartOrdering` preference is stored in:
- **Memory:** `platformPrefs.smartOrdering` (line 5322)
- **LocalStorage:** Key `vista-platform-prefs` (lines 6204, 6324)

**Default value:** `true` (enabled by default)

### Preference Persistence
- **Loading:** Lines 6185 - Loads from localStorage, defaults to `true` if not set
- **Saving:** Lines 6202 - Persists to localStorage on changes
- **Export:** Lines 6297 - Included in export JSON
- **Import:** Lines 6324 - Restores from imported JSON

### Current DOM Manipulation Approach

The function uses **in-place sorting** of the `PLATFORM_GROUPS` global constant:

1. **Direct mutation** - Sorts `group.platforms` arrays directly without creating copies
2. **No DOM manipulation** - Doesn't touch the DOM directly; instead calls `renderPreviews()` to rebuild
3. **Declarative re-render** - The `renderPreviews()` function completely regenerates the preview grid HTML

This approach ensures:
- Consistent state between data and UI
- Clean separation of concerns (ordering logic vs. rendering)
- Idempotent behavior (can be called multiple times safely)

### Interaction with Custom Drag-and-Drop Ordering

There's an important interaction between smart ordering and manual card reordering:

**In `renderPreviews()` (lines 1383-1390):**
```javascript
let platforms = group.platforms;
if (platformPrefs.cardOrder[group.id]) {
  const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
  const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
  platforms = [...customOrder, ...newPlatforms];
}
```

**Conflict behavior:**
- Smart ordering modifies `group.platforms` arrays in `PLATFORM_GROUPS`
- But `renderPreviews()` checks `platformPrefs.cardOrder[group.id]` **first**
- If a custom order exists for the group, it uses that instead of the smart-ordered array
- Only platforms not in the custom order (newly added platforms) fall back to the `group.platforms` order

**Result:** Manual drag-and-drop reordering **takes precedence** over smart ordering for groups that have been customized.

## Helper Functions

### detectPageType(meta)
**Location:** Lines 6701-6727  
**Purpose:** Analyzes page metadata to determine content type  
**Detection Priority:**
1. Open Graph `og:type` meta tag
2. Schema.org structured data
3. URL path patterns

**Returns:** `'article'`, `'product'`, `'video'`, `'profile'`, or `'website'` (default)

### getPlatformOrderForPageType(pageType)
**Location:** Lines 6729-6738  
**Purpose:** Returns platform priority array for a given page type  
**Returns:** Array of platform ID strings in priority order

## State Dependencies

### Global Variables Used
- `currentData` - Contains page metadata (`meta` property with og:type, schema, etc.)
- `platformPrefs` - User preferences object
- `PLATFORM_GROUPS` - Constant array of platform group definitions

### Side Effects
- Mutates `PLATFORM_GROUPS[].platforms` arrays
- Triggers full preview re-render via `renderPreviews()`
- Displays toast notification

## Integration Points

1. **handleResult()** - Main data loading callback (hooked at line 6777)
2. **renderPreviews()** - Preview rendering function (called at line 6759)
3. **showToast()** - UI notification system (called at line 6761)
4. **localStorage** - Persistence layer for preferences

## Notes

- Smart ordering is **opt-out** (enabled by default, can be disabled)
- The 200ms delay in the hook allows the UI to stabilize before reordering
- Custom card orders (`platformPrefs.cardOrder`) are stored but not currently applied by smart ordering
- The function is idempotent - calling it multiple times with the same data yields consistent results
