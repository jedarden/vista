/**
 * Detect tags present in one platform metadata object but missing from another.
 * Compares tag arrays between two platform objects and returns an array of
 * tag names that are present in the first but not in the second.
 */

/**
 * Extract tag names from an issues/fixes string.
 *
 * Handles patterns like:
 * - "og:title missing" → "og:title"
 * - "Missing og:title" → "og:title"
 * - "og:image missing" → "og:image"
 * - "no twitter:card" → "twitter:card"
 * - "Add og:title meta tag" → "og:title"
 * - "add twitter:card" → "twitter:card"
 *
 * Tag names must contain a colon (:) to distinguish real meta tags from
 * other text. This prevents false positives like extracting "pattern" from
 * "also no pattern here".
 *
 * @param {string} text - The issue or fix text
 * @returns {string|null} The extracted tag name or null
 */
function extractTag(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Pattern 1: "X missing" or "Missing X" at end of string
  // Requires tag to contain a colon (e.g., og:title, twitter:card)
  const missingPattern = /(?:^|\s)(missing\s+)?([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)\s+missing$/i;
  const missingMatch = text.match(missingPattern);
  if (missingMatch) {
    return missingMatch[2].toLowerCase();
  }

  // Pattern 2: "no X" at start or middle
  // Requires tag to contain a colon (e.g., og:title, twitter:card)
  const noPattern = /(?:^|\s)no\s+([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)/i;
  const noMatch = text.match(noPattern);
  if (noMatch) {
    return noMatch[1].toLowerCase();
  }

  // Pattern 3: "Add X meta tag" or "add X"
  // Requires tag to contain a colon (e.g., og:title, twitter:card)
  const addPattern = /(?:^|\s)add\s+([a-z][a-z0-9_-]*:[a-z0-9:_.-]+)(?:\s+meta\s+tag)?$/i;
  const addMatch = text.match(addPattern);
  if (addMatch) {
    return addMatch[1].toLowerCase();
  }

  return null;
}

/**
 * Extract all unique tag names from a platform metadata object's issues and fixes.
 *
 * @param {Object|null|undefined} platform - Platform metadata object
 * @returns {Set<string>} Set of unique tag names
 */
function extractTagsFromPlatform(platform) {
  const tags = new Set();

  if (!platform) {
    return tags;
  }

  // Extract tags from issues array
  if (Array.isArray(platform.issues)) {
    for (const issue of platform.issues) {
      const tag = extractTag(issue);
      if (tag) {
        tags.add(tag);
      }
    }
  }

  // Extract tags from fixes array
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

/**
 * Find tags present in the first platform but missing from the second.
 *
 * Returns an array of tag names (strings) that are referenced in the first
 * platform's issues/fixes but not in the second platform's issues/fixes.
 *
 * @param {Object|null|undefined} a - First platform metadata object
 * @param {Object|null|undefined} b - Second platform metadata object
 * @returns {string[]} Array of tag names missing from the second (empty if none)
 *
 * @example
 * const a = { platformId: 'twitter', issues: ['og:title missing'], fixes: [] };
 * const b = { platformId: 'twitter', issues: [], fixes: [] };
 * missingTags(a, b); // ['og:title']
 *
 * @example
 * const objA = { issues: ['no twitter:card', 'og:image missing'], fixes: [] };
 * const objB = { issues: ['no twitter:card'], fixes: ['Add og:title'] };
 * missingTags(objA, objB); // ['og:image']
 */
function missingTags(a, b) {
  // Handle null/undefined cases
  if (!a) {
    // No tags in first platform, so nothing is missing
    return [];
  }

  if (!b) {
    // All tags from first platform are missing from second
    const tagsA = extractTagsFromPlatform(a);
    return Array.from(tagsA).sort();
  }

  const tagsA = extractTagsFromPlatform(a);
  const tagsB = extractTagsFromPlatform(b);

  // Find tags in A but not in B
  const missing = [];
  for (const tag of tagsA) {
    if (!tagsB.has(tag)) {
      missing.push(tag);
    }
  }

  return missing.sort();
}

module.exports = { missingTags };
