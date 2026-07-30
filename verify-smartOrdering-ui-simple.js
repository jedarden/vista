/**
 * Simple verification script for smartOrdering UI
 * This script uses curl and basic checks to verify the UI works
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const RESULTS = {
    tests: [],
    errors: [],
    startTime: new Date().toISOString()
};

function logTest(testName, passed, details = '') {
    const result = { test: testName, passed, details, timestamp: new Date().toISOString() };
    RESULTS.tests.push(result);
    console.log(`[${passed ? '✓' : '✗'}] ${testName}${details ? ': ' + details : ''}`);
    if (!passed) {
        RESULTS.errors.push(result);
    }
}

async function checkURL(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ success: true, data, statusCode: res.statusCode }));
        }).on('error', (error) => {
            resolve({ success: false, error: error.message });
        });
    });
}

async function main() {
    console.log('Starting VISTA smartOrdering UI Verification...');
    console.log('');

    // Test 1: Check if server is running
    console.log('Test 1: Checking if VISTA server is running');
    try {
        const result = await checkURL(BASE_URL);
        logTest('Server Running', result.success && result.statusCode === 200,
            result.success ? `Server responded with ${result.statusCode}` : result.error);
    } catch (error) {
        logTest('Server Running', false, error.message);
    }

    // Test 2: Check if page loads with smartOrdering parameter
    console.log('\nTest 2: Loading page with smartOrdering=true');
    try {
        const result = await checkURL(`${BASE_URL}/?smartOrdering=true`);
        const hasVistaContent = result.data.includes('VISTA') && result.data.includes('platform');

        logTest('Page Load with smartOrdering=true', hasVistaContent,
            hasVistaContent ? 'Page contains VISTA content' : 'Page content missing');

        // Check for smartOrdering in HTML
        const hasSmartOrderingScript = result.data.includes('smartOrdering') ||
            result.data.includes('platformPrefs');
        logTest('smartOrdering Code Present', hasSmartOrderingScript,
            hasSmartOrderingScript ? 'smartOrdering code found in page' : 'No smartOrdering code found');

    } catch (error) {
        logTest('Page Load with smartOrdering=true', false, error.message);
    }

    // Test 3: Check for platform cards in the HTML
    console.log('\nTest 3: Checking for platform card HTML structure');
    try {
        const result = await checkURL(`${BASE_URL}/?smartOrdering=true`);

        // Look for platform card indicators
        const hasPreviewGrid = result.data.includes('previewGrid') || result.data.includes('preview-grid');
        const hasPlatformCards = result.data.includes('platform-card') || result.data.includes('platformCard');

        logTest('Platform Card HTML Structure', hasPreviewGrid && hasPlatformCards,
            hasPreviewGrid ? 'Found preview grid and platform cards' : 'Platform card structure not found');

    } catch (error) {
        logTest('Platform Card HTML Structure', false, error.message);
    }

    // Test 4: Check for input fields
    console.log('\nTest 4: Checking for input fields');
    try {
        const result = await checkURL(`${BASE_URL}/?smartOrdering=true`);

        const hasUrlInput = result.data.includes('urlInput') || result.data.includes('url-input') ||
            result.data.includes('placeholder') && result.data.includes('URL');
        const hasAnalyzeButton = result.data.includes('analyze') || result.data.includes('Analyze') ||
            result.data.includes('Preview') || result.data.includes('preview');

        logTest('URL Input Field', hasUrlInput,
            hasUrlInput ? 'URL input field found' : 'URL input field not found');

        logTest('Analyze/Preview Button', hasAnalyzeButton,
            hasAnalyzeButton ? 'Analyze/Preview button found' : 'Analyze button not found');

    } catch (error) {
        logTest('Input Fields Check', false, error.message);
    }

    // Test 5: Check for CSS files
    console.log('\nTest 5: Checking for CSS styling');
    try {
        const result = await checkURL(`${BASE_URL}/?smartOrdering=true`);

        const hasStyleCSS = result.data.includes('style.css') || result.data.includes('<style>');
        const hasFrameThemeCSS = result.data.includes('frames-theme') || result.data.includes('frame-layouts');

        logTest('CSS Styling Present', hasStyleCSS && hasFrameThemeCSS,
            hasStyleCSS ? 'CSS files linked' : 'CSS styling may be missing');

    } catch (error) {
        logTest('CSS Styling Check', false, error.message);
    }

    // Test 6: Check for JavaScript files
    console.log('\nTest 6: Checking for JavaScript functionality');
    try {
        const result = await checkURL(`${BASE_URL}/?smartOrdering=true`);

        const hasScripts = result.data.includes('<script') && result.data.includes('src=');
        const hasAppScript = result.data.includes('app.js') || result.data.includes('.js');

        logTest('JavaScript Files', hasScripts && hasAppScript,
            hasScripts ? 'JavaScript files linked' : 'JavaScript may be missing');

    } catch (error) {
        logTest('JavaScript Check', false, error.message);
    }

    // Write results
    RESULTS.endTime = new Date().toISOString();
    RESULTS.summary = {
        total: RESULTS.tests.length,
        passed: RESULTS.tests.filter(t => t.passed).length,
        failed: RESULTS.tests.filter(t => !t.passed).length,
        errors: RESULTS.errors.length
    };

    const resultsPath = path.join(__dirname, 'notes', 'bf-5a7dp-smartOrdering-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${RESULTS.summary.total}`);
    console.log(`Passed: ${RESULTS.summary.passed}`);
    console.log(`Failed: ${RESULTS.summary.failed}`);
    console.log(`Errors: ${RESULTS.summary.errors}`);
    console.log('');
    console.log(`Results saved to: ${resultsPath}`);
    console.log('='.repeat(60));

    if (RESULTS.summary.failed > 0) {
        console.log('\nFailed tests:');
        RESULTS.tests.filter(t => !t.passed).forEach(t => {
            console.log(`  - ${t.test}: ${t.details}`);
        });
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Open test-smartOrdering-ui-manual.html in a browser');
    console.log('2. Follow the manual test checklist');
    console.log('3. Take screenshots at key moments');
    console.log('4. Document any issues found');

    process.exit(RESULTS.summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
});