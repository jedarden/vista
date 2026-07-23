/**
 * Main diff computation function for platform metadata comparison.
 * Compares two /api/compare response objects and returns structured diff results.
 */

const { isIdentical, changedFields, missingTags } = require('./index.js');

/**
 * Transform a PlatformScore object into PlatformMetadata format.
 *
 * PlatformScore has the structure:
 * { grade, score, issues, fixes, platform: { id, name, category, weight } }
 *
 * PlatformMetadata has the structure:
 * { platformId, platformName, category, weight, grade, score, issues, fixes }
 *
 * @param {Object} platformScore - PlatformScore from API response
 * @returns {Object|null} PlatformMetadata or null if input is invalid
 */
function toPlatformMetadata(platformScore) {
  if (!platformScore || typeof platformScore !== 'object') {
    return null;
  }

  const { platform, grade, score, issues, fixes } = platformScore;

  if (!platform) {
    return null;
  }

  return {
    platformId: platform.id,
    platformName: platform.name,
    category: platform.category || 'Uncategorized',
    weight: typeof platform.weight === 'number' ? platform.weight : 1,
    grade: grade || 'F',
    score: typeof score === 'number' ? score : 0,
    issues: Array.isArray(issues) ? issues : [],
    fixes: Array.isArray(fixes) ? fixes : []
  };
}

/**
 * Extract platform scores from a /api/compare response.
 * Handles both successful responses and error cases.
 *
 * @param {Object} response - CompareResponse or CompareError
 * @returns {Object} Map of platformId -> PlatformScore (empty if error)
 */
function extractPlatformScores(response) {
  if (!response || typeof response !== 'object') {
    return {};
  }

  // If this is an error response, return empty scores
  if (response.error) {
    return {};
  }

  // If response has scoring data, extract scores
  if (response.scoring && response.scoring.scores) {
    return response.scoring.scores;
  }

  return {};
}

/**
 * Compute the complete diff between two /api/compare response objects.
 *
 * This function:
 * 1. Extracts platform scores from both responses
 * 2. Iterates through all unique platforms from both responses
 * 3. Uses helper functions to compute per-platform diffs
 * 4. Returns a structured diff object
 *
 * @param {Object} responseA - First /api/compare response object
 * @param {Object} responseB - Second /api/compare response object
 * @returns {Object} Structured diff object with:
 *   - identicalPlatforms: Set<string> - Platform IDs with no changes
 *   - changedFields: Map<string, string[]> - Platform ID -> array of changed field paths
 *   - missingTags: Map<string, string[]> - Platform ID -> array of missing tag names
 */
function computeCompareDiff(responseA, responseB) {
  // Extract platform scores from both responses
  const scoresA = extractPlatformScores(responseA);
  const scoresB = extractPlatformScores(responseB);

  // Collect all unique platform IDs from both responses
  const platformIds = new Set([
    ...Object.keys(scoresA),
    ...Object.keys(scoresB)
  ]);

  // Initialize result structures
  const identicalPlatforms = new Set();
  const changedFields = new Map();
  const missingTagsMap = new Map();

  // Compare each platform
  for (const platformId of platformIds) {
    const scoreA = scoresA[platformId];
    const scoreB = scoresB[platformId];

    // Transform to PlatformMetadata format
    const metaA = toPlatformMetadata(scoreA);
    const metaB = toPlatformMetadata(scoreB);

    // Check if platforms are identical
    if (isIdentical(metaA, metaB)) {
      identicalPlatforms.add(platformId);
    } else {
      // Get changed fields for this platform
      const fields = changedFields(metaA, metaB);
      if (fields.length > 0) {
        changedFields.set(platformId, fields);
      }

      // Get missing tags for this platform
      const tags = missingTags(metaA, metaB);
      if (tags.length > 0) {
        missingTagsMap.set(platformId, tags);
      }
    }
  }

  // Return structured diff object
  return {
    identicalPlatforms,
    changedFields,
    missingTags: missingTagsMap
  };
}

module.exports = { computeCompareDiff, toPlatformMetadata, extractPlatformScores };
