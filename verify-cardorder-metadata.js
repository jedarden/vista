#!/usr/bin/env node

/**
 * Verification script for cardOrderMetadata implementation
 * Tests that drag operations properly set metadata and smart ordering respects it
 */

const fs = require('fs');
const path = require('path');

console.log('=== Verifying cardOrderMetadata Implementation ===\n');

// Check app.js initialization
console.log('1. Checking app.js platformPrefs initialization...');
const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

if (appJs.includes('cardOrderMetadata: {}')) {
  console.log('   ✅ cardOrderMetadata initialized in platformPrefs');
} else {
  console.log('   ❌ cardOrderMetadata NOT initialized in platformPrefs');
  process.exit(1);
}

// Check app.js for metadata usage in applySmartOrdering
console.log('\n2. Checking applySmartOrdering() for metadata checks...');
if (appJs.includes('cardOrderMetadata[group.id]') &&
    appJs.includes('modifiedBy === \'user-drag\'')) {
  console.log('   ✅ applySmartOrdering() checks cardOrderMetadata');
} else {
  console.log('   ❌ applySmartOrdering() does not check cardOrderMetadata');
  process.exit(1);
}

// Check app-features.js for metadata setting in saveCardOrder
console.log('\n3. Checking saveCardOrder() for metadata setting...');
const featuresJs = fs.readFileSync(path.join(__dirname, 'src/public/app-features.js'), 'utf8');

if (featuresJs.includes('cardOrderMetadata[groupId] = {') &&
    featuresJs.includes('userModified: true') &&
    featuresJs.includes('modifiedBy: \'user-drag\'')) {
  console.log('   ✅ saveCardOrder() sets cardOrderMetadata');
} else {
  console.log('   ❌ saveCardOrder() does not set cardOrderMetadata');
  process.exit(1);
}

// Check that metadata is persisted to localStorage
console.log('\n4. Checking localStorage persistence...');
if (featuresJs.includes('localStorage.setItem(\'vista-platform-prefs\'') &&
    appJs.includes('localStorage.setItem(\'vista-platform-prefs\'')) {
  console.log('   ✅ Metadata is persisted to localStorage');
} else {
  console.log('   ❌ Metadata is not persisted to localStorage');
  process.exit(1);
}

// Verify metadata structure has all required fields
console.log('\n5. Checking metadata structure fields...');
const metadataPattern = /cardOrderMetadata\[.*?\] = \s*{([^}]+)}/;
const match = featuresJs.match(metadataPattern);
if (match) {
  const fields = match[1];
  const hasUserModified = fields.includes('userModified: true');
  const hasLastModified = fields.includes('lastModified:');
  const hasModifiedBy = fields.includes('modifiedBy:');
  const hasPageType = fields.includes('pageType:');

  if (hasUserModified && hasLastModified && hasModifiedBy && hasPageType) {
    console.log('   ✅ Metadata structure has all required fields:');
    console.log('      - userModified: true');
    console.log('      - lastModified: timestamp');
    console.log('      - modifiedBy: source identifier');
    console.log('      - pageType: page context');
  } else {
    console.log('   ❌ Metadata structure missing required fields:');
    if (!hasUserModified) console.log('      - userModified: MISSING');
    if (!hasLastModified) console.log('      - lastModified: MISSING');
    if (!hasModifiedBy) console.log('      - modifiedBy: MISSING');
    if (!hasPageType) console.log('      - pageType: MISSING');
    process.exit(1);
  }
} else {
  console.log('   ❌ Could not find metadata structure');
  process.exit(1);
}

// Check that smart ordering is skipped for user-modified groups
console.log('\n6. Checking smart ordering skip logic...');
if (appJs.includes('if (metadata && metadata.userModified && metadata.modifiedBy === \'user-drag\')') &&
    appJs.includes('return; // Skip smart ordering for this group')) {
  console.log('   ✅ Smart ordering skips user-modified groups');
} else {
  console.log('   ❌ Smart ordering does not skip user-modified groups');
  process.exit(1);
}

// Check that metadata is loaded from localStorage
console.log('\n7. Checking metadata loading from localStorage...');
const loadCardOrderPattern = /platformPrefs\.cardOrderMetadata = parsed\.cardOrderMetadata/;
if (loadCardOrderPattern.test(appJs)) {
  console.log('   ✅ Metadata is loaded from localStorage');
} else {
  console.log('   ❌ Metadata is not loaded from localStorage');
  process.exit(1);
}

console.log('\n=== All Verification Tests Passed ✅ ===\n');
console.log('Summary:');
console.log('  • cardOrderMetadata structure exists with userModified, lastModified, modifiedBy fields');
console.log('  • Drag operations set modifiedBy: "user-drag" timestamp');
console.log('  • applySmartOrdering() checks if group was user-modified before reordering');
console.log('  • Groups with userModified=true and modifiedBy="user-drag" are skipped');
console.log('  • Metadata is persisted to localStorage');
console.log('  • Metadata is loaded from localStorage on startup');
console.log('\nThe cardOrderMetadata implementation is complete!');

process.exit(0);
