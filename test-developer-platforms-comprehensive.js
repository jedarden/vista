#!/usr/bin/env node

/**
 * Comprehensive test for developer platform context frames
 * Tests GitHub (README/Issue), GitLab (MR/Issue), and Stack Overflow frames
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testFrameExists(framePath) {
  return fs.existsSync(framePath);
}

function testThemeSupport(html) {
  // Check for data-theme attribute switching
  const hasDataTheme = html.includes('data-theme');
  const hasThemeToggle = html.includes('toggleTheme') || html.includes('theme-toggle');
  const hasDarkThemeCSS = html.includes('[data-theme=\'light\']') || html.includes('[data-theme="light"]');

  return {
    hasDataTheme,
    hasThemeToggle,
    hasDarkThemeCSS,
    passed: hasDataTheme && hasThemeToggle && hasDarkThemeCSS
  };
}

function testCodeFormatting(html, frameType, frameSubType) {
  // GitLab MR uses diff blocks instead of regular code blocks
  if (frameType === 'gitlab' && frameSubType === 'mr') {
    const hasDiffBlock = html.includes('gl-diff-block') || html.includes('diff-block');
    const hasSyntaxHighlighting = html.includes('gl-code-keyword') || html.includes('gl-code-string') ||
                                  html.includes('gl-diff-add') || html.includes('gl-diff-remove');

    return {
      hasCodeBlock: hasDiffBlock,
      hasSyntaxHighlighting,
      passed: hasDiffBlock && hasSyntaxHighlighting
    };
  }

  const codeSelectors = {
    'github': '.gh-code-block',
    'gitlab': '.gl-code-block',
    'stackoverflow': '.so-code-block'
  };

  const syntaxSelectors = {
    'github': '.gh-code-keyword',
    'gitlab': '.gl-code-keyword',
    'stackoverflow': '.keyword'
  };

  const codeSelector = codeSelectors[frameType];
  const syntaxSelector = syntaxSelectors[frameType];

  const hasCodeBlock = html.includes(codeSelector) || html.includes('code-block');
  const hasSyntaxHighlighting = html.includes(syntaxSelector) ||
                                (html.includes('.keyword') && html.includes('.string')) ||
                                (html.includes('gh-code-keyword') && html.includes('gh-code-string')) ||
                                (html.includes('gl-code-keyword') && html.includes('gl-code-string'));

  return {
    hasCodeBlock,
    hasSyntaxHighlighting,
    passed: hasCodeBlock && hasSyntaxHighlighting
  };
}

function testLinkCard(html, frameType) {
  const linkCardSelectors = {
    'github': '.gh-link-card',
    'gitlab': '.gl-link-card',
    'stackoverflow': '.so-link-card'
  };

  const selector = linkCardSelectors[frameType];

  const hasLinkCard = html.includes(selector) || html.includes('link-card');
  const hasLinkCardIcon = html.includes('-link-card-icon') || html.includes('favicon');
  const hasLinkCardTitle = html.includes('-link-card-title');
  const hasLinkCardDesc = html.includes('-link-card-desc') || html.includes('-link-card-description');

  return {
    hasLinkCard,
    hasLinkCardIcon,
    hasLinkCardTitle,
    hasLinkCardDesc,
    passed: hasLinkCard && hasLinkCardIcon && hasLinkCardTitle && hasLinkCardDesc
  };
}

function testPlatformSpecificElements(html, frameType, frameSubType) {
  const tests = {
    'github-readme': {
      elements: ['gh-readme-header', 'gh-readme-content', 'gh-readme-title'],
      requiredCount: 2
    },
    'github-issue': {
      elements: ['gh-issue-header', 'gh-comments-list', 'gh-comment'],
      requiredCount: 2
    },
    'gitlab-mr': {
      elements: ['gl-mr-header', 'gl-discussion-list', 'gl-comment'],
      requiredCount: 2
    },
    'gitlab-issue': {
      elements: ['gl-issue-header', 'gl-discussion-list', 'gl-comment'],
      requiredCount: 2
    },
    'stackoverflow': {
      elements: ['so-question-header', 'so-answers-list', 'so-answer'],
      requiredCount: 2
    }
  };

  const testConfig = tests[`${frameType}-${frameSubType}`] || tests[`${frameType}`];

  let foundCount = 0;
  for (const element of testConfig.elements) {
    if (html.includes(element)) {
      foundCount++;
    }
  }

  return {
    elementsFound: foundCount,
    requiredElements: testConfig.requiredCount,
    passed: foundCount >= testConfig.requiredCount
  };
}

function testFrame(filePath, frameType, frameSubType) {
  log(`\n▶ Testing  ${frameType.toUpperCase()} ${frameSubType.toUpperCase()} frame`, 'cyan');

  if (!testFrameExists(filePath)) {
    log(`  ❌ File not found: ${filePath}`, 'red');
    return false;
  }

  const html = fs.readFileSync(filePath, 'utf8');

  // Test theme support
  const themeResults = testThemeSupport(html);
  log(`  ${themeResults.passed ? '✅' : '❌'} Theme switching support`,
      themeResults.passed ? 'green' : 'red');

  // Test code formatting
  const codeResults = testCodeFormatting(html, frameType, frameSubType);
  log(`  ${codeResults.passed ? '✅' : '❌'} Code blocks with syntax highlighting`,
      codeResults.passed ? 'green' : 'red');

  // Test link cards
  const linkCardResults = testLinkCard(html, frameType);
  log(`  ${linkCardResults.passed ? '✅' : '❌'} Embedded link cards`,
      linkCardResults.passed ? 'green' : 'red');

  // Test platform-specific elements
  const platformResults = testPlatformSpecificElements(html, frameType, frameSubType);
  log(`  ${platformResults.passed ? '✅' : '❌'} Platform-specific elements (${platformResults.elementsFound}/${platformResults.requiredElements})`,
      platformResults.passed ? 'green' : 'red');

  const allPassed = themeResults.passed && codeResults.passed && linkCardResults.passed && platformResults.passed;

  if (allPassed) {
    log(`  ✅ ${frameType.toUpperCase()} ${frameSubType.toUpperCase()} frame: PASSED`, 'green');
  } else {
    log(`  ❌ ${frameType.toUpperCase()} ${frameSubType.toUpperCase()} frame: FAILED`, 'red');
  }

  return allPassed;
}

function main() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Developer Platform Context Frames - Comprehensive Test       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');

  const frames = [
    { path: 'src/public/github-readme-frame.html', type: 'github', subType: 'readme' },
    { path: 'src/public/github-issue-frame.html', type: 'github', subType: 'issue' },
    { path: 'src/public/gitlab-mr-frame.html', type: 'gitlab', subType: 'mr' },
    { path: 'src/public/gitlab-issue-frame.html', type: 'gitlab', subType: 'issue' },
    { path: 'stackoverflow-frame.html', type: 'stackoverflow', subType: 'qa' }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const frame of frames) {
    const passed = testFrame(frame.path, frame.type, frame.subType);
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                           Test Summary                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');

  log(`\nTotal frames tested: ${frames.length}`, 'blue');
  log(`Passed: ${passedCount}`, 'green');
  log(`Failed: ${failedCount}`, 'red');
  log(`Success rate: ${Math.round((passedCount / frames.length) * 100)}%`,
      passedCount === frames.length ? 'green' : 'yellow');

  if (passedCount === frames.length) {
    log('\n✅ ALL TESTS PASSED - All developer platform frames are properly implemented!', 'green');
    return 0;
  } else {
    log('\n❌ SOME TESTS FAILED - Please review the failed frames above', 'red');
    return 1;
  }
}

if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { testFrame, testThemeSupport, testCodeFormatting, testLinkCard, testPlatformSpecificElements };