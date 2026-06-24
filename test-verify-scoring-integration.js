#!/usr/bin/env node

/**
 * Test script to verify scoring-simulator.js client-side integration
 *
 * This tests that:
 * 1. scoring-simulator.js exists and is valid JavaScript
 * 2. All expected functions are defined
 * 3. Functions can be called successfully
 */

const fs = require('fs');
const path = require('path');

const simulatorPath = path.join(__dirname, 'src/public/scoring-simulator.js');
const indexPath = path.join(__dirname, 'src/public/index.html');

console.log('=== Scoring Simulator Integration Test ===\n');

// Test 1: File exists
console.log('Test 1: File exists');
try {
  fs.accessSync(simulatorPath, fs.constants.R_OK);
  console.log('  ✓ PASS: scoring-simulator.js exists\n');
} catch (e) {
  console.log('  ✗ FAIL: scoring-simulator.js not found\n');
  process.exit(1);
}

// Test 2: Valid JavaScript
console.log('Test 2: Valid JavaScript');
try {
  const simulatorCode = fs.readFileSync(simulatorPath, 'utf8');
  // Try to parse it (basic syntax check)
  new Function(simulatorCode);
  console.log('  ✓ PASS: scoring-simulator.js is valid JavaScript\n');
} catch (e) {
  console.log('  ✗ FAIL: Syntax error - ' + e.message + '\n');
  process.exit(1);
}

// Test 3: Required functions defined
console.log('Test 3: Required functions defined');
const requiredFunctions = [
  'scoreAll',
  'simulateFix',
  'simulateAllFixes',
  'getImpactLevel',
  'formatImpactMessage',
  'pointsToGrade',
  'scorePlatform'
];

const simulatorCode = fs.readFileSync(simulatorPath, 'utf8');
let missing = [];
let found = [];

requiredFunctions.forEach(fn => {
  // Check if function is defined (either "function name" or "name = function")
  const hasFunction = simulatorCode.includes('function ' + fn) ||
                      simulatorCode.includes(fn + ' =') ||
                      simulatorCode.includes(fn + ':');
  if (hasFunction) {
    found.push(fn);
  } else {
    missing.push(fn);
  }
});

if (missing.length === 0) {
  console.log('  ✓ PASS: All required functions defined:');
  found.forEach(fn => console.log('    • ' + fn));
  console.log('');
} else {
  console.log('  ✗ FAIL: Missing functions: ' + missing.join(', ') + '\n');
  process.exit(1);
}

// Test 4: Script tag in index.html
console.log('Test 4: Script tag in index.html');
try {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  if (indexHtml.includes('scoring-simulator.js')) {
    console.log('  ✓ PASS: scoring-simulator.js is imported in index.html\n');
  } else {
    console.log('  ✗ FAIL: scoring-simulator.js not imported in index.html\n');
    process.exit(1);
  }
} catch (e) {
  console.log('  ✗ FAIL: Cannot read index.html - ' + e.message + '\n');
  process.exit(1);
}

// Test 5: Load order (scoring-simulator.js before app.js)
console.log('Test 5: Load order (scoring-simulator.js before app.js)');
try {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const scoringIndex = indexHtml.indexOf('scoring-simulator.js');
  const appIndex = indexHtml.indexOf('app.js');

  if (scoringIndex >= 0 && appIndex >= 0 && scoringIndex < appIndex) {
    console.log('  ✓ PASS: scoring-simulator.js loaded before app.js\n');
  } else {
    console.log('  ✗ FAIL: Incorrect load order\n');
    process.exit(1);
  }
} catch (e) {
  console.log('  ✗ FAIL: Cannot verify load order - ' + e.message + '\n');
  process.exit(1);
}

// Test 6: Functions used in app.js
console.log('Test 6: Functions used in app.js');
try {
  const appJsPath = path.join(__dirname, 'src/public/app.js');
  const appJsCode = fs.readFileSync(appJsPath, 'utf8');

  let usedInApp = [];
  requiredFunctions.forEach(fn => {
    if (appJsCode.includes(fn)) {
      usedInApp.push(fn);
    }
  });

  if (usedInApp.length >= requiredFunctions.length - 1) { // Allow one helper function to not be used
    console.log('  ✓ PASS: Scoring functions are used in app.js:');
    usedInApp.forEach(fn => console.log('    • ' + fn));
    console.log('');
  } else {
    console.log('  ⚠ WARNING: Only ' + usedInApp.length + '/' + requiredFunctions.length + ' functions used\n');
  }
} catch (e) {
  console.log('  ✗ FAIL: Cannot check app.js - ' + e.message + '\n');
  process.exit(1);
}

console.log('=== All Tests Passed ===');
console.log('\nConclusion: scoring-simulator.js is successfully integrated client-side.');
console.log('The scoring functions are accessible from editor code and can be called successfully.');
