'use strict';

/**
 * Platform metadata comparison utilities (browser-compatible)
 * Extracted from src/comparators for client-side use in compare mode
 */

// =============================================================================
// isIdentical - Deep equality check for platform metadata
// =============================================================================

function deepEqual(a, b) {
  if (a === null || a === undefined) {
    return b === null || b === undefined;
  }
  if (b === null || b === undefined) {
    return false;
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

function isIdentical(a, b) {
  return deepEqual(a, b);
}

// =============================================================================
// changedFields - Extract field paths that differ
// =============================================================================

function collectChangedFields(a, b, prefix, results) {
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

  if (typeof a !== 'object' || typeof b !== 'object') {
    if (a !== b) {
      results.push(prefix);
    }
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (!deepEqual(a, b)) {
      results.push(prefix);
    }
    return;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    results.push(prefix);
    return;
  }

  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const aValue = a[key];
      const bValue = b[key];

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
        if (!deepEqual(aValue, bValue)) {
          results.push(fieldPath);
        }
      }
    }
    return;
  }

  if (a !== b) {
    results.push(prefix);
  }
}

function changedFields(a, b) {
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return [];
  }

  if (a === null || a === undefined) {
    const results = [];
    collectChangedFields({}, b || '', '', results);
    return results;
  }

  if (b === null || b === undefined) {
    const results = [];
    collectChangedFields(a, {}, '', results);
    return results;
  }

  const results = [];
  collectChangedFields(a, b, '', results);
  return results;
}

// =============================================================================
// missingTags - Find tags present in one platform but missing in another
// =============================================================================

function extractTag(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const missingPattern = /(?:^|\s)(missing\s+)?([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)\s+missing$/i;
  const missingMatch = text.match(missingPattern);
  if (missingMatch) {
    return missingMatch[2].toLowerCase();
  }

  const noPattern = /(?:^|\s)no\s+([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)/i;
  const noMatch = text.match(noPattern);
  if (noMatch) {
    return noMatch[1].toLowerCase();
  }

  const addPattern = /(?:^|\s)add\s+([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)(?:\s+meta\s+tag)?$/i;
  const addMatch = text.match(addPattern);
  if (addMatch) {
    return addMatch[1].toLowerCase();
  }

  return null;
}

function extractTagsFromPlatform(platform) {
  const tags = new Set();

  if (!platform) {
    return tags;
  }

  if (Array.isArray(platform.issues)) {
    for (const issue of platform.issues) {
      const tag = extractTag(issue);
      if (tag) {
        tags.add(tag);
      }
    }
  }

  if (Array.isArray(platform.fixes)) {
    for (const fix of platform.fixes) {
      const tag = extractTag(fix);
      if (tag) {
        tags.add(tag);
      }
    }
  }

  return tags;
}

function missingTags(a, b) {
  if (!a) {
    return [];
  }

  if (!b) {
    const tagsA = extractTagsFromPlatform(a);
    return Array.from(tagsA).sort();
  }

  const tagsA = extractTagsFromPlatform(a);
  const tagsB = extractTagsFromPlatform(b);

  const missing = [];
  for (const tag of tagsA) {
    if (!tagsB.has(tag)) {
      missing.push(tag);
    }
  }

  return missing.sort();
}

// =============================================================================
// computeCompareDiff - Main diff computation for platform comparison
// =============================================================================

function computePlatformDiff(scores1, scores2) {
  const allPids = new Set([...Object.keys(scores1), ...Object.keys(scores2)]);
  const platformDiffs = {};

  for (const pid of allPids) {
    const score1 = scores1[pid];
    const score2 = scores2[pid];

    if (!score1 || !score2) continue;

    // Transform PlatformScore to PlatformMetadata format
    const meta1 = score1.platform ? {
      platformId: score1.platform.id,
      platformName: score1.platform.name,
      grade: score1.grade || 'F',
      score: typeof score1.score === 'number' ? score1.score : 0,
      issues: Array.isArray(score1.issues) ? score1.issues : [],
      fixes: Array.isArray(score1.fixes) ? score1.fixes : []
    } : null;

    const meta2 = score2.platform ? {
      platformId: score2.platform.id,
      platformName: score2.platform.name,
      grade: score2.grade || 'F',
      score: typeof score2.score === 'number' ? score2.score : 0,
      issues: Array.isArray(score2.issues) ? score2.issues : [],
      fixes: Array.isArray(score2.fixes) ? score2.fixes : []
    } : null;

    if (!meta1 || !meta2) continue;

    platformDiffs[pid] = {
      identical: isIdentical(meta1, meta2),
      changedFields: changedFields(meta1, meta2),
      missingTags: missingTags(meta1, meta2)
    };
  }

  return platformDiffs;
}

// =============================================================================
// highlightChangedText - Wrap changed field text in green highlight spans
// =============================================================================

/**
 * Wrap text in a green highlight span if the field path is in the changed fields array.
 *
 * @param {string} text - The text value to potentially highlight
 * @param {string[]} changedFields - Array of changed field paths (e.g., ['score', 'meta.og.title'])
 * @param {string} fieldPath - The current field path to check (e.g., 'score', 'meta.og.title')
 * @returns {string} HTML with green highlight span if changed, otherwise plain text
 */
function highlightChangedText(text, changedFields, fieldPath) {
  const normalizedText = String(text ?? '');
  const isChanged = changedFields.includes(fieldPath);

  if (isChanged) {
    return `<span class="diff-changed">${normalizedText}</span>`;
  }

  return normalizedText;
}

// =============================================================================
// Browser exports
// =============================================================================

if (typeof window !== 'undefined') {
  window.platformDiff = {
    isIdentical,
    changedFields,
    missingTags,
    computePlatformDiff,
    highlightChangedText
  };
}

// =============================================================================
// Node.js exports
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isIdentical,
    changedFields,
    missingTags,
    computePlatformDiff,
    highlightChangedText
  };
}
