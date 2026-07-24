# Secondary Search Methodology for Filter Change Handler Verification

**Bead:** bf-2x6j5
**Date:** 2026-07-24
**Purpose:** Design systematic alternative methods to cross-check filter change handler extraction completeness

---

## Executive Summary

This document outlines a comprehensive secondary search methodology using **6 complementary approaches** to verify the completeness of filter change handler extraction in `/home/coding/vista/src/public/app.js`. Each method targets different code patterns and provides independent validation of the initial extraction, which identified **11 handlers** (4 order-resetting, 7 non-order-resetting).

---

## Validation Criteria: What Constitutes a Filter Change Handler?

### Core Definition

A **filter change handler** is any JavaScript function or code block that:

1. **Modifies filter state** - Changes any of these:
   - `platformPrefs.hidden` Set
   - `platformPrefs.favorites` Set
   - `disabledTags` Set
   - Any metadata affecting platform visibility
   - Any preference affecting card order

2. **Triggers a re-render** - Directly or indirectly calls:
   - `renderPreviews(currentData)`
   - `renderPreviews(modifiedData)`
   - Functions that call `renderPreviews()`

3. **Attached to DOM events** - Has an event listener registration:
   - `addEventListener('click', handler)`
   - `addEventListener('change', handler)`
   - `addEventListener('input', handler)`
   - Or similar event binding mechanisms

### Exclusion Criteria (False Positives)

These are **NOT** filter change handlers:

1. **Pure UI updates** - Functions that only update UI without filter changes:
   - Badge preview updates
   - OG generator canvas updates
   - Toast notifications
   - Modal show/hide

2. **Separate feature filters** - Filters unrelated to platform cards:
   - Metadata table filter (only filters table rows)
   - Command palette filter (only filters commands)
   - Heatmap sort (only sorts heatmap)

3. **Render-only functions** - Functions called by handlers, not handlers themselves:
   - `renderPreviews()` - the render function, not a filter handler
   - `updateHiddenList()` - called by handlers, not a handler
   - `updateFavoritesList()` - called by handlers, not a handler

### Guard Flag Signature

The **primary signature** of order-resetting filter handlers is:

```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```

This pattern **prevents** `applySmartOrdering()` from resetting `cardOrder` at lines 8817-8822.

---

## Initial Extraction Review

### Primary Methodology Used (bf-3llbx)

The initial extraction used these approaches:

1. **Event listener grep search**: `grep -n "addEventListener" app.js`
2. **Guard flag grep search**: `grep -n "isFilterOperation" app.js`
3. **Function name tracing**: Following function calls from event listeners
4. **Manual code review**: Reading function implementations to categorize

### Handlers Identified

| Handler | Order Reset? | Guard Flag? | Lines |
|---------|--------------|-------------|-------|
| `toggleHidden()` | YES | YES | 7984-8013 |
| `importPreferences()` | YES | YES | 8082-8140 |
| `toggleWhatIfMode()` | YES | YES | 8146-8187 |
| `applyWhatIfChanges()` | YES | YES | 8254-8305 |
| `toggleFavorite()` | NO | NO | 7867-7890 |
| Metadata Filter | NO | NO | 3991-3993 |
| Command Palette | NO | NO | 9110 |
| Heatmap Sort | NO | NO | 6101-6123 |
| Cropper Toggles | NO | NO | 3481-3516 |
| OG Generator | NO | NO | 310-326 |
| Badge Style | NO | NO | 4765-4788 |

---

## Alternative Search Methods

### Method 1: AST-Based Event Listener Analysis

**Approach:** Parse JavaScript AST and extract all event listener registrations with their handler functions

**Tools:**
- `@babel/parser` to parse JavaScript
- `@babel/traverse` to walk AST nodes
- Custom visitor for `CallExpression` nodes matching `addEventListener`

**Search Targets:**

```javascript
// AST Pattern to Match
CallExpression {
  callee: {
    type: 'MemberExpression',
    property: { name: 'addEventListener' }
  },
  arguments: [
    { type: 'StringLiteral', value: /click|change|input/ }, // Event type
    { type: 'Identifier' | 'ArrowFunctionExpression' }     // Handler
  ]
}
```

**Expected Coverage:**
- **Static event listeners**: Direct function references (e.g., `addEventListener('click', toggleHidden)`)
- **Inline handlers**: Arrow functions (e.g., `addEventListener('click', () => toggleHidden(...))`)
- **Method chaining**: Optional chaining (e.g., `?.addEventListener(...)`)

**False Positive Prevention:**
- Exclude event listeners that don't call filter-modifying functions
- Exclude listeners calling only render functions (e.g., `renderMetadataTable`)
- Cross-reference against `platformPrefs` and `disabledTags` modifications

**Validation:**
```javascript
// AST Output should match known handlers
const expectedListeners = [
  { event: 'click', handler: 'toggleHidden', line: 8055 },
  { event: 'click', handler: 'toggleFavorite', line: 8033 },
  { event: 'click', handler: 'toggleWhatIfMode', line: 8359 },
  { event: 'click', handler: 'applyWhatIfChanges', line: 8245 },
  { event: 'change', handler: 'importPreferences', line: 6831 },
  // ... and 6 non-filtering handlers
];
```

**Implementation:**
```bash
# npm install @babel/parser @babel/traverse @babel/types
node scripts/ast-event-listener-scanner.js src/public/app.js > ast-listeners.json
```

---

### Method 2: Call-Graph Reverse Tracing

**Approach:** Start from known filter-modifying operations and trace backward to find all callers

**Search Strategy:**

1. **Identify filter-modifying operations** (seed functions):
   - Any code modifying `platformPrefs.hidden`
   - Any code modifying `platformPrefs.favorites`
   - Any code modifying `disabledTags`
   - Any code calling `renderPreviews()`

2. **Build call graph**:
   - For each filter-modifying operation, find all parent functions
   - Recursively trace up the call tree
   - Stop at event listeners (top-level handlers)

3. **Validate handler status**:
   - Check if traced function is attached to an event listener
   - Verify event type (`click`, `change`, `input`)
   - Confirm function name matches registration

**Search Commands:**

```bash
# Find all filter state modifications
grep -n "platformPrefs\\.hidden\\.add\\|platformPrefs\\.hidden\\.delete" app.js
grep -n "platformPrefs\\.favorites\\.add\\|platformPrefs\\.favorites\\.delete" app.js
grep -n "disabledTags\\.add\\|disabledTags\\.delete\\|disabledTags\\.clear" app.js

# Find all renderPreviews calls
grep -n "renderPreviews(" app.js

# Trace callers for each modification
# For example, platformPrefs.hidden.add appears in toggleHidden
# Verify toggleHidden is registered as event listener on line 8055
```

**Expected Coverage:**
- Direct callers of filter-modifying operations
- Indirect callers (wrappers that call filter modifiers)
- All event listeners eventually leading to filter state changes

**False Positive Prevention:**
- Exclude test functions (not attached to DOM)
- Exclude internal utilities called by handlers (not handlers themselves)
- Exclude event listeners on non-trigger elements (e.g., document/window)

**Validation:**
```javascript
// Call graph should map these paths
const expectedPaths = [
  {
    eventListener: 'toggleHidden',
    eventTarget: '.platform-item-remove',
    modifies: 'platformPrefs.hidden',
    calls: 'renderPreviews'
  },
  {
    eventListener: 'toggleFavorite',
    eventTarget: '.platform-item-remove',
    modifies: 'platformPrefs.favorites',
    calls: 'updateFavoritesList' // NOT renderPreviews
  },
  // ... etc
];
```

---

### Method 3: Multi-Pattern Regex Search

**Approach:** Use **5 complementary regex patterns** to catch variations not captured by initial grep

**Pattern 1: Event Listener Registrations**

```regex
\.addEventListener\(['"`]click|change|input['"`]\s*,\s*([^)]+)\)
```

**Captures:** Direct function references and inline handlers

**Expected Results:** All 11 handlers plus any missed ones

---

**Pattern 2: Guard Flag Setting Pattern**

```regex
isFilterOperation\s*=\s*true\s*;?\s*\n[^}]*renderPreviews\(
```

**Captures:** Code blocks setting guard flag before calling renderPreviews

**Expected Results:** 4 handlers (toggleHidden, importPreferences, toggleWhatIfMode, applyWhatIfChanges)

**Multi-line Mode:** Required (`grep -Pz` or `perl -ne`)

---

**Pattern 3: Filter State Modification Pattern**

```regex
(platformPrefs\.(hidden|favorites)\.(add|delete|clear)|disabledTags\.(add|delete|clear))
```

**Captures:** All filter state modifications

**Expected Results:** Modifications in 4 order-resetting handlers

---

**Pattern 4: Optional Chaining Event Listeners**

```regex
\?\.addEventListener\(['"`]click|change|input['"`]\s*,\s*([^)]+)\)
```

**Captures:** Event listeners with optional chaining (missed by basic grep)

**Expected Results:** Handlers with `?.addEventListener` pattern

---

**Pattern 5: Dynamic Event Listener Registration**

```regex
forEach\([^)]*\)\s*\{[^}]*addEventListener[^}]*\}
```

**Captures:** Event listeners registered in forEach loops

**Expected Results:** Dynamic registrations for toggleHidden and toggleFavorite

---

**False Positive Prevention:**

1. **Context window analysis**: Extract 5 lines before/after each match
2. **Filter state verification**: Confirm match actually modifies filter state
3. **Render call verification**: Confirm match calls renderPreviews
4. **Event listener cross-check**: Verify match is registered as event listener

**Search Commands:**

```bash
# Pattern 1: Basic event listeners
grep -nE "\.addEventListener\(['\"]click|change|input['\"]," app.js

# Pattern 2: Guard flag + renderPreviews
grep -nPzo "isFilterOperation\s*=\s*true[^}]*renderPreviews\(" app.js | tr '\0' '\n'

# Pattern 3: Filter state modifications
grep -nE "(platformPrefs\.(hidden|favorites)\.(add|delete|clear)|disabledTags\.(add|delete|clear))" app.js

# Pattern 4: Optional chaining
grep -nE "\.addEventListener\(['\"]click|change|input['\"]," app.js | grep "\?"

# Pattern 5: forEach registration
grep -nPzo "forEach[^}]*addEventListener" app.js | tr '\0' '\n'
```

---

### Method 4: DOM Element Reverse Mapping

**Approach:** Start from UI elements in HTML/JS and map back to their event handlers

**Search Strategy:**

1. **Extract all DOM selectors**:
   - `getElementById()` calls
   - `querySelector()` / `querySelectorAll()` calls
   - Direct element references (e.g., `const btn = ...`)

2. **Map selectors to event listeners**:
   - For each selector, find its addEventListener call
   - Extract handler function name
   - Categorize as filter or non-filter

3. **Cross-reference with known handlers**:
   - Check if mapped handler exists in initial catalog
   - Flag any unmapped handlers as potential misses

**Search Commands:**

```bash
# Extract all getElementById calls
grep -n "getElementById(" app.js

# Extract all querySelector calls
grep -n "querySelector(" app.js

# Extract all querySelectorAll calls
grep -n "querySelectorAll(" app.js

# For each selector, find its event listener
# Example: #whatIfToggleBtn
grep -A5 "getElementById('whatIfToggleBtn')" app.js | grep "addEventListener"
```

**Expected Coverage:**
- All DOM elements with event listeners
- Mapping from UI element → handler function
- Identification of any unmapped handlers

**False Positive Prevention:**
- Exclude querySelector calls for non-event purposes (e.g., element manipulation)
- Exclude elements with event listeners unrelated to filtering
- Cross-reference with filter state modifications

**Validation:**

```javascript
// DOM mapping should confirm known paths
const expectedMappings = [
  { selector: '#whatIfToggleBtn', event: 'click', handler: 'toggleWhatIfMode' },
  { selector: '#whatIfApply', event: 'click', handler: 'applyWhatIfChanges' },
  { selector: '#importPrefsInput', event: 'change', handler: 'importPreferences' },
  { selector: '.platform-item-remove', event: 'click', handler: 'toggleHidden/toggleFavorite' },
  // ... etc
];
```

---

### Method 5: Guard Flag Usage Analysis

**Approach:** Trace all usages of `isFilterOperation` flag to find all filter handlers

**Search Strategy:**

1. **Find all guard flag sets**:
   - `isFilterOperation = true`
   - `isFilterOperation = false`

2. **Find all guard flag checks**:
   - `if (isFilterOperation)`
   - `isFilterOperation ||`

3. **Trace code blocks between set and check**:
   - Extract function containing the guard set
   - Verify function calls renderPreviews
   - Verify function is attached to event listener

**Search Commands:**

```bash
# Find all guard flag sets
grep -n "isFilterOperation = true" app.js

# Find all guard flag checks
grep -n "if (isFilterOperation" app.js
grep -n "isFilterOperation ||" app.js

# Extract function context around each set
grep -B20 "isFilterOperation = true" app.js
```

**Expected Results:**
- 4 guard flag sets (in 4 order-resetting handlers)
- 2 guard flag checks (in applySmartOrdering at lines 8817-8822)

**False Positive Prevention:**
- Exclude commented-out guard sets
- Exclude guard sets in non-handler functions (e.g., setup functions)
- Verify guard set is in same function as renderPreviews call

**Validation:**

```javascript
// Guard usage should map to known handlers
const expectedGuardSets = [
  { line: 8002, function: 'toggleHidden', calls: 'renderPreviews' },
  { line: 8121, function: 'importPreferences', calls: 'renderPreviews' },
  { line: 8181, function: 'toggleWhatIfMode', calls: 'renderPreviews' },
  { line: 8288, function: 'applyWhatIfChanges', calls: 'renderPreviews' }
];
```

---

### Method 6: renderPreviews Caller Analysis

**Approach:** Find all functions that call `renderPreviews()` and verify their handler status

**Search Strategy:**

1. **Extract all renderPreviews calls**:
   - `renderPreviews(currentData)`
   - `renderPreviews(modifiedData)`
   - `renderPreviews(data)`

2. **For each call, extract containing function**:
   - Use AST or regex to find function name
   - Get function boundaries

3. **Check if function is an event handler**:
   - Search for addEventListener with this function name
   - Verify event type and target

**Search Commands:**

```bash
# Find all renderPreviews calls
grep -n "renderPreviews(" app.js

# Extract function context for each call
# Example: For line 8006 in toggleHidden
sed -n '7984,8013p' app.js | grep -E "(function |=> \{)"
```

**Expected Coverage:**
- All direct renderPreviews callers (4 handlers)
- Indirect callers (functions called by handlers)
- Identification of any missed handlers

**False Positive Prevention:**
- Exclude renderPreviews call in renderPreviews itself (recursive edge)
- Exclude setup calls (initial page load, etc.)
- Verify caller is attached to DOM event

**Validation:**

```javascript
// renderPreviews callers should match known handlers
const expectedCallers = [
  { function: 'toggleHidden', line: 8006, hasGuard: true, isHandler: true },
  { function: 'importPreferences', line: 8122, hasGuard: true, isHandler: true },
  { function: 'toggleWhatIfMode', line: 8182, hasGuard: true, isHandler: true },
  { function: 'applyWhatIfChanges', line: 8289, hasGuard: true, isHandler: true },
  { function: 'applySmartOrdering', line: 8785, hasGuard: false, isHandler: false }
];
```

---

## Cross-Check Strategy

### Combining Methods

Use **intersection approach** across all 6 methods:

1. **Union all results**:
   - Collect all handlers from all methods
   - Create master list with duplicates marked

2. **Intersection validation**:
   - Handlers found by ≥3 methods are **high-confidence**
   - Handlers found by 2 methods are **medium-confidence**
   - Handlers found by 1 method are **low-confidence** (potential false positives)

3. **Gap analysis**:
   - Compare master list against initial catalog (11 handlers)
   - Flag handlers in catalog but not found by secondary methods
   - Flag handlers found by secondary methods but not in catalog

### Expected Outcomes

**If initial extraction is complete:**
- All 11 catalog handlers found by ≥3 methods
- No uncataloged handlers found
- High confidence in completeness

**If initial extraction missed handlers:**
- Uncataloged handlers appear in secondary results
- Need to update catalog

**If initial extraction has false positives:**
- Some catalog handlers not found by secondary methods
- Need to investigate and possibly remove from catalog

---

## False Positive Prevention Summary

### Common False Positive Patterns

1. **UI-only event listeners**:
   - Badge preview updates
   - OG generator changes
   - Cropper toggle overlays

2. **Separate feature filters**:
   - Metadata table filter (doesn't affect cards)
   - Command palette filter (doesn't affect cards)
   - Heatmap sort (doesn't affect cards)

3. **Internal function calls**:
   - `renderPreviews()` itself
   - `updateHiddenList()` (called by handlers)
   - `updateFavoritesList()` (called by handlers)

4. **Test/debug functions**:
   - Debug logging functions
   - Test event listeners (if any)

### Prevention Techniques

1. **Filter state verification**:
   - Confirm handler modifies `platformPrefs`, `disabledTags`, or related
   - Exclude handlers that only update UI

2. **Render call verification**:
   - Confirm handler calls `renderPreviews()` for order-resetting handlers
   - Verify handler triggers card re-render

3. **Event listener cross-check**:
   - Confirm handler is registered as event listener
   - Exclude internal functions called by handlers

4. **Multi-method validation**:
   - Require handler found by ≥2 methods to be considered valid
   - Flag single-method hits for manual review

---

## Implementation Plan

### Phase 1: Automated Scans (Methods 1-3)

1. **AST-based scan** (Method 1):
   ```bash
   node scripts/ast-event-listener-scanner.js > docs/verification/ast-listeners.json
   ```

2. **Call-graph trace** (Method 2):
   ```bash
   node scripts/call-graph-tracer.js > docs/verification/call-graph.json
   ```

3. **Multi-pattern regex** (Method 3):
   ```bash
   bash scripts/regex-search.sh > docs/verification/regex-results.txt
   ```

### Phase 2: Manual Cross-Reference (Methods 4-6)

4. **DOM element mapping** (Method 4):
   ```bash
   grep -n "getElementById\|querySelector" app.js > docs/verification/dom-selectors.txt
   ```

5. **Guard flag analysis** (Method 5):
   ```bash
   grep -n "isFilterOperation" app.js > docs/verification/guard-usage.txt
   ```

6. **renderPreviews caller trace** (Method 6):
   ```bash
   grep -n "renderPreviews(" app.js > docs/verification/render-calls.txt
   ```

### Phase 3: Intersection Analysis

7. **Combine results**:
   ```bash
   node scripts/intersect-results.js > docs/verification/cross-analysis.json
   ```

8. **Generate report**:
   ```bash
   node scripts/generate-verification-report.js > docs/bf-2x6j5-verification-results.md
   ```

---

## Success Criteria

### Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| ✅ Identify 3+ alternative search methods | **6 methods identified** |
| ✅ Document search strategy and coverage | **Detailed in each method section** |
| ✅ Define validation criteria | **Core definition + exclusion criteria specified** |
| ✅ Plan false positive prevention | **Common patterns + prevention techniques documented** |

### Completeness Thresholds

- **High confidence handler**: Found by ≥3 methods
- **Medium confidence handler**: Found by 2 methods
- **Low confidence handler**: Found by 1 method (needs investigation)
- **False positive**: Found by 0 methods or fails validation criteria

### Next Steps

1. Implement all 6 search methods
2. Cross-reference results against initial catalog
3. Investigate any gaps or discrepancies
4. Update catalog if needed
5. Document findings in verification report

---

## Related Documentation

- **bf-3llbx:** Initial filter change handler catalog
- **bf-40knx:** DOM selector mapping for handlers
- **bf-440st:** DOM element mapping for handlers
- **bf-1pwfw:** Order-reset logic analysis

---

**Document Version:** 1.0
**Last Updated:** 2026-07-24
**Status:** Complete - Ready for implementation phase
