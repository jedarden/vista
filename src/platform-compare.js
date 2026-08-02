'use strict';

/**
 * Helper functions for comparing platform metadata objects.
 * Used for analyzing changes in meta tags across redirect hops or
 * comparing different platform implementations.
 */

/**
 * Critical metadata fields for comparison.
 * These fields are the most important for social sharing previews.
 */
const CRITICAL_FIELDS = [
  'title',
  'description',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'ogType',
  'ogUrl',
  'twitterCard',
  'twitterTitle',
  'twitterDescription',
  'twitterImage',
  'canonical',
  'robots',
];

/**
 * Check if two platform metadata objects are identical.
 *
 * @param {Object} metaA - First metadata object
 * @param {Object} metaB - Second metadata object
 * @returns {boolean} true if all critical fields match
 */
function isIdentical(metaA, metaB) {
  if (!metaA || !metaB) {
    return metaA === metaB;
  }

  // Check each critical field
  for (const field of CRITICAL_FIELDS) {
    const valA = metaA[field];
    const valB = metaB[field];

    // Treat null, undefined, and empty string as equivalent
    const normalizedA = (valA === null || valA === undefined) ? '' : String(valA).trim();
    const normalizedB = (valB === null || valB === undefined) ? '' : String(valB).trim();

    if (normalizedA !== normalizedB) {
      return false;
    }
  }

  return true;
}

/**
 * Extract changed fields between two platform metadata objects.
 *
 * @param {Object} metaA - First metadata object (before)
 * @param {Object} metaB - Second metadata object (after)
 * @returns {Object[]} Array of changed field objects with { field, oldValue, newValue }
 */
function getChangedFields(metaA, metaB) {
  if (!metaA || !metaB) {
    return [];
  }

  const changes = [];

  for (const field of CRITICAL_FIELDS) {
    const valA = metaA[field];
    const valB = metaB[field];

    // Normalize values for comparison
    const normalizedA = (valA === null || valA === undefined) ? '' : String(valA).trim();
    const normalizedB = (valB === null || valB === undefined) ? '' : String(valB).trim();

    if (normalizedA !== normalizedB) {
      changes.push({
        field,
        oldValue: valA,
        newValue: valB,
      });
    }
  }

  return changes;
}

/**
 * Detect missing tags in one platform metadata object compared to another.
 * A tag is considered "missing" if it exists in the source but is empty/undefined in the target.
 *
 * @param {Object} sourceMeta - Source metadata object (should have)
 * @param {Object} targetMeta - Target metadata object (to check against)
 * @returns {Object[]} Array of missing tag objects with { field, expectedValue }
 */
function getMissingTags(sourceMeta, targetMeta) {
  if (!sourceMeta || !targetMeta) {
    return [];
  }

  const missing = [];

  for (const field of CRITICAL_FIELDS) {
    const sourceVal = sourceMeta[field];
    const targetVal = targetMeta[field];

    // Normalize source value
    const normalizedSource = (sourceVal === null || sourceVal === undefined) ? '' : String(sourceVal).trim();
    const normalizedTarget = (targetVal === null || targetVal === undefined) ? '' : String(targetVal).trim();

    // If source has a value but target doesn't, it's missing
    if (normalizedSource !== '' && normalizedTarget === '') {
      missing.push({
        field,
        expectedValue: sourceVal,
      });
    }
  }

  return missing;
}

/**
 * Compare two platform metadata objects and return a comprehensive comparison.
 *
 * @param {Object} metaA - First metadata object
 * @param {Object} metaB - Second metadata object
 * @returns {Object} Comparison result with { isIdentical, changedFields, missingInA, missingInB }
 */
function comparePlatformMeta(metaA, metaB) {
  return {
    isIdentical: isIdentical(metaA, metaB),
    changedFields: getChangedFields(metaA, metaB),
    missingInA: getMissingTags(metaB, metaA), // Tags present in B but missing in A
    missingInB: getMissingTags(metaA, metaB), // Tags present in A but missing in B
  };
}

/**
 * Get a human-readable summary of metadata changes.
 *
 * @param {Object} comparison - Result from comparePlatformMeta
 * @returns {string} Formatted string describing the differences
 */
function formatComparisonSummary(comparison) {
  const lines = [];

  if (comparison.isIdentical) {
    lines.push('✓ Metadata is identical');
  } else {
    lines.push('✗ Metadata differs');

    if (comparison.changedFields.length > 0) {
      lines.push('\nChanged fields:');
      for (const change of comparison.changedFields) {
        const oldVal = change.oldValue || '(empty)';
        const newVal = change.newValue || '(empty)';
        lines.push(`  - ${change.field}: "${oldVal}" → "${newVal}"`);
      }
    }

    if (comparison.missingInA.length > 0) {
      lines.push('\nMissing in first object (present in second):');
      for (const missing of comparison.missingInA) {
        lines.push(`  - ${missing.field}: expected "${missing.expectedValue}"`);
      }
    }

    if (comparison.missingInB.length > 0) {
      lines.push('\nMissing in second object (present in first):');
      for (const missing of comparison.missingInB) {
        lines.push(`  - ${missing.field}: expected "${missing.expectedValue}"`);
      }
    }
  }

  return lines.join('\n');
}

module.exports = {
  isIdentical,
  getChangedFields,
  getMissingTags,
  comparePlatformMeta,
  formatComparisonSummary,
  CRITICAL_FIELDS,
};
