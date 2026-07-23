/**
 * Browser Console Verification Script for Card-Only Rendering
 *
 * Usage:
 * 1. Open test-card-only-rendering.html in browser
 * 2. Paste this script into browser console
 * 3. Results will be displayed and stored in window.cardOnlyTestResults
 */

(function() {
  'use strict';

  console.log('🧪 Starting Card-Only Rendering Verification...\n');

  const results = {
    timestamp: new Date().toISOString(),
    mode: 'card-only',
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      withErrors: 0
    },
    platforms: [],
    consoleErrors: [],
    consoleWarnings: []
  };

  // Capture console errors during test
  const originalError = console.error;
  const originalWarn = console.warn;
  const capturedErrors = [];
  const capturedWarnings = [];

  console.error = function(...args) {
    capturedErrors.push(args.join(' '));
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    capturedWarnings.push(args.join(' '));
    originalWarn.apply(console, args);
  };

  // Verification criteria
  function verifyPlatform(platformId) {
    const card = document.getElementById(`card-${platformId}`);
    const content = document.getElementById(`content-${platformId}`);
    const status = document.getElementById(`status-${platformId}`);
    const header = card ? card.querySelector('.platform-name') : null;

    const result = {
      id: platformId,
      name: header ? header.textContent.trim() : platformId,
      passed: true,
      checks: {
        elementExists: false,
        renderingComplete: false,
        noLayoutBreaks: false,
        platformNameVisible: false,
        hasCardFrame: false
      },
      issues: [],
      warnings: []
    };

    // Check element exists
    if (!card || !content) {
      result.issues.push('Platform element not found');
      return result;
    }
    result.checks.elementExists = true;

    // Check rendering complete
    const hasContent = content.innerHTML.trim().length > 0;
    const notLoading = !content.querySelector('.loading-spinner');
    const hasCardFrameInner = content.querySelector('[class*="card"]');

    result.checks.renderingComplete = hasContent && notLoading;
    result.checks.hasCardFrame = !!hasCardFrameInner;

    if (!result.checks.renderingComplete) {
      if (!hasContent) result.issues.push('No content rendered');
      if (!notLoading) result.issues.push('Still loading');
    }

    // Check layout breaks
    const scrollHeight = content.scrollHeight;
    const clientHeight = content.clientHeight;
    const scrollWidth = content.scrollWidth;
    const clientWidth = content.clientWidth;

    const hasVerticalOverflow = scrollHeight > clientHeight + 10;
    const hasHorizontalOverflow = scrollWidth > clientWidth + 10;

    result.checks.noLayoutBreaks = !hasVerticalOverflow && !hasHorizontalOverflow;

    if (hasVerticalOverflow) {
      result.issues.push(`Vertical overflow: ${scrollHeight}px > ${clientHeight}px`);
    }
    if (hasHorizontalOverflow) {
      result.issues.push(`Horizontal overflow: ${scrollWidth}px > ${clientWidth}px`);
    }

    // Check platform name visible
    result.checks.platformNameVisible = header && header.textContent.trim().length > 0;
    if (!result.checks.platformNameVisible) {
      result.issues.push('Platform name not visible');
    }

    // Check status element
    if (status) {
      if (status.classList.contains('status-failed')) {
        result.issues.push('Status shows failed');
      } else if (status.classList.contains('status-working')) {
        // Good - status shows working
      } else if (status.classList.contains('status-pending')) {
        result.warnings.push('Status still pending');
      }
    } else {
      result.warnings.push('No status element found');
    }

    // Check for card frame styling
    const cardFrame = content.querySelector('.card-only-frame, [class*="card-frame"]');
    if (cardFrame) {
      const computedStyle = window.getComputedStyle(cardFrame);
      const hasBorder = computedStyle.border !== 'none' && computedStyle.borderWidth !== '0px';
      const hasBorderRadius = computedStyle.borderRadius !== '0px';

      if (!hasBorder) {
        result.warnings.push('Card frame missing border');
      }
      if (!hasBorderRadius) {
        result.warnings.push('Card frame missing border radius');
      }
    }

    // Determine overall pass/fail
    result.passed = result.issues.length === 0 &&
                   result.checks.elementExists &&
                   result.checks.renderingComplete &&
                   result.checks.noLayoutBreaks &&
                   result.checks.platformNameVisible;

    return result;
  }

  // Run verification on all platforms
  const platformCards = document.querySelectorAll('[id^="card-"]');
  results.summary.total = platformCards.length;

  console.log(`Found ${results.summary.total} platform cards to verify\n`);

  platformCards.forEach(card => {
    const platformId = card.id.replace('card-', '');
    const platformResult = verifyPlatform(platformId);
    results.platforms.push(platformResult);

    if (platformResult.passed) {
      results.summary.passed++;
      console.log(`✅ ${platformResult.name}`);
    } else {
      results.summary.failed++;
      console.log(`❌ ${platformResult.name}`);
      platformResult.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      if (platformResult.warnings.length > 0) {
        platformResult.warnings.forEach(warning => {
          console.log(`   ⚠️  ${warning}`);
        });
      }
    }
  });

  // Store captured console errors
  results.consoleErrors = capturedErrors;
  results.consoleWarnings = capturedWarnings;
  results.summary.withErrors = capturedErrors.length;

  // Restore console functions
  console.error = originalError;
  console.warn = originalWarn;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total platforms: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Console errors: ${results.consoleErrors.length}`);
  console.log(`⚠️  Console warnings: ${results.consoleWarnings.length}`);

  if (results.consoleErrors.length > 0) {
    console.log('\n🔴 Console Errors:');
    results.consoleErrors.forEach(err => console.log(`  - ${err}`));
  }

  if (results.consoleWarnings.length > 0) {
    console.log('\n🟡 Console Warnings:');
    results.consoleWarnings.forEach(warn => console.log(`  - ${warn}`));
  }

  // Store results globally
  window.cardOnlyTestResults = results;

  console.log('\n💾 Results stored in window.cardOnlyTestResults');
  console.log('📋 Export with: copy(JSON.stringify(window.cardOnlyTestResults, null, 2))');
  console.log('='.repeat(60));

  return results;
})();
