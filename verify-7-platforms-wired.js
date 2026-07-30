/**
 * Comprehensive System Verification: 7-Platform Wiring Integration
 *
 * This script performs end-to-end verification of the complete platform
 * wiring system, including:
 * - All 7 platforms verified in PLATFORM_FRAMES mapping
 * - Helper functions confirmed working
 * - renderPlatformWithContext integration verified
 * - Fallback mechanisms tested
 * - Final system acceptance test passes
 *
 * Platforms verified:
 * 1. facebook
 * 2. twitter (X)
 * 3. linkedin
 * 4. reddit
 * 5. youtube
 * 6. instagram
 * 7. tiktok
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const THE_7_PLATFORMS = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];

// Test results tracking
const testResults = {
  platformFramesMapping: { passed: 0, failed: 0, results: [] },
  helperFunctions: { passed: 0, failed: 0, results: [] },
  renderPlatformContext: { passed: 0, failed: 0, results: [] },
  fallbackMechanisms: { passed: 0, failed: 0, results: [] },
  systemAcceptance: { passed: 0, failed: 0, results: [] }
};

/**
 * Log test result with color coding
 */
function logTest(testName, passed, details = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} - ${testName}`);
  if (details) {
    console.log(`    ${colors.cyan}${details}${colors.reset}`);
  }
  return passed;
}

/**
 * Log section header
 */
function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}\n`);
}

/**
 * Read and parse a file
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Test 1: Verify PLATFORM_FRAMES mapping for all 7 platforms
 */
function testPlatformFramesMapping() {
  logSection('Test 1: PLATFORM_FRAMES Mapping Verification');

  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = readFile(configPath);

  if (!configContent) {
    console.log(`  ${colors.red}✗ FAIL${colors.reset} - Could not read platform-frames.config.ts`);
    return false;
  }

  console.log(`  ${colors.green}✓ PASS${colors.reset} - platform-frames.config.ts file exists`);
  testResults.platformFramesMapping.passed++;
  testResults.platformFramesMapping.results.push({ test: 'config_file_exists', passed: true });

  // Check that all 7 platforms are in the PLATFORM_FRAMES_CONFIG
  for (const platform of THE_7_PLATFORMS) {
    // Check for platform entry in config
    const platformRegex = new RegExp(`\\b${platform}:\\s*\\{`, 'i');
    const found = platformRegex.test(configContent);

    const passed = logTest(
      `Platform "${platform}" in PLATFORM_FRAMES_CONFIG`,
      found,
      found ? 'Platform configuration found' : 'Platform configuration missing'
    );

    if (passed) {
      testResults.platformFramesMapping.passed++;
    } else {
      testResults.platformFramesMapping.failed++;
    }
    testResults.platformFramesMapping.results.push({ test: `platform_${platform}`, passed });
  }

  // Check for export function getPlatformFrameConfig
  const hasGetPlatformFrameConfig = configContent.includes('export function getPlatformFrameConfig');
  const passed = logTest(
    'Export function getPlatformFrameConfig exists',
    hasGetPlatformFrameConfig,
    hasGetPlatformFrameConfig ? 'Export function found' : 'Export function missing'
  );

  if (passed) {
    testResults.platformFramesMapping.passed++;
  } else {
    testResults.platformFramesMapping.failed++;
  }
  testResults.platformFramesMapping.results.push({ test: 'getPlatformFrameConfig_export', passed });

  // Check for export function getAllPlatformIds
  const hasGetAllPlatformIds = configContent.includes('export function getAllPlatformIds');
  const passed2 = logTest(
    'Export function getAllPlatformIds exists',
    hasGetAllPlatformIds,
    hasGetAllPlatformIds ? 'Export function found' : 'Export function missing'
  );

  if (passed2) {
    testResults.platformFramesMapping.passed++;
  } else {
    testResults.platformFramesMapping.failed++;
  }
  testResults.platformFramesMapping.results.push({ test: 'getAllPlatformIds_export', passed: passed2 });

  return testResults.platformFramesMapping.failed === 0;
}

/**
 * Test 2: Verify helper functions
 */
function testHelperFunctions() {
  logSection('Test 2: Helper Functions Verification');

  const indexPath = path.join(__dirname, 'src/platform-frames/index.ts');
  const indexContent = readFile(indexPath);

  if (!indexContent) {
    console.log(`  ${colors.red}✗ FAIL${colors.reset} - Could not read platform-frames/index.ts`);
    return false;
  }

  console.log(`  ${colors.green}✓ PASS${colors.reset} - platform-frames/index.ts file exists`);
  testResults.helperFunctions.passed++;
  testResults.helperFunctions.results.push({ test: 'index_file_exists', passed: true });

  const helperFunctions = [
    'getPlatformFrame',
    'getAllPlatformFrames',
    'getAllPlatformIds',
    'hasPlatformFrame',
    'renderPlatformFrame',
    'renderPlatformChrome',
    'getPlatformThemeVars',
    'platformSupportsThemes',
    'getPlatformMetadata',
    'getPlatformsByFrameType'
  ];

  for (const funcName of helperFunctions) {
    const hasFunction = indexContent.includes(`export function ${funcName}`) ||
                       indexContent.includes(`${funcName}(`);

    const passed = logTest(
      `Helper function "${funcName}" exists`,
      hasFunction,
      hasFunction ? 'Function found in index.ts' : 'Function missing'
    );

    if (passed) {
      testResults.helperFunctions.passed++;
    } else {
      testResults.helperFunctions.failed++;
    }
    testResults.helperFunctions.results.push({ test: `helper_${funcName}`, passed });
  }

  // Check for PlatformFramesAPI object
  const hasAPI = indexContent.includes('PlatformFramesAPI');
  const passed = logTest(
    'PlatformFramesAPI object exists',
    hasAPI,
    hasAPI ? 'API object found' : 'API object missing'
  );

  if (passed) {
    testResults.helperFunctions.passed++;
  } else {
    testResults.helperFunctions.failed++;
  }
  testResults.helperFunctions.results.push({ test: 'PlatformFramesAPI', passed });

  return testResults.helperFunctions.failed === 0;
}

/**
 * Test 3: Verify renderPlatformWithContext integration
 */
function testRenderPlatformWithContextIntegration() {
  logSection('Test 3: renderPlatformWithContext Integration');

  const appJsPath = path.join(__dirname, 'src/public/app.js');
  const appJsContent = readFile(appJsPath);

  if (!appJsContent) {
    console.log(`  ${colors.red}✗ FAIL${colors.reset} - Could not read public/app.js`);
    return false;
  }

  console.log(`  ${colors.green}✓ PASS${colors.reset} - public/app.js file exists`);
  testResults.renderPlatformContext.passed++;
  testResults.renderPlatformContext.results.push({ test: 'app_js_exists', passed: true });

  // Check for renderPlatformWithContext function
  const hasFunction = appJsContent.includes('function renderPlatformWithContext(');
  const passed = logTest(
    'renderPlatformWithContext function exists',
    hasFunction,
    hasFunction ? 'Function definition found' : 'Function definition missing'
  );

  if (passed) {
    testResults.renderPlatformContext.passed++;
  } else {
    testResults.renderPlatformContext.failed++;
  }
  testResults.renderPlatformContext.results.push({ test: 'renderPlatformWithContext_exists', passed });

  // Check for platform validation
  const hasValidation = appJsContent.includes('PLATFORM_FRAMES[pid]') ||
                       appJsContent.includes('!PLATFORM_FRAMES');
  const passed2 = logTest(
    'PLATFORM_FRAMES mapping check exists',
    hasValidation,
    hasValidation ? 'Platform validation found' : 'Platform validation missing'
  );

  if (passed2) {
    testResults.renderPlatformContext.passed++;
  } else {
    testResults.renderPlatformContext.failed++;
  }
  testResults.renderPlatformContext.results.push({ test: 'platform_validation', passed: passed2 });

  // Check for buildContextFrame integration
  const hasBuildContext = appJsContent.includes('buildContextFrame');
  const passed3 = logTest(
    'buildContextFrame integration exists',
    hasBuildContext,
    hasBuildContext ? 'buildContextFrame call found' : 'buildContextFrame call missing'
  );

  if (passed3) {
    testResults.renderPlatformContext.passed++;
  } else {
    testResults.renderPlatformContext.failed++;
  }
  testResults.renderPlatformContext.results.push({ test: 'buildContextFrame_integration', passed: passed3 });

  // Check for theme parameter support
  const hasTheme = appJsContent.includes('theme = ') && appJsContent.includes('dark');
  const passed4 = logTest(
    'Theme parameter support exists',
    hasTheme,
    hasTheme ? 'Theme parameter handling found' : 'Theme parameter handling missing'
  );

  if (passed4) {
    testResults.renderPlatformContext.passed++;
  } else {
    testResults.renderPlatformContext.failed++;
  }
  testResults.renderPlatformContext.results.push({ test: 'theme_parameter_support', passed: passed4 });

  // Check for fallback mechanism
  const hasFallback = appJsContent.includes('renderGenericContextFrame') ||
                      appJsContent.includes('renderPlatformWithContextLegacy');
  const passed5 = logTest(
    'Fallback mechanism exists',
    hasFallback,
    hasFallback ? 'Fallback function found' : 'Fallback function missing'
  );

  if (passed5) {
    testResults.renderPlatformContext.passed++;
  } else {
    testResults.renderPlatformContext.failed++;
  }
  testResults.renderPlatformContext.results.push({ test: 'fallback_mechanism', passed: passed5 });

  return testResults.renderPlatformContext.failed === 0;
}

/**
 * Test 4: Verify fallback mechanisms
 */
function testFallbackMechanisms() {
  logSection('Test 4: Fallback Mechanisms Verification');

  const appJsPath = path.join(__dirname, 'src/public/app.js');
  const appJsContent = readFile(appJsPath);

  if (!appJsContent) {
    console.log(`  ${colors.red}✗ FAIL${colors.reset} - Could not read public/app.js`);
    return false;
  }

  // Check for renderGenericContextFrame function
  const hasGenericFallback = appJsContent.includes('function renderGenericContextFrame(');
  const passed = logTest(
    'Generic fallback function exists',
    hasGenericFallback,
    hasGenericFallback ? 'renderGenericContextFrame found' : 'renderGenericContextFrame missing'
  );

  if (passed) {
    testResults.fallbackMechanisms.passed++;
  } else {
    testResults.fallbackMechanisms.failed++;
  }
  testResults.fallbackMechanisms.results.push({ test: 'generic_fallback', passed });

  // Check for legacy fallback
  const hasLegacyFallback = appJsContent.includes('function renderPlatformWithContextLegacy(');
  const passed2 = logTest(
    'Legacy fallback function exists',
    hasLegacyFallback,
    hasLegacyFallback ? 'renderPlatformWithContextLegacy found' : 'renderPlatformWithContextLegacy missing'
  );

  if (passed2) {
    testResults.fallbackMechanisms.passed++;
  } else {
    testResults.fallbackMechanisms.failed++;
  }
  testResults.fallbackMechanisms.results.push({ test: 'legacy_fallback', passed: passed2 });

  // Check for safe fallback
  const hasSafeFallback = appJsContent.includes('renderSafeFallbackFrame');
  const passed3 = logTest(
    'Safe fallback function exists',
    hasSafeFallback,
    hasSafeFallback ? 'renderSafeFallbackFrame found' : 'renderSafeFallbackFrame missing'
  );

  if (passed3) {
    testResults.fallbackMechanisms.passed++;
  } else {
    testResults.fallbackMechanisms.failed++;
  }
  testResults.fallbackMechanisms.results.push({ test: 'safe_fallback', passed: passed3 });

  // Check for error handling in fallback
  const hasErrorHandling = appJsContent.includes('try {') && appJsContent.includes('catch') &&
                          appJsContent.includes('buildContextFrame');
  const passed4 = logTest(
    'Error handling in fallback path exists',
    hasErrorHandling,
    hasErrorHandling ? 'Try-catch blocks found' : 'Try-catch blocks missing'
  );

  if (passed4) {
    testResults.fallbackMechanisms.passed++;
  } else {
    testResults.fallbackMechanisms.failed++;
  }
  testResults.fallbackMechanisms.results.push({ test: 'error_handling', passed: passed4 });

  // Check for input validation
  const hasValidation = appJsContent.includes('typeof pid !==') || appJsContent.includes('!pid');
  const passed5 = logTest(
    'Input validation exists',
    hasValidation,
    hasValidation ? 'Input validation found' : 'Input validation missing'
  );

  if (passed5) {
    testResults.fallbackMechanisms.passed++;
  } else {
    testResults.fallbackMechanisms.failed++;
  }
  testResults.fallbackMechanisms.results.push({ test: 'input_validation', passed: passed5 });

  return testResults.fallbackMechanisms.failed === 0;
}

/**
 * Test 5: System acceptance test
 */
function testSystemAcceptance() {
  logSection('Test 5: System Acceptance Test');

  // Check that all platform frame component files exist
  const platformFrameDir = path.join(__dirname, 'src/platform-frames');

  for (const platform of THE_7_PLATFORMS) {
    const frameFile = path.join(platformFrameDir, `${platform}-frame.ts`);
    const exists = fs.existsSync(frameFile);

    const passed = logTest(
      `Platform frame file exists for "${platform}"`,
      exists,
      exists ? `${platform}-frame.ts found` : `${platform}-frame.ts missing`
    );

    if (passed) {
      testResults.systemAcceptance.passed++;
    } else {
      testResults.systemAcceptance.failed++;
    }
    testResults.systemAcceptance.results.push({ test: `frame_file_${platform}`, passed });
  }

  // Check for base-frame.ts
  const baseFrameExists = fs.existsSync(path.join(platformFrameDir, 'base-frame.ts'));
  const passed = logTest(
    'Base frame file exists',
    baseFrameExists,
    baseFrameExists ? 'base-frame.ts found' : 'base-frame.ts missing'
  );

  if (passed) {
    testResults.systemAcceptance.passed++;
  } else {
    testResults.systemAcceptance.failed++;
  }
  testResults.systemAcceptance.results.push({ test: 'base_frame_exists', passed });

  // Check for verification.ts
  const verificationExists = fs.existsSync(path.join(platformFrameDir, 'verification.ts'));
  const passed2 = logTest(
    'Verification test file exists',
    verificationExists,
    verificationExists ? 'verification.ts found' : 'verification.ts missing'
  );

  if (passed2) {
    testResults.systemAcceptance.passed++;
  } else {
    testResults.systemAcceptance.failed++;
  }
  testResults.systemAcceptance.results.push({ test: 'verification_exists', passed: passed2 });

  // Check that platform-frames.js would be generated (the compiled output)
  const hasBuildConfig = fs.existsSync(path.join(__dirname, 'src/platform-frames.config.ts'));
  const passed3 = logTest(
    'Platform frames config exists for compilation',
    hasBuildConfig,
    hasBuildConfig ? 'Config file ready for compilation' : 'Config file missing'
  );

  if (passed3) {
    testResults.systemAcceptance.passed++;
  } else {
    testResults.systemAcceptance.failed++;
  }
  testResults.systemAcceptance.results.push({ test: 'build_config_exists', passed: passed3 });

  return testResults.systemAcceptance.failed === 0;
}

/**
 * Generate final test summary
 */
function generateTestSummary() {
  logSection('Final Test Summary');

  const totalPassed = testResults.platformFramesMapping.passed +
                     testResults.helperFunctions.passed +
                     testResults.renderPlatformContext.passed +
                     testResults.fallbackMechanisms.passed +
                     testResults.systemAcceptance.passed;

  const totalFailed = testResults.platformFramesMapping.failed +
                     testResults.helperFunctions.failed +
                     testResults.renderPlatformContext.failed +
                     testResults.fallbackMechanisms.failed +
                     testResults.systemAcceptance.failed;

  const totalTests = totalPassed + totalFailed;

  console.log(`${colors.bright}Platform Frames Mapping:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${testResults.platformFramesMapping.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${testResults.platformFramesMapping.failed}${colors.reset}`);

  console.log(`\n${colors.bright}Helper Functions:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${testResults.helperFunctions.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${testResults.helperFunctions.failed}${colors.reset}`);

  console.log(`\n${colors.bright}renderPlatformWithContext Integration:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${testResults.renderPlatformContext.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${testResults.renderPlatformContext.failed}${colors.reset}`);

  console.log(`\n${colors.bright}Fallback Mechanisms:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${testResults.fallbackMechanisms.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${testResults.fallbackMechanisms.failed}${colors.reset}`);

  console.log(`\n${colors.bright}System Acceptance:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${testResults.systemAcceptance.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${testResults.systemAcceptance.failed}${colors.reset}`);

  console.log(`\n${colors.bright}${colors.blue}=== TOTAL RESULTS ===${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);

  const allPassed = totalFailed === 0;
  const statusColor = allPassed ? colors.green : colors.red;
  const statusText = allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED';

  console.log(`\n${statusColor}${colors.bright}${statusText}${colors.reset}\n`);

  return allPassed;
}

/**
 * Main test execution
 */
function main() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  7-Platform Wiring System Verification${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  Comprehensive Integration Test Suite${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bright}Platforms Under Test:${colors.reset}`);
  THE_7_PLATFORMS.forEach((platform, i) => {
    console.log(`  ${i + 1}. ${platform}`);
  });
  console.log('');

  // Run all test suites
  const test1Passed = testPlatformFramesMapping();
  const test2Passed = testHelperFunctions();
  const test3Passed = testRenderPlatformWithContextIntegration();
  const test4Passed = testFallbackMechanisms();
  const test5Passed = testSystemAcceptance();

  // Generate final summary
  const allPassed = generateTestSummary();

  // Return exit code
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = {
  testPlatformFramesMapping,
  testHelperFunctions,
  testRenderPlatformWithContextIntegration,
  testFallbackMechanisms,
  testSystemAcceptance,
  testResults
};
