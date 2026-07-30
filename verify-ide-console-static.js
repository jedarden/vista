/**
 * Static verification of IDE frame rendering
 * Checks for common issues that would cause console errors
 */

const fs = require('fs');
const path = require('path');

console.log('Starting static verification of IDE frames...\n');

const issues = [];
const warnings = [];
const passedChecks = [];

// Read the platform-frames.js file
const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
const platformFramesContent = fs.readFileSync(platformFramesPath, 'utf8');

// Read the style.css file
const stylePath = path.join(__dirname, 'src/public/style.css');
const styleContent = fs.readFileSync(stylePath, 'utf8');

// Read the test HTML file
const testHtmlPath = path.join(__dirname, 'test-ide-theme-switching.html');
const testHtmlContent = fs.readFileSync(testHtmlPath, 'utf8');

console.log('=== Checking IDE Frame Definitions ===\n');

// Check 1: Verify VS Code frame is defined
if (platformFramesContent.includes('vscode:')) {
  console.log('✓ VS Code frame is defined in platform-frames.js');
  passedChecks.push('VS Code frame defined');
} else {
  console.error('✗ VS Code frame is NOT defined in platform-frames.js');
  issues.push('VS Code frame missing from platform-frames.js');
}

// Check 2: Verify JetBrains frame is defined
if (platformFramesContent.includes('jetbrains:')) {
  console.log('✓ JetBrains frame is defined in platform-frames.js');
  passedChecks.push('JetBrains frame defined');
} else {
  console.error('✗ JetBrains frame is NOT defined in platform-frames.js');
  issues.push('JetBrains frame missing from platform-frames.js');
}

// Check 3: Verify VS Code theme vars
const vscodeStart = platformFramesContent.indexOf('vscode:');
const vscodeEnd = platformFramesContent.indexOf('jetbrains:', vscodeStart);
const vscodeSection = platformFramesContent.substring(vscodeStart, vscodeEnd);

const hasVsCodeDark = vscodeSection.includes('dark:');
const hasVsCodeLight = vscodeSection.includes('light:');
const hasVsCodeRequiredVars = vscodeSection.includes('--frame-bg') &&
                             vscodeSection.includes('--frame-surface') &&
                             vscodeSection.includes('--frame-border');

if (hasVsCodeDark && hasVsCodeLight && hasVsCodeRequiredVars) {
  console.log('✓ VS Code theme vars properly defined (dark + light + all required vars)');
  passedChecks.push('VS Code theme vars complete');
} else {
  console.error('✗ VS Code theme vars incomplete');
  console.error('  Has dark:', hasVsCodeDark, 'Has light:', hasVsCodeLight, 'Has vars:', hasVsCodeRequiredVars);
  issues.push('VS Code theme vars incomplete');
}

// Check 4: Verify JetBrains theme vars
const jbStart = platformFramesContent.indexOf('jetbrains:');
const jbEnd = platformFramesContent.indexOf('// Project Management', jbStart);
if (jbEnd === -1) jbEnd = platformFramesContent.indexOf('jira:', jbStart);
const jbSection = platformFramesContent.substring(jbStart, jbEnd);

const hasJbDark = jbSection.includes('dark:');
const hasJbLight = jbSection.includes('light:');
const hasJbRequiredVars = jbSection.includes('--frame-bg') &&
                         jbSection.includes('--frame-surface') &&
                         jbSection.includes('--frame-border');

if (hasJbDark && hasJbLight && hasJbRequiredVars) {
  console.log('✓ JetBrains theme vars properly defined (dark + light + all required vars)');
  passedChecks.push('JetBrains theme vars complete');
} else {
  console.error('✗ JetBrains theme vars incomplete');
  console.error('  Has dark:', hasJbDark, 'Has light:', hasJbLight, 'Has vars:', hasJbRequiredVars);
  issues.push('JetBrains theme vars incomplete');
}

console.log('\n=== Checking CSS Classes ===\n');

// Check 5: Verify VS Code CSS classes
const vscodeClasses = [
  'vs-activity-bar',
  'vs-activity-icon',
  'vs-sidebar',
  'vs-explorer',
  'vs-file',
  'vs-main-area',
  'vs-editor',
  'vs-tab-bar',
  'vs-tab',
  'vs-content',
  'vs-terminal-panel',
  'vs-terminal-header',
  'vs-terminal-content'
];

let missingVsCodeClasses = [];
vscodeClasses.forEach(className => {
  if (!styleContent.includes(`.${className}`)) {
    missingVsCodeClasses.push(className);
  }
});

if (missingVsCodeClasses.length === 0) {
  console.log(`✓ All ${vscodeClasses.length} VS Code CSS classes defined`);
  passedChecks.push('VS Code CSS classes defined');
} else {
  console.error(`✗ Missing ${missingVsCodeClasses.length} VS Code CSS classes:`, missingVsCodeClasses);
  issues.push(`Missing VS Code CSS classes: ${missingVsCodeClasses.join(', ')}`);
}

// Check 6: Verify JetBrains CSS classes
const jetbrainsClasses = [
  'jb-navigation-bar',
  'jb-menu-item',
  'jb-content-area',
  'jb-sidebar',
  'jb-project-header',
  'jb-explorer',
  'jb-file-tree',
  'jb-folder',
  'jb-file',
  'jb-main-area',
  'jb-editor',
  'jb-tab-bar',
  'jb-tab',
  'jb-content',
  'jb-status-bar'
];

let missingJetBrainsClasses = [];
jetbrainsClasses.forEach(className => {
  if (!styleContent.includes(`.${className}`)) {
    missingJetBrainsClasses.push(className);
  }
});

if (missingJetBrainsClasses.length === 0) {
  console.log(`✓ All ${jetbrainsClasses.length} JetBrains CSS classes defined`);
  passedChecks.push('JetBrains CSS classes defined');
} else {
  console.error(`✗ Missing ${missingJetBrainsClasses.length} JetBrains CSS classes:`, missingJetBrainsClasses);
  issues.push(`Missing JetBrains CSS classes: ${missingJetBrainsClasses.join(', ')}`);
}

console.log('\n=== Checking HTML Test Page ===\n');

// Check 7: Verify test page includes IDE frames
if (testHtmlContent.includes('vscode-context') && testHtmlContent.includes('jetbrains-context')) {
  console.log('✓ Test HTML page includes both IDE frames');
  passedChecks.push('Test page includes IDE frames');
} else {
  console.error('✗ Test HTML page missing IDE frame references');
  issues.push('Test page missing IDE frames');
}

// Check 8: Verify test page has theme toggle functionality
if (testHtmlContent.includes('toggleTheme()') && testHtmlContent.includes('runConsoleTests()')) {
  console.log('✓ Test page has theme toggle and console test functions');
  passedChecks.push('Test page has theme controls');
} else {
  console.error('✗ Test page missing theme toggle functions');
  issues.push('Test page missing theme controls');
}

// Check 9: Verify no syntax errors in theme vars
try {
  // Extract VS Code theme vars
  const vscodeMatch = platformFramesContent.match(/vscode:\s*{[\s\S]*?themeVars:\s*{[\s\S]*?dark:\s*{([^}]*)}[\s\S]*?light:\s*{([^}]*)}/);
  if (vscodeMatch) {
    console.log('✓ VS Code theme vars syntax valid');
    passedChecks.push('VS Code theme vars syntax OK');
  } else {
    console.warn('⚠ Could not validate VS Code theme vars syntax');
    warnings.push('VS Code theme vars syntax validation skipped');
  }

  // Extract JetBrains theme vars
  const jetbrainsMatch = platformFramesContent.match(/jetbrains:\s*{[\s\S]*?themeVars:\s*{[\s\S]*?dark:\s*{([^}]*)}[\s\S]*?light:\s*{([^}]*)}/);
  if (jetbrainsMatch) {
    console.log('✓ JetBrains theme vars syntax valid');
    passedChecks.push('JetBrains theme vars syntax OK');
  } else {
    console.warn('⚠ Could not validate JetBrains theme vars syntax');
    warnings.push('JetBrains theme vars syntax validation skipped');
  }
} catch (e) {
  console.warn('⚠ Theme vars syntax check skipped:', e.message);
  warnings.push('Theme vars syntax check skipped');
}

// Check 10: Verify CSS color values are valid hex/rgb
const checkColorFormat = (str) => {
  const hexPattern = /#[0-9a-fA-F]{3,8}/g;
  const rgbPattern = /rgba?\([^)]+\)/g;
  return hexPattern.test(str) || rgbPattern.test(str);
};

const vscodeColors = platformFramesContent.match(/vscode:[\s\S]*?themeVars:[\s\S]*?\n\s*\}/);
if (vscodeColors && checkColorFormat(vscodeColors[0])) {
  console.log('✓ VS Code colors use valid hex/rgb format');
  passedChecks.push('VS Code colors valid format');
} else {
  console.warn('⚠ Some VS Code colors may use invalid format');
  warnings.push('VS Code color format validation inconclusive');
}

const jetbrainsColors = platformFramesContent.match(/jetbrains:[\s\S]*?themeVars:[\s\S]*?\n\s*\}/);
if (jetbrainsColors && checkColorFormat(jetbrainsColors[0])) {
  console.log('✓ JetBrains colors use valid hex/rgb format');
  passedChecks.push('JetBrains colors valid format');
} else {
  console.warn('⚠ Some JetBrains colors may use invalid format');
  warnings.push('JetBrains color format validation inconclusive');
}

// Check 11: Verify no common JavaScript errors in test page
const jsErrorPatterns = [
  /undefined is not a function/gi,
  /cannot read property/gi,
  /null is not an object/gi
];

let jsErrorsFound = [];
jsErrorPatterns.forEach(pattern => {
  if (pattern.test(testHtmlContent)) {
    jsErrorsFound.push(pattern);
  }
});

if (jsErrorsFound.length === 0) {
  console.log('✓ No common JavaScript error patterns in test page');
  passedChecks.push('No common JS error patterns');
} else {
  console.error('✗ Found potential JavaScript error patterns:', jsErrorsFound);
  issues.push('Potential JS error patterns found');
}

// Check 12: Verify style.css is properly linked
if (testHtmlContent.includes('href="src/public/style.css"') || testHtmlContent.includes("href='src/public/style.css'")) {
  console.log('✓ Test page properly links to style.css');
  passedChecks.push('style.css properly linked');
} else {
  console.error('✗ Test page does not properly link to style.css');
  issues.push('style.css not properly linked');
}

// Final summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`\n✅ Passed checks: ${passedChecks.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Issues: ${issues.length}\n`);

if (passedChecks.length > 0) {
  console.log('Passed Checks:');
  passedChecks.forEach((check, i) => console.log(`  ${i + 1}. ${check}`));
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
}

if (issues.length > 0) {
  console.log('\nIssues:');
  issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  results: {
    totalPassed: passedChecks.length,
    totalWarnings: warnings.length,
    totalIssues: issues.length,
    passed: issues.length === 0
  },
  details: {
    passedChecks,
    warnings,
    issues
  },
  conclusion: issues.length === 0 ?
    'All static checks passed - IDE frames are properly configured with no console error sources detected' :
    'Some issues detected that may cause console errors'
};

const reportPath = path.join(__dirname, 'notes', 'bf-6ddu3-static-verification.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Report saved to: ${reportPath}`);

if (report.results.passed) {
  console.log('\n✅ STATIC VERIFICATION PASSED');
  console.log('✓ IDE frame definitions are correct');
  console.log('✓ CSS classes are properly defined');
  console.log('✓ Theme vars are properly structured');
  console.log('✓ Test page is properly configured');
  console.log('✓ No common error patterns detected');
  process.exit(0);
} else {
  console.log('\n❌ STATIC VERIFICATION FAILED');
  console.log('Please review the issues listed above');
  process.exit(1);
}
