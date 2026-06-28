# Task bf-8bka: Update URL hash on What If tag disable

## Status: Already Implemented

This functionality was already implemented in commit `c540228` (bead bf-139: "Implement URL hash state encoding for shareability").

## Implementation Details

All 5 acceptance criteria are satisfied:

1. **When a tag is disabled, append/update `#without=` parameter in hash**
   - Implemented in checkbox change handler (lines 7353-7361 in app.js)
   - Calls `updateHash()` on checkbox change

2. **Format: `#without=og:image,twitter:card` (comma-separated)**
   - Implemented in `updateHash()` function (lines 395-398)
   - Uses `Array.from(disabledTags).join(',')` for comma separation

3. **When tag is re-enabled, remove it from `#without=` list**
   - Implemented in checkbox change handler (line 7358)
   - Uses `disabledTags.delete(cb.dataset.tag)` when checkbox is checked

4. **If all tags re-enabled, remove `#without=` parameter entirely**
   - Implemented in `updateHash()` function (line 397)
   - Only pushes `without=` parameter if `without` is non-empty

5. **Hash update should not cause page reload**
   - Implemented in `updateHash()` function (line 402)
   - Uses `history.replaceState(null, null, hash)` instead of `location.hash =`

## Code References

**Checkbox change handler (app.js:7353-7361):**
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

**Hash encoding (app.js:395-398):**
```javascript
// What If disabled tags
const without = options.without !== undefined ? options.without : Array.from(disabledTags).join(',');
if (without) {
  parts.push(`without=${without}`);
}
```

**Hash update without reload (app.js:402):**
```javascript
const hash = parts.length > 0 ? `#${parts.join('&')}` : '';
history.replaceState(null, null, hash);
```

## Test Coverage

The test file `test-whatif-hash-update.html` was created to verify all acceptance criteria. All tests pass with the existing implementation.

## Conclusion

No code changes were required. The functionality requested in this bead was already implemented as part of the broader URL hash state encoding feature.
