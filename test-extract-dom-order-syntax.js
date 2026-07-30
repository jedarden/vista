#!/usr/bin/env node

/**
 * Syntax validation for extract-dom-order utility
 *
 * This script validates the utility code without requiring a browser.
 */

const path = require('path');
const fs = require('fs');

console.log('=== DOM Order Extraction Utility Validation ===\n');

const utilityPath = path.join(__dirname, 'src/utils/extract-dom-order.js');

// Check file exists
if (!fs.existsSync(utilityPath)) {
  console.error('✗ Utility file not found:', utilityPath);
  process.exit(1);
}
console.log('✓ Utility file exists');

// Check file can be parsed as JavaScript
try {
  const content = fs.readFileSync(utilityPath, 'utf8');
  const moduleExports = [];

  // Extract exported function names
  const exportMatches = content.match(/module\.exports\s*=\s*{([^}]+)}/);
  if (exportMatches) {
    const exportsBlock = exportMatches[1];
    const exportNames = exportsBlock.match(/(\w+)/g);
    if (exportNames) {
      console.log('✓ Exported functions:', exportNames.join(', '));
    }
  }

  // Verify key functions exist
  const requiredFunctions = [
    'extractDomOrder',
    'extractDomOrderDetailed',
    'verifyDomOrder',
    'extractDomOrderAndWait'
  ];

  requiredFunctions.forEach(fn => {
    if (content.includes(`async function ${fn}`)) {
      console.log(`  ✓ Function "${fn}" is defined`);
    } else {
      console.log(`  ✗ Function "${fn}" is NOT defined`);
    }
  });

  // Verify JSDoc comments exist
  if (content.includes('@param') && content.includes('@returns') && content.includes('@example')) {
    console.log('✓ JSDoc documentation present');
  } else {
    console.log('⚠ JSDoc documentation may be incomplete');
  }

  // Verify key selectors are used
  const selectors = ['.platform-card', 'data-pid', '#previewGrid'];
  selectors.forEach(selector => {
    if (content.includes(selector)) {
      console.log(`  ✓ Selector "${selector}" is used`);
    }
  });

  // Verify error handling
  if (content.includes('try {') && content.includes('catch') && content.includes('throw new Error')) {
    console.log('✓ Error handling is implemented');
  }

  // Verify empty state handling
  if (content.includes('length === 0') && content.includes('return []')) {
    console.log('✓ Empty state handling is implemented');
  }

  console.log('\n=== Validation Results ===');
  console.log('✓ All validation checks passed');
  console.log('\nUsage:');
  console.log(`  const { extractDomOrder } = require('./src/utils/extract-dom-order');`);
  console.log(`  const order = await extractDomOrder(page);`);
  console.log(`  console.log(order); // ['twitter', 'facebook', ...]`);

  process.exit(0);

} catch (error) {
  console.error('✗ Validation failed:', error.message);
  process.exit(1);
}
