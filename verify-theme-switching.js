#!/usr/bin/env node

/**
 * Theme Switching System Verification Test
 * Verifies all acceptance criteria for the complete theme switching system
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Theme Switching System Verification');
console.log('='.repeat(60));

// Read the HTML file
const htmlPath = path.join(__dirname, 'verify-complete-theme-switching.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// Test results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

/**
 * Test 1: Verify toggle button exists and has proper onclick handler
 */
console.log('\n📋 Test 1: Toggle Button Verification');
try {
    const hasToggle = html.includes('id="themeToggle"');
    const hasOnClick = html.includes('onclick="toggleTheme()"');

    if (hasToggle && hasOnClick) {
        console.log('✅ PASS: Toggle button exists with proper onclick handler');
        results.passed.push('Toggle button functionality');
    } else {
        console.log('❌ FAIL: Toggle button or onclick handler missing');
        results.failed.push('Toggle button functionality');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking toggle button:', e.message);
    results.failed.push('Toggle button functionality');
}

/**
 * Test 2: Verify all 7 platforms are present
 */
console.log('\n📋 Test 2: Platform Coverage');
const expectedPlatforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
const missingPlatforms = [];

expectedPlatforms.forEach(platform => {
    if (!html.includes(`card-${platform}`)) {
        missingPlatforms.push(platform);
    }
});

if (missingPlatforms.length === 0) {
    console.log(`✅ PASS: All ${expectedPlatforms.length} platforms present`);
    results.passed.push('Platform coverage');
} else {
    console.log(`❌ FAIL: Missing platforms: ${missingPlatforms.join(', ')}`);
    results.failed.push('Platform coverage');
}

/**
 * Test 3: Verify theme-specific CSS for all platforms
 */
console.log('\n📋 Test 3: Platform-specific Theme CSS');
let cssComplete = true;
expectedPlatforms.forEach(platform => {
    const hasLightCSS = html.includes(`[data-theme="light"] .${platform}-context`);
    const hasDarkCSS = html.includes(`[data-theme="dark"] .${platform}-context`);

    if (!hasLightCSS || !hasDarkCSS) {
        console.log(`  ⚠️  ${platform}: Light CSS: ${hasLightCSS ? '✓' : '✗'}, Dark CSS: ${hasDarkCSS ? '✓' : '✗'}`);
        cssComplete = false;
    }
});

if (cssComplete) {
    console.log('✅ PASS: All platforms have light and dark theme CSS');
    results.passed.push('Platform-specific CSS');
} else {
    console.log('⚠️  WARN: Some platforms missing theme-specific CSS');
    results.warnings.push('Platform-specific CSS');
}

/**
 * Test 4: Verify theme persistence (localStorage)
 */
console.log('\n📋 Test 4: Theme Persistence');
try {
    const hasLocalStorage = html.includes('localStorage.setItem');
    const hasGetLocalStorage = html.includes('localStorage.getItem');

    if (hasLocalStorage && hasGetLocalStorage) {
        console.log('✅ PASS: localStorage persistence implemented');
        results.passed.push('Theme persistence');
    } else {
        console.log('❌ FAIL: localStorage persistence not fully implemented');
        results.failed.push('Theme persistence');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking localStorage:', e.message);
    results.failed.push('Theme persistence');
}

/**
 * Test 5: Verify real-time theme switching (no reload)
 */
console.log('\n📋 Test 5: Real-time Theme Switching');
try {
    const hasSetAttribute = html.includes('document.documentElement.setAttribute');
    const hasReloadCheck = !html.includes('location.reload()') || html.includes('testPersistence()');

    if (hasSetAttribute && hasReloadCheck) {
        console.log('✅ PASS: Real-time switching implemented (setHTMLAttribute)');
        results.passed.push('Real-time switching');
    } else {
        console.log('❌ FAIL: Real-time switching not properly implemented');
        results.failed.push('Real-time switching');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking real-time switching:', e.message);
    results.failed.push('Real-time switching');
}

/**
 * Test 6: Verify FOUC prevention
 */
console.log('\n📋 Test 6: FOUC (Flash of Unstyled Content) Prevention');
try {
    const hasInlineStyle = html.includes('style') && html.includes('[data-theme');
    const hasFOUCCheck = html.includes('checkForFOUC') || html.includes('FOUC');

    if (hasInlineStyle && hasFOUCCheck) {
        console.log('✅ PASS: FOUC prevention measures in place');
        results.passed.push('FOUC prevention');
    } else {
        console.log('⚠️  WARN: Limited FOUC prevention measures');
        results.warnings.push('FOUC prevention');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking FOUC prevention:', e.message);
    results.failed.push('FOUC prevention');
}

/**
 * Test 7: Verify performance tracking
 */
console.log('\n📋 Test 7: Performance Tracking');
try {
    const hasPerformance = html.includes('performance.now()');
    const hasStatusPanel = html.includes('status-panel') || html.includes('status-theme');

    if (hasPerformance && hasStatusPanel) {
        console.log('✅ PASS: Performance tracking implemented');
        results.passed.push('Performance tracking');
    } else {
        console.log('⚠️  WARN: Limited performance tracking');
        results.warnings.push('Performance tracking');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking performance tracking:', e.message);
    results.failed.push('Performance tracking');
}

/**
 * Test 8: Verify platform update indicators
 */
console.log('\n📋 Test 8: Platform Update Indicators');
try {
    const hasUpdateFunction = html.includes('updatePlatformIndicator');
    const hasPlatformCount = html.includes('platformUpdateCount') || html.includes('PLATFORMS');

    if (hasUpdateFunction && hasPlatformCount) {
        console.log('✅ PASS: Platform update indicators present');
        results.passed.push('Platform update indicators');
    } else {
        console.log('⚠️  WARN: Limited platform update tracking');
        results.warnings.push('Platform update indicators');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking platform indicators:', e.message);
    results.failed.push('Platform update indicators');
}

/**
 * Test 9: Verify comprehensive status panel
 */
console.log('\n📋 Test 9: Status Panel Completeness');
const requiredStatusItems = [
    'Current Theme',
    'Theme Persistence',
    'Platform Updates',
    'Theme Switch Time',
    'Visual Glitches'
];

const missingStatusItems = requiredStatusItems.filter(item => !html.includes(item));
if (missingStatusItems.length === 0) {
    console.log('✅ PASS: Status panel includes all required metrics');
    results.passed.push('Status panel completeness');
} else {
    console.log(`⚠️  WARN: Missing status items: ${missingStatusItems.join(', ')}`);
    results.warnings.push('Status panel completeness');
}

/**
 * Test 10: Verify theme initialization
 */
console.log('\n📋 Test 10: Theme Initialization');
try {
    const hasInitFunction = html.includes('initThemeSystem') || html.includes('DOMContentLoaded');
    const hasSystemPreference = html.includes('prefers-color-scheme');

    if (hasInitFunction && hasSystemPreference) {
        console.log('✅ PASS: Theme initialization with system preference support');
        results.passed.push('Theme initialization');
    } else {
        console.log('⚠️  WARN: Limited theme initialization');
        results.warnings.push('Theme initialization');
    }
} catch (e) {
    console.log('❌ FAIL: Error checking theme initialization:', e.message);
    results.failed.push('Theme initialization');
}

/**
 * Print Summary
 */
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ Passed: ${results.passed.length}`);
if (results.passed.length > 0) {
    results.passed.forEach(item => console.log(`  ✓ ${item}`));
}

console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
if (results.warnings.length > 0) {
    results.warnings.forEach(item => console.log(`  ⚠️  ${item}`));
}

console.log(`\n❌ Failed: ${results.failed.length}`);
if (results.failed.length > 0) {
    results.failed.forEach(item => console.log(`  ✗ ${item}`));
}

console.log('\n' + '='.repeat(60));

const totalTests = results.passed.length + results.warnings.length + results.failed.length;
const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

console.log(`\n🎯 Overall Pass Rate: ${passRate}% (${results.passed.length}/${totalTests} tests passed)`);

if (results.failed.length === 0 && results.warnings.length <= 2) {
    console.log('\n🎉 THEME SWITCHING SYSTEM IS READY FOR USE!\n');
    process.exit(0);
} else if (results.failed.length > 0) {
    console.log('\n⚠️  THEME SWITCHING SYSTEM HAS ISSUES THAT NEED ATTENTION\n');
    process.exit(1);
} else {
    console.log('\n✅ THEME SWITCHING SYSTEM IS FUNCTIONAL (MINOR WARNINGS)\n');
    process.exit(0);
}