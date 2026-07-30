/**
 * Deep equality check for platform metadata objects.
 * Compares all fields including nested arrays and handles edge cases.
 */

/**
 * Check if two values are deeply equal.
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
 * Check if two platform metadata objects are identical.
 * Performs deep equality check on all fields including nested arrays.
 *
 * @param {PlatformMetadata|null|undefined} a - First platform metadata object
 * @param {PlatformMetadata|null|undefined} b - Second platform metadata object
 * @returns {boolean} true if the objects are identical, false otherwise
 */
function isIdentical(a, b) {
  // Handle null/undefined cases
  if (a === null || a === undefined) {
    return b === null || b === undefined;
  }
  if (b === null || b === undefined) {
    return false;
  }

  // Check all PlatformMetadata fields
  return (
    deepEqual(a.platformId, b.platformId) &&
    deepEqual(a.platformName, b.platformName) &&
    deepEqual(a.category, b.category) &&
    deepEqual(a.weight, b.weight) &&
    deepEqual(a.grade, b.grade) &&
    deepEqual(a.score, b.score) &&
    deepEqual(a.issues, b.issues) &&
    deepEqual(a.fixes, b.fixes)
  );
}

module.exports = { isIdentical };
