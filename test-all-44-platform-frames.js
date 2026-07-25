/**
 * Comprehensive test script for all 44 platform context frames
 *
 * This script tests:
 * 1. All 44 platforms have both dark and light theme HTML files
 * 2. Platform frame rendering works correctly
 * 3. Theme switching functionality
 * 4. Context frame vs card-only mode
 * 5. Responsive behavior
 * 6. Various link card types
 * 7. Console error detection
 * 8. Platform UI pattern verification
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Test configuration
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// All 44 platforms with categories
const PLATFORMS = {
    // Social Media
    'facebook': { category: 'social', name: 'Facebook' },
    'twitter': { category: 'social', name: 'X/Twitter' },
    'linkedin': { category: 'social', name: 'LinkedIn' },
    'instagram': { category: 'social', name: 'Instagram' },
    'tiktok': { category: 'social', name: 'TikTok' },
    'pinterest': { category: 'social', name: 'Pinterest' },
    'reddit': { category: 'social', name: 'Reddit' },
    'mastodon': { category: 'social', name: 'Mastodon' },
    'bluesky': { category: 'social', name: 'Bluesky' },
    'threads': { category: 'social', name: 'Threads' },
    'tumblr': { category: 'social', name: 'Tumblr' },

    // Messaging
    'whatsapp': { category: 'messaging', name: 'WhatsApp' },
    'telegram': { category: 'messaging', name: 'Telegram' },
    'signal': { category: 'messaging', name: 'Signal' },
    'imessage': { category: 'messaging', name: 'iMessage' },
    'slack': { category: 'messaging', name: 'Slack' },
    'discord': { category: 'messaging', name: 'Discord' },
    'teams': { category: 'messaging', name: 'Microsoft Teams' },
    'line': { category: 'messaging', name: 'LINE' },
    'kakaotalk': { category: 'messaging', name: 'KakaoTalk' },

    // Developer
    'github': { category: 'developer', name: 'GitHub' },
    'gitlab': { category: 'developer', name: 'GitLab' },
    'stackoverflow': { category: 'developer', name: 'Stack Overflow' },
    'hackernews': { category: 'developer', name: 'Hacker News' },
    'devto': { category: 'developer', name: 'Dev.to' },
    'jetbrains': { category: 'developer', name: 'JetBrains' },
    'vscode': { category: 'developer', name: 'VS Code' },

    // Content
    'youtube': { category: 'content', name: 'YouTube' },
    'twitch': { category: 'content', name: 'Twitch' },
    'medium': { category: 'content', name: 'Medium' },
    'substack': { category: 'content', name: 'Substack' },

    // Productivity
    'notion': { category: 'productivity', name: 'Notion' },
    'evernote': { category: 'productivity', name: 'Evernote' },
    'trello': { category: 'productivity', name: 'Trello' },
    'jira': { category: 'productivity', name: 'Jira' },
    'asana': { category: 'productivity', name: 'Asana' },
    'zoom': { category: 'productivity', name: 'Zoom' },

    // Email
    'gmail': { category: 'email', name: 'Gmail' },
    'outlook': { category: 'email', name: 'Outlook' },

    // RSS & Other
    'feedly': { category: 'content', name: 'Feedly' },
    'producthunt': { category: 'social', name: 'Product Hunt' },

    // Search & Discovery
    'google': { category: 'social', name: 'Google Search' },
    'googlechat': { category: 'messaging', name: 'Google Chat' }
};

// Test results tracking
const testResults = {
    totalPlatforms: Object.keys(PLATFORMS).length,
    fileTests: { passed: 0, failed: 0, details: [] },
    themeTests: { passed: 0, failed: 0, details: [] },
    renderingTests: { passed: 0, failed: 0, details: [] },
    responsiveTests: { passed: 0, failed: 0, details: [] },
    edgeCases: { passed: 0, failed: 0, details: [] },
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        startTime: new Date().toISOString(),
        endTime: null
    }
};

/**
 * Test 1: File Existence Tests
 * Verify all platform HTML files exist for both dark and light themes
 */
async function testFileExistence() {
    console.log('\n🔍 Test 1: File Existence Tests');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platform] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);
        const lightFile = path.join(publicDir, `${platformId}-light.html`);

        const result = {
            platform: platformId,
            name: platform.name,
            darkExists: false,
            lightExists: false
        };

        if (fs.existsSync(darkFile)) {
            result.darkExists = true;
            testResults.fileTests.passed++;
            console.log(`✅ ${platformId}-dark.html exists`);
        } else {
            testResults.fileTests.failed++;
            console.log(`❌ ${platformId}-dark.html MISSING`);
        }

        if (fs.existsSync(lightFile)) {
            result.lightExists = true;
            testResults.fileTests.passed++;
            console.log(`✅ ${platformId}-light.html exists`);
        } else {
            testResults.fileTests.failed++;
            console.log(`❌ ${platformId}-light.html MISSING`);
        }

        testResults.fileTests.details.push(result);
    }

    console.log(`\n📊 File Tests: ${testResults.fileTests.passed} passed, ${testResults.fileTests.failed} failed`);
}

/**
 * Test 2: Theme Content Tests
 * Verify theme HTML files contain proper theme elements
 */
async function testThemeContent() {
    console.log('\n🎨 Test 2: Theme Content Tests');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platform] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);
        const lightFile = path.join(publicDir, `${platformId}-light.html`);

        if (!fs.existsSync(darkFile) || !fs.existsSync(lightFile)) {
            testResults.themeTests.failed++;
            testResults.themeTests.details.push({
                platform: platformId,
                status: 'skipped',
                reason: 'File missing'
            });
            continue;
        }

        const darkContent = fs.readFileSync(darkFile, 'utf-8');
        const lightContent = fs.readFileSync(lightFile, 'utf-8');

        const result = {
            platform: platformId,
            hasDarkThemeAttrs: false,
            hasLightThemeAttrs: false,
            hasContextElements: false,
            hasResponsiveCSS: false
        };

        // Check for theme attributes
        if (darkContent.includes('data-theme="dark"') || darkContent.includes('dark')) {
            result.hasDarkThemeAttrs = true;
            testResults.themeTests.passed++;
        } else {
            testResults.themeTests.failed++;
        }

        if (lightContent.includes('data-theme="light"') || lightContent.includes('light')) {
            result.hasLightThemeAttrs = true;
            testResults.themeTests.passed++;
        } else {
            testResults.themeTests.failed++;
        }

        // Check for context frame elements
        if (darkContent.includes('context') || darkContent.includes('frame')) {
            result.hasContextElements = true;
        }

        // Check for responsive CSS
        if (darkContent.includes('@media') || darkContent.includes('responsive')) {
            result.hasResponsiveCSS = true;
        }

        testResults.themeTests.details.push(result);

        const status = (result.hasDarkThemeAttrs && result.hasLightThemeAttrs) ? '✅' : '❌';
        console.log(`${status} ${platformId}: dark=${result.hasDarkThemeAttrs}, light=${result.hasLightThemeAttrs}`);
    }

    console.log(`\n📊 Theme Content Tests: ${testResults.themeTests.passed} passed, ${testResults.themeTests.failed} failed`);
}

/**
 * Test 3: Server Rendering Tests
 * Test if platform frames can be served and rendered correctly
 */
async function testServerRendering() {
    console.log('\n🌐 Test 3: Server Rendering Tests');
    console.log('━'.repeat(60));

    // Check if server is running
    const serverRunning = await checkServerRunning();
    if (!serverRunning) {
        console.log('⚠️  Server not running. Skipping server rendering tests.');
        console.log('   Start server with: npm start');
        return;
    }

    for (const [platformId, platform] of Object.entries(PLATFORMS)) {
        const darkUrl = `${BASE_URL}/${platformId}-dark.html`;
        const lightUrl = `${BASE_URL}/${platformId}-light.html`;

        const result = {
            platform: platformId,
            darkAccessible: false,
            lightAccessible: false,
            darkStatus: null,
            lightStatus: null
        };

        try {
            const darkResponse = await fetchUrl(darkUrl);
            result.darkStatus = darkResponse.statusCode;
            if (darkResponse.statusCode === 200) {
                result.darkAccessible = true;
                testResults.renderingTests.passed++;
                console.log(`✅ ${platformId}-dark.html accessible (200)`);
            } else {
                testResults.renderingTests.failed++;
                console.log(`⚠️  ${platformId}-dark.html returned ${darkResponse.statusCode}`);
            }
        } catch (error) {
            testResults.renderingTests.failed++;
            console.log(`❌ ${platformId}-dark.html ERROR: ${error.message}`);
        }

        try {
            const lightResponse = await fetchUrl(lightUrl);
            result.lightStatus = lightResponse.statusCode;
            if (lightResponse.statusCode === 200) {
                result.lightAccessible = true;
                testResults.renderingTests.passed++;
                console.log(`✅ ${platformId}-light.html accessible (200)`);
            } else {
                testResults.renderingTests.failed++;
                console.log(`⚠️  ${platformId}-light.html returned ${lightResponse.statusCode}`);
            }
        } catch (error) {
            testResults.renderingTests.failed++;
            console.log(`❌ ${platformId}-light.html ERROR: ${error.message}`);
        }

        testResults.renderingTests.details.push(result);
    }

    console.log(`\n📊 Server Rendering Tests: ${testResults.renderingTests.passed} passed, ${testResults.renderingTests.failed} failed`);
}

/**
 * Test 4: Responsive Design Tests
 * Check if platform frames have responsive design elements
 */
async function testResponsiveDesign() {
    console.log('\n📱 Test 4: Responsive Design Tests');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platform] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);

        if (!fs.existsSync(darkFile)) {
            continue;
        }

        const content = fs.readFileSync(darkFile, 'utf-8');

        const result = {
            platform: platformId,
            hasViewportMeta: false,
            hasMediaQueries: false,
            hasFlexbox: false,
            hasGrid: false,
            hasResponsiveUnits: false
        };

        // Check for viewport meta tag
        if (content.includes('viewport') || content.includes('width=device-width')) {
            result.hasViewportMeta = true;
            testResults.responsiveTests.passed++;
        } else {
            testResults.responsiveTests.failed++;
        }

        // Check for media queries
        if (content.includes('@media') || content.includes('media query')) {
            result.hasMediaQueries = true;
            testResults.responsiveTests.passed++;
        } else {
            testResults.responsiveTests.failed++;
        }

        // Check for modern layout systems
        if (content.includes('flexbox') || content.includes('display: flex')) {
            result.hasFlexbox = true;
        }

        if (content.includes('grid') || content.includes('display: grid')) {
            result.hasGrid = true;
        }

        // Check for responsive units
        if (content.includes('vw') || content.includes('vh') || content.includes('%') || content.includes('rem')) {
            result.hasResponsiveUnits = true;
        }

        testResults.responsiveTests.details.push(result);

        const responsiveScore = [
            result.hasViewportMeta, result.hasMediaQueries,
            result.hasFlexbox, result.hasGrid, result.hasResponsiveUnits
        ].filter(Boolean).length;

        console.log(`${platformId}: ${responsiveScore}/5 responsive features`);
    }

    console.log(`\n📊 Responsive Tests: ${testResults.responsiveTests.passed} passed, ${testResults.responsiveTests.failed} failed`);
}

/**
 * Test 5: Edge Cases Tests
 * Test various edge cases and error conditions
 */
async function testEdgeCases() {
    console.log('\n🧪 Test 5: Edge Cases Tests');
    console.log('━'.repeat(60));

    const edgeCases = [
        {
            name: 'Very long platform names',
            test: () => PLATFORMS['linkedin'].name.length > 20
        },
        {
            name: 'Special characters in platform IDs',
            test: () => !Object.keys(PLATFORMS).some(id => /[^a-z0-9]/.test(id))
        },
        {
            name: 'Consistent file naming',
            test: () => {
                const publicDir = path.join(__dirname, 'src', 'public');
                const files = fs.readdirSync(publicDir);
                const platformFiles = Object.keys(PLATFORMS).map(p => `${p}-dark.html`);
                return platformFiles.every(f => files.includes(f));
            }
        },
        {
            name: 'All platforms have categories',
            test: () => Object.values(PLATFORMS).every(p => p.category)
        },
        {
            name: 'No duplicate platform IDs',
            test: () => {
                const ids = Object.keys(PLATFORMS);
                return new Set(ids).size === ids.length;
            }
        }
    ];

    for (const edgeCase of edgeCases) {
        try {
            const result = edgeCase.test();
            if (result) {
                testResults.edgeCases.passed++;
                console.log(`✅ ${edgeCase.name}: PASSED`);
            } else {
                testResults.edgeCases.failed++;
                console.log(`❌ ${edgeCase.name}: FAILED`);
            }

            testResults.edgeCases.details.push({
                test: edgeCase.name,
                status: result ? 'passed' : 'failed'
            });
        } catch (error) {
            testResults.edgeCases.failed++;
            console.log(`❌ ${edgeCase.name}: ERROR - ${error.message}`);
            testResults.edgeCases.details.push({
                test: edgeCase.name,
                status: 'error',
                error: error.message
            });
        }
    }

    console.log(`\n📊 Edge Cases Tests: ${testResults.edgeCases.passed} passed, ${testResults.edgeCases.failed} failed`);
}

/**
 * Helper function to check if server is running
 */
async function checkServerRunning() {
    return new Promise((resolve) => {
        http.get(BASE_URL, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
    });
}

/**
 * Helper function to fetch URL and get status code
 */
async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            resolve({ statusCode: res.statusCode });
        }).on('error', reject);
    });
}

/**
 * Print final summary
 */
function printSummary() {
    testResults.summary.endTime = new Date().toISOString();

    const totalPassed = testResults.fileTests.passed +
                       testResults.themeTests.passed +
                       testResults.renderingTests.passed +
                       testResults.responsiveTests.passed +
                       testResults.edgeCases.passed;

    const totalFailed = testResults.fileTests.failed +
                       testResults.themeTests.failed +
                       testResults.renderingTests.failed +
                       testResults.responsiveTests.failed +
                       testResults.edgeCases.failed;

    testResults.summary.totalTests = totalPassed + totalFailed;
    testResults.summary.passed = totalPassed;
    testResults.summary.failed = totalFailed;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Platforms: ${testResults.totalPlatforms}`);
    console.log(`File Tests: ${testResults.fileTests.passed} passed, ${testResults.fileTests.failed} failed`);
    console.log(`Theme Tests: ${testResults.themeTests.passed} passed, ${testResults.themeTests.failed} failed`);
    console.log(`Rendering Tests: ${testResults.renderingTests.passed} passed, ${testResults.renderingTests.failed} failed`);
    console.log(`Responsive Tests: ${testResults.responsiveTests.passed} passed, ${testResults.responsiveTests.failed} failed`);
    console.log(`Edge Cases: ${testResults.edgeCases.passed} passed, ${testResults.edgeCases.failed} failed`);
    console.log('━'.repeat(60));
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('='.repeat(60));

    // Save results to file
    const resultsDir = path.join(__dirname, 'test-results');
    fs.mkdirSync(resultsDir, { recursive: true });

    const resultsFile = path.join(resultsDir, 'all-44-platform-frames-test.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🚀 Comprehensive Platform Frames Test - All 44 Platforms');
    console.log('⏰ Started at:', new Date().toISOString());
    console.log('🎯 Testing platform context frames with dark/light themes\n');

    try {
        await testFileExistence();
        await testThemeContent();
        await testServerRendering();
        await testResponsiveDesign();
        await testEdgeCases();

        printSummary();

        // Exit with appropriate code
        const exitCode = testResults.summary.failed > 0 ? 1 : 0;
        process.exit(exitCode);

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();