/**
 * Platform metadata comparison utilities
 * Provides functions for comparing and analyzing platform metadata differences
 */

const { isIdentical } = require('./isIdentical.js');
const { changedFields } = require('./changedFields.js');

module.exports = {
  isIdentical,
  changedFields
};
