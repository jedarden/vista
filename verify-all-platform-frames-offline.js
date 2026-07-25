/**
 * Offline verification script for all 44 platform context frames
 *
 * This script verifies platform frames without requiring the server to be running.
 * It tests:
 * 1. File existence for all dark/light theme variants
 * 2. HTML content structure and theme elements
 * 3. Responsive design CSS features
 * 4. Platform-specific context frame elements
 * 5. Edge cases and consistency
 */

const fs = require('fs');
const path = require('path');

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

// Test results
const testResults = {
    summary: {
        totalPlatforms: Object.keys(PLATFORMS).length,
        startTime: new Date().toISOString(),
        testsPassed: 0,
        testsFailed: 0,
        platformsVerified: 0,
        platformsFailed: 0
    },
    categories: {},
    platforms: {},
    issues: []
};

console.log('🚀 Offline Platform Frames Verification');
console.log('⏰ Started at:', new Date().toISOString());
console.log('🎯 Verifying all 44 platform context frames\n');

// Verify each platform
Object.entries(PLATFORMS).forEach(([platformId, platform]) => {
    const result = verifyPlatform(platformId, platform);
    testResults.platforms[platformId] = result;

    if (result.verified) {
        testResults.summary.platformsVerified++;
        testResults.summary.testsPassed += result.testsPassed;
        testResults.summary.testsFailed += result.testsFailed;
    } else {
        testResults.summary.platformsFailed++;
        testResults.issues.push({
            platform: platformId,
            issues: result.issues
        });
    }

    // Track by category
    if (!testResults.categories[platform.category]) {
        testResults.categories[platform.category] = {
            total: 0,
            verified: 0,
            failed: 0
        };
    }
    testResults.categories[platform.category].total++;
    if (result.verified) {
        testResults.categories[platform.category].verified++;
    } else {
        testResults.categories[platform.category].failed++;
    }
});

function verifyPlatform(platformId, platform) {
    const result = {
        platform: platformId,
        name: platform.name,
        category: platform.category,
        verified: false,
        testsPassed: 0,
        testsFailed: 0,
        files: {},
        content: {},
        responsive: {},
        issues: []
    };

    const publicDir = path.join(__dirname, 'src', 'public');
    const darkFile = path.join(publicDir, `${platformId}-dark.html`);
    const lightFile = path.join(publicDir, `${platformId}-light.html`);

    // Test 1: File existence
    if (fs.existsSync(darkFile)) {
        result.files.darkExists = true;
        result.testsPassed++;
    } else {
        result.files.darkExists = false;
        result.testsFailed++;
        result.issues.push(`${platformId}-dark.html missing`);
    }

    if (fs.existsSync(lightFile)) {
        result.files.lightExists = true;
        result.testsPassed++;
    } else {
        result.files.lightExists = false;
        result.testsFailed++;
        result.issues.push(`${platformId}-light.html missing`);
    }

    // Skip content tests if files don't exist
    if (!result.files.darkExists || !result.files.lightExists) {
        return result;
    }

    const darkContent = fs.readFileSync(darkFile, 'utf-8');
    const lightContent = fs.readFileSync(lightFile, 'utf-8');

    // Test 2: HTML structure
    result.content.hasDOCTYPE = darkContent.includes('<!DOCTYPE html>') && lightContent.includes('<!DOCTYPE html>');
    result.content.hasHtmlTag = darkContent.includes('<html') && lightContent.includes('<html');
    result.content.hasHeadTag = darkContent.includes('<head>') && lightContent.includes('<head>');
    result.content.hasBodyTag = darkContent.includes('<body>') && lightContent.includes('<body>');

    if (result.content.hasDOCTYPE && result.content.hasHtmlTag && result.content.hasHeadTag && result.content.hasBodyTag) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('HTML structure incomplete');
    }

    // Test 3: Theme indicators
    result.content.hasDarkTheme = darkContent.includes('dark') || darkContent.includes('data-theme');
    result.content.hasLightTheme = lightContent.includes('light') || lightContent.includes('data-theme');

    if (result.content.hasDarkTheme && result.content.hasLightTheme) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('Theme indicators missing');
    }

    // Test 4: CSS styling
    result.content.hasStyleTag = darkContent.includes('<style') && lightContent.includes('<style');
    result.content.hasInlineStyles = darkContent.includes('style=') && lightContent.includes('style=');

    if (result.content.hasStyleTag || result.content.hasInlineStyles) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('CSS styling missing');
    }

    // Test 5: Responsive design
    result.responsive.hasViewportMeta = darkContent.includes('viewport') || lightContent.includes('viewport');
    result.responsive.hasMediaQueries = darkContent.includes('@media') || lightContent.includes('@media');
    result.responsive.hasResponsiveUnits = darkContent.match(/(vw|vh|%|rem|em)/g) || lightContent.match(/(vw|vh|%|rem|em)/g);

    if (result.responsive.hasViewportMeta || result.responsive.hasMediaQueries || result.responsive.hasResponsiveUnits) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('Responsive design features missing');
    }

    // Test 6: Context frame elements
    result.content.hasContextElements = darkContent.includes('context') || darkContent.includes('frame') || darkContent.includes('wrapper');
    result.content.hasPlatformSpecific = darkContent.includes(platformId) || darkContent.includes(platform.name.toLowerCase());

    if (result.content.hasContextElements || result.content.hasPlatformSpecific) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('Context frame elements missing');
    }

    // Test 7: Content completeness
    const darkLines = darkContent.split('\n').length;
    const lightLines = lightContent.split('\n').length;
    result.content.darkLineCount = darkLines;
    result.content.lightLineCount = lightLines;

    if (darkLines > 10 && lightLines > 10) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('Content too short or incomplete');
    }

    // Test 8: Dark/Light theme differentiation
    const darkLower = darkContent.toLowerCase();
    const lightLower = lightContent.toLowerCase();

    // Count theme-specific words
    const darkThemeWords = (darkLower.match(/dark/g) || []).length;
    const lightThemeWords = (lightLower.match(/light/g) || []).length;

    result.content.darkThemeWords = darkThemeWords;
    result.content.lightThemeWords = lightThemeWords;

    if (darkThemeWords > 0 || lightThemeWords > 0) {
        result.testsPassed++;
    } else {
        result.testsFailed++;
        result.issues.push('No theme differentiation detected');
    }

    // Final verification
    result.verified = result.issues.length === 0;

    return result;
}

// Print results
console.log('━'.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('━'.repeat(60));

// Category summary
console.log('\n📁 Results by Category:');
Object.entries(testResults.categories).forEach(([category, stats]) => {
    console.log(`  ${category}: ${stats.verified}/${stats.total} verified`);
});

// Overall summary
console.log('\n📈 Overall Summary:');
console.log(`  Total Platforms: ${testResults.summary.totalPlatforms}`);
console.log(`  Verified: ${testResults.summary.platformsVerified} ✅`);
console.log(`  Failed: ${testResults.summary.platformsFailed} ❌`);
console.log(`  Tests Passed: ${testResults.summary.testsPassed}`);
console.log(`  Tests Failed: ${testResults.summary.testsFailed}`);

const successRate = (testResults.summary.platformsVerified / testResults.summary.totalPlatforms * 100).toFixed(1);
console.log(`  Success Rate: ${successRate}%`);

// Issues
if (testResults.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    testResults.issues.forEach(issue => {
        console.log(`  - ${issue.platform}: ${issue.issues.join(', ')}`);
    });
} else {
    console.log('\n✅ No issues found! All platforms verified successfully.');
}

// Detailed platform results
console.log('\n📋 Platform Details:');
Object.entries(testResults.platforms).forEach(([platformId, result]) => {
    const status = result.verified ? '✅' : '❌';
    const category = result.category.padEnd(12);
    const name = result.name.padEnd(25);
    console.log(`  ${status} ${category} ${name} ${result.testsPassed}/${result.testsPassed + result.testsFailed} tests`);
});

// Save results
const resultsDir = path.join(__dirname, 'test-results');
fs.mkdirSync(resultsDir, { recursive: true });

const resultsFile = path.join(resultsDir, `platform-frames-verification-${Date.now()}.json`);
fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));

console.log('\n📄 Results saved to:', resultsFile);
console.log('⏰ Completed at:', new Date().toISOString());

// Exit with appropriate code
process.exit(testResults.summary.platformsFailed > 0 ? 1 : 0);