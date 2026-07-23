/**
 * Extract changed fields between two platform metadata objects.
 * Returns an array of field paths that differ between the two objects.
 */

/**
 * Deep equality check for two values.
 * Handles primitives, arrays, and nested objects.
 */
function deepEqual(a, b) {
  // Handle null/undefined cases
  if (a === null || a === undefined) {
    return b === null || b === undefined;
  }
  if (b === null || b === undefined) {
    return false;
  }

  // Primitive types (string, number, boolean) use strict equality
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // If one is array and the other isn't, they're not equal
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Object comparison (for plain objects)
  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Recursively collect all field paths that differ between two objects.
 *
 * @param {any} a - First value (from state A)
 * @param {any} b - Second value (from state B)
 * @param {string} prefix - Current field path prefix
 * @param {Array} results - Array to collect changed field paths
 */
function collectChangedFields(a, b, prefix, results) {
  // Handle null/undefined mismatches
  if (a === null || a === undefined) {
    if (b !== null && b !== undefined) {
      results.push(prefix);
    }
    return;
  }
  if (b === null || b === undefined) {
    results.push(prefix);
    return;
  }

  // Primitive types - check equality
  if (typeof a !== 'object' || typeof b !== 'object') {
    if (a !== b) {
      results.push(prefix);
    }
    return;
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (!deepEqual(a, b)) {
      results.push(prefix);
    }
    return;
  }

  // If one is array and the other isn't, it's a change
  if (Array.isArray(a) || Array.isArray(b)) {
    results.push(prefix);
    return;
  }

  // Object comparison - recurse into nested fields
  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const aValue = a[key];
      const bValue = b[key];

      // Recurse for nested objects
      if (
        aValue !== null &&
        aValue !== undefined &&
        typeof aValue === 'object' &&
        !Array.isArray(aValue) &&
        bValue !== null &&
        bValue !== undefined &&
        typeof bValue === 'object' &&
        !Array.isArray(bValue)
      ) {
        collectChangedFields(aValue, bValue, fieldPath, results);
      } else {
        // Leaf comparison
        if (!deepEqual(aValue, bValue)) {
          results.push(fieldPath);
        }
      }
    }
    return;
  }

  // Fallback for edge cases
  if (a !== b) {
    results.push(prefix);
  }
}

/**
 * Extract the list of changed fields between two platform metadata objects.
 *
 * Returns an array of field paths (strings) that differ between the two objects.
 * Field paths use dot notation for nested properties (e.g., 'tags.count', 'meta.og.title').
 *
 * @param {Object|null|undefined} a - First platform metadata object
 * @param {Object|null|undefined} b - Second platform metadata object
 * @returns {string[]} Array of changed field paths (empty array if identical)
 */
function changedFields(a, b) {
  // Handle null/undefined cases
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return [];
  }

  if (a === null || a === undefined) {
    // All fields in b are "added"
    const results = [];
    collectChangedFields({}, b || '', '', results);
    return results;
  }

  if (b === null || b === undefined) {
    // All fields in a are "removed"
    const results = [];
    collectChangedFields(a, {}, '', results);
    return results;
  }

  const results = [];
  collectChangedFields(a, b, '', results);
  return results;
}

module.exports = { changedFields };
