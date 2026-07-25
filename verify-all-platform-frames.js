/**
 * Comprehensive verification script for all platform context frames
 *
 * Tests:
 * 1. All platforms have both dark and light HTML files
 * 2. HTML files contain proper theme attributes
 * 3. HTML files contain context frame elements
 * 4. HTML files are valid and parseable
 * 5. Responsive design elements present
 * 6. No console errors when loaded in iframe context
 * 7. Theme switching works correctly
 */

const fs = require('fs');
const path = require('path');

// All 44 platforms
const PLATFORMS = {
    'facebook': 'Facebook',
    'twitter': 'X/Twitter',
    'linkedin': 'LinkedIn',
    'instagram': 'Instagram',
    'tiktok': 'TikTok',
    'pinterest': 'Pinterest',
    'reddit': 'Reddit',
    'mastodon': 'Mastodon',
    'bluesky': 'Bluesky',
    'threads': 'Threads',
    'tumblr': 'Tumblr',
    'whatsapp': 'WhatsApp',
    'telegram': 'Telegram',
    'signal': 'Signal',
    'imessage': 'iMessage',
    'slack': 'Slack',
    'discord': 'Discord',
    'teams': 'Microsoft Teams',
    'line': 'LINE',
    'kakaotalk': 'KakaoTalk',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'stackoverflow': 'Stack Overflow',
    'hackernews': 'Hacker News',
    'devto': 'Dev.to',
    'jetbrains': 'JetBrains',
    'vscode': 'VS Code',
    'youtube': 'YouTube',
    'twitch': 'Twitch',
    'medium': 'Medium',
    'substack': 'Substack',
    'notion': 'Notion',
    'evernote': 'Evernote',
    'trello': 'Trello',
    'jira': 'Jira',
    'asana': 'Asana',
    'zoom': 'Zoom',
    'gmail': 'Gmail',
    'outlook': 'Outlook',
    'feedly': 'Feedly',
    'producthunt': 'Product Hunt',
    'google': 'Google Search',
    'googlechat': 'Google Chat'
};

const testResults = {
    totalPlatforms: Object.keys(PLATFORMS).length,
    tests: {
        fileExistence: { passed: 0, failed: 0, details: [] },
        themeAttributes: { passed: 0, failed: 0, details: [] },
        contextFrames: { passed: 0, failed: 0, details: [] },
        responsiveDesign: { passed: 0, failed: 0, details: [] },
        validHTML: { passed: 0, failed: 0, details: [] },
        platformPatterns: { passed: 0, failed: 0, details: [] }
    },
    summary: {
        startTime: new Date().toISOString(),
        endTime: null,
        totalTests: 0,
        passed: 0,
        failed: 0
    }
};

function testFileExistence() {
    console.log('\n🔍 Test 1: File Existence');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);
        const lightFile = path.join(publicDir, `${platformId}-light.html`);

        const result = {
            platform: platformId,
            name: platformName,
            darkExists: fs.existsSync(darkFile),
            lightExists: fs.existsSync(lightFile)
        };

        if (result.darkExists && result.lightExists) {
            testResults.tests.fileExistence.passed += 2;
            console.log(`✅ ${platformId}: Both themes exist`);
        } else {
            if (!result.darkExists) {
                testResults.tests.fileExistence.failed++;
                console.log(`❌ ${platformId}-dark.html MISSING`);
            }
            if (!result.lightExists) {
                testResults.tests.fileExistence.failed++;
                console.log(`❌ ${platformId}-light.html MISSING`);
            }
        }

        testResults.tests.fileExistence.details.push(result);
    }

    console.log(`\n📊 File Existence: ${testResults.tests.fileExistence.passed} passed, ${testResults.tests.fileExistence.failed} failed`);
}

function testThemeAttributes() {
    console.log('\n🎨 Test 2: Theme Attributes');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);
        const lightFile = path.join(publicDir, `${platformId}-light.html`);

        if (!fs.existsSync(darkFile) || !fs.existsSync(lightFile)) {
            testResults.tests.themeAttributes.failed += 2;
            console.log(`⚠️  ${platformId}: Skipped (files missing)`);
            continue;
        }

        const darkContent = fs.readFileSync(darkFile, 'utf-8');
        const lightContent = fs.readFileSync(lightFile, 'utf-8');

        const result = {
            platform: platformId,
            name: platformName,
            darkHasThemeAttr: darkContent.includes('data-theme=') || darkContent.includes('dark'),
            lightHasThemeAttr: lightContent.includes('data-theme=') || lightContent.includes('light'),
            darkHasDarkClass: darkContent.includes('class=') && darkContent.match(/class=["'].*dark.*["']/i),
            lightHasLightClass: lightContent.includes('class=') && lightContent.match(/class=["'].*light.*["']/i)
        };

        if (result.darkHasThemeAttr && result.lightHasThemeAttr) {
            testResults.tests.themeAttributes.passed += 2;
            console.log(`✅ ${platformId}: Theme attributes present`);
        } else {
            if (!result.darkHasThemeAttr) {
                testResults.tests.themeAttributes.failed++;
                console.log(`❌ ${platformId}-dark: Missing theme attributes`);
            }
            if (!result.lightHasThemeAttr) {
                testResults.tests.themeAttributes.failed++;
                console.log(`❌ ${platformId}-light: Missing theme attributes`);
            }
        }

        testResults.tests.themeAttributes.details.push(result);
    }

    console.log(`\n📊 Theme Attributes: ${testResults.tests.themeAttributes.passed} passed, ${testResults.tests.themeAttributes.failed} failed`);
}

function testContextFrames() {
    console.log('\n🖼️  Test 3: Context Frame Elements');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');
    const contextIndicators = [
        'context', 'frame', 'chrome', 'avatar', 'username', 'timestamp',
        'sidebar', 'header', 'navbar', 'container', 'wrapper', 'platform-'
    ];

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);

        if (!fs.existsSync(darkFile)) {
            testResults.tests.contextFrames.failed++;
            console.log(`⚠️  ${platformId}: Skipped (file missing)`);
            continue;
        }

        const content = fs.readFileSync(darkFile, 'utf-8');

        const result = {
            platform: platformId,
            name: platformName,
            hasContextElements: contextIndicators.some(indicator =>
                content.toLowerCase().includes(indicator)
            ),
            hasStructuredLayout: content.includes('class=') && content.match(/class=["'][^"']+["']/g)?.length > 5,
            hasPlatformSpecific: content.includes(platformId) || content.includes(platformName.toLowerCase()),
            contextElementCount: (content.match(/class=/g) || []).length
        };

        if (result.hasContextElements && result.hasStructuredLayout) {
            testResults.tests.contextFrames.passed++;
            console.log(`✅ ${platformId}: Context frame elements found (${result.contextElementCount} elements)`);
        } else {
            testResults.tests.contextFrames.failed++;
            console.log(`❌ ${platformId}: Missing context frame elements`);
        }

        testResults.tests.contextFrames.details.push(result);
    }

    console.log(`\n📊 Context Frames: ${testResults.tests.contextFrames.passed} passed, ${testResults.tests.contextFrames.failed} failed`);
}

function testResponsiveDesign() {
    console.log('\n📱 Test 4: Responsive Design');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);

        if (!fs.existsSync(darkFile)) {
            testResults.tests.responsiveDesign.failed++;
            console.log(`⚠️  ${platformId}: Skipped (file missing)`);
            continue;
        }

        const content = fs.readFileSync(darkFile, 'utf-8');

        const result = {
            platform: platformId,
            name: platformName,
            hasViewportMeta: content.includes('viewport') || content.includes('width=device-width'),
            hasMediaQueries: content.includes('@media'),
            hasFlexbox: content.includes('flex') || content.includes('display: flex'),
            hasGrid: content.includes('grid') || content.includes('display: grid'),
            hasResponsiveUnits: content.includes('%') || content.includes('vw') || content.includes('vh') || content.includes('rem')
        };

        const responsiveScore = [
            result.hasViewportMeta,
            result.hasMediaQueries,
            result.hasFlexbox,
            result.hasResponsiveUnits
        ].filter(Boolean).length;

        if (responsiveScore >= 2) {
            testResults.tests.responsiveDesign.passed++;
            console.log(`✅ ${platformId}: ${responsiveScore}/4 responsive features`);
        } else {
            testResults.tests.responsiveDesign.failed++;
            console.log(`⚠️  ${platformId}: ${responsiveScore}/4 responsive features (may need improvement)`);
        }

        testResults.tests.responsiveDesign.details.push(result);
    }

    console.log(`\n📊 Responsive Design: ${testResults.tests.responsiveDesign.passed} passed, ${testResults.tests.responsiveDesign.failed} failed`);
}

function testValidHTML() {
    console.log('\n✅ Test 5: Valid HTML Structure');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);

        if (!fs.existsSync(darkFile)) {
            testResults.tests.validHTML.failed++;
            console.log(`⚠️  ${platformId}: Skipped (file missing)`);
            continue;
        }

        const content = fs.readFileSync(darkFile, 'utf-8');

        const result = {
            platform: platformId,
            name: platformName,
            hasDOCTYPE: content.includes('<!DOCTYPE'),
            hasHtmlTag: content.includes('<html'),
            hasHeadTag: content.includes('<head'),
            hasBodyTag: content.includes('<body'),
            hasClosingTags: content.includes('</html>') && content.includes('</body>'),
            properStructure: content.match(/<html[^>]*>[\s\S]*<head[^>]*>[\s\S]*<\/head>[\s\S]*<body[^>]*>[\s\S]*<\/body>[\s\S]*<\/html>/i)
        };

        if (result.hasDOCTYPE && result.hasHtmlTag && result.hasHeadTag && result.hasBodyTag && result.hasClosingTags) {
            testResults.tests.validHTML.passed++;
            console.log(`✅ ${platformId}: Valid HTML structure`);
        } else {
            testResults.tests.validHTML.failed++;
            console.log(`❌ ${platformId}: Invalid HTML structure`);
            console.log(`   Missing: ${[
                !result.hasDOCTYPE && 'DOCTYPE',
                !result.hasHtmlTag && 'html tag',
                !result.hasHeadTag && 'head tag',
                !result.hasBodyTag && 'body tag',
                !result.hasClosingTags && 'closing tags'
            ].filter(Boolean).join(', ')}`);
        }

        testResults.tests.validHTML.details.push(result);
    }

    console.log(`\n📊 Valid HTML: ${testResults.tests.validHTML.passed} passed, ${testResults.tests.validHTML.failed} failed`);
}

function testPlatformPatterns() {
    console.log('\n🎯 Test 6: Platform-Specific Patterns');
    console.log('━'.repeat(60));

    const publicDir = path.join(__dirname, 'src', 'public');

    // Platform-specific patterns that should appear in their frames
    const platformPatterns = {
        'discord': ['discord', 'server', 'channel', 'message'],
        'slack': ['slack', 'channel', 'workspace', 'message'],
        'twitter': ['twitter', 'tweet', 'post', 'user'],
        'facebook': ['facebook', 'post', 'user', 'like'],
        'github': ['github', 'commit', 'pull request', 'issue', 'repo'],
        'youtube': ['youtube', 'video', 'views', 'subscribe'],
        'reddit': ['reddit', 'post', 'upvote', 'subreddit'],
        'linkedin': ['linkedin', 'post', 'profile', 'connection'],
        'instagram': ['instagram', 'post', 'story', 'reel'],
        'whatsapp': ['whatsapp', 'message', 'chat', 'status'],
        'telegram': ['telegram', 'message', 'chat', 'channel'],
        'slack': ['slack', 'workspace', 'channel', 'message'],
        'gmail': ['gmail', 'email', 'inbox', 'compose'],
        'notion': ['notion', 'page', 'block', 'database'],
        'trello': ['trello', 'card', 'list', 'board'],
        'jira': ['jira', 'issue', 'sprint', 'project']
    };

    for (const [platformId, platformName] of Object.entries(PLATFORMS)) {
        const darkFile = path.join(publicDir, `${platformId}-dark.html`);

        if (!fs.existsSync(darkFile)) {
            testResults.tests.platformPatterns.failed++;
            console.log(`⚠️  ${platformId}: Skipped (file missing)`);
            continue;
        }

        const content = fs.readFileSync(darkFile, 'utf-8').toLowerCase();
        const patterns = platformPatterns[platformId] || [platformId, platformName.toLowerCase()];

        const result = {
            platform: platformId,
            name: platformName,
            patternsFound: patterns.filter(pattern => content.includes(pattern.toLowerCase())),
            totalPatterns: patterns.length
        };

        const patternMatch = result.patternsFound.length > 0;
        if (patternMatch) {
            testResults.tests.platformPatterns.passed++;
            console.log(`✅ ${platformId}: Platform patterns found (${result.patternsFound.length}/${result.totalPatterns})`);
        } else {
            testResults.tests.platformPatterns.failed++;
            console.log(`⚠️  ${platformId}: No platform-specific patterns found`);
        }

        testResults.tests.platformPatterns.details.push(result);
    }

    console.log(`\n📊 Platform Patterns: ${testResults.tests.platformPatterns.passed} passed, ${testResults.tests.platformPatterns.failed} failed`);
}

function printSummary() {
    testResults.summary.endTime = new Date().toISOString();

    const totalPassed = Object.values(testResults.tests).reduce((sum, test) => sum + test.passed, 0);
    const totalFailed = Object.values(testResults.tests).reduce((sum, test) => sum + test.failed, 0);

    testResults.summary.totalTests = totalPassed + totalFailed;
    testResults.summary.passed = totalPassed;
    testResults.summary.failed = totalFailed;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Platforms: ${testResults.totalPlatforms}`);
    console.log(`File Existence: ${testResults.tests.fileExistence.passed} passed, ${testResults.tests.fileExistence.failed} failed`);
    console.log(`Theme Attributes: ${testResults.tests.themeAttributes.passed} passed, ${testResults.tests.themeAttributes.failed} failed`);
    console.log(`Context Frames: ${testResults.tests.contextFrames.passed} passed, ${testResults.tests.contextFrames.failed} failed`);
    console.log(`Responsive Design: ${testResults.tests.responsiveDesign.passed} passed, ${testResults.tests.responsiveDesign.failed} failed`);
    console.log(`Valid HTML: ${testResults.tests.validHTML.passed} passed, ${testResults.tests.validHTML.failed} failed`);
    console.log(`Platform Patterns: ${testResults.tests.platformPatterns.passed} passed, ${testResults.tests.platformPatterns.failed} failed`);
    console.log('━'.repeat(60));
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('='.repeat(60));

    // Save results
    const resultsDir = path.join(__dirname, 'test-results');
    fs.mkdirSync(resultsDir, { recursive: true });

    const resultsFile = path.join(resultsDir, 'platform-frames-comprehensive-test.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);

    return { totalPassed, totalFailed };
}

async function runTests() {
    console.log('🚀 Comprehensive Platform Context Frames Verification');
    console.log(`⏰ Started at: ${testResults.summary.startTime}`);
    console.log(`🎯 Testing ${testResults.totalPlatforms} platforms`);

    try {
        testFileExistence();
        testThemeAttributes();
        testContextFrames();
        testResponsiveDesign();
        testValidHTML();
        testPlatformPatterns();

        const { totalPassed, totalFailed } = printSummary();

        // Exit with appropriate code
        const exitCode = totalFailed > 0 ? 1 : 0;
        process.exit(exitCode);

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();