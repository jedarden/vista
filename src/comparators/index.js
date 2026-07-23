/**
 * Platform metadata comparison utilities
 * Provides functions for comparing and analyzing platform metadata differences
 */

const { isIdentical } = require('./isIdentical.js');
const { changedFields } = require('./changedFields.js');
const { missingTags } = require('./missingTags.js');

module.exports = {
  isIdentical,
  changedFields,
  missingTags
};
