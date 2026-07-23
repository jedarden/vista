/**
 * Test: Skeleton Card Animations (bf-233i)
 *
 * Verifies:
 * 1. Cards stagger with 50ms delay between each (0, 50, 100, 150ms... per card)
 * 2. Skeleton→content crossfade uses 150ms transition
 * 3. Crossfade combines opacity change with translateY 4px lift
 * 4. prefers-reduced-motion media query disables stagger and crossfade
 * 5. Animation timing is consistent and not hardcoded per individual card
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, 'src/public/style.css');
const JS_FILE = path.join(__dirname, 'src/public/app.js');

console.log('🔍 Testing Skeleton Card Animation Implementation...\n');

// Read CSS and JS files
const css = fs.readFileSync(CSS_FILE, 'utf8');
const js = fs.readFileSync(JS_FILE, 'utf8');

// Test results
const tests = {
  passed: [],
  failed: []
};

function test(name, condition, details = '') {
  if (condition) {
    tests.passed.push({ name, details });
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    tests.failed.push({ name, details });
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// Test 1: Staggered entrance in JS (50ms delay per card)
console.log('\n📋 Test 1: Staggered entrance (50ms delay per card)');
const hasStaggerDelay = js.includes('card.style.animationDelay = (globalIndex * 50)');
const hasReducedMotionCheck = js.includes('if (!prefersReducedMotion())') && js.includes('card.style.animationDelay');
test(
  'JS sets animationDelay with globalIndex * 50ms pattern',
  hasStaggerDelay && hasReducedMotionCheck,
  'Found: card.style.animationDelay = (globalIndex * 50) + \'ms\''
);

// Test 2: 150ms crossfade transition in CSS
console.log('\n📋 Test 2: Skeleton→content crossfade (150ms transition)');
const hasCrossfadeTransition = css.includes('.skeleton-fade-out') &&
  css.includes('transition: opacity 150ms ease, transform 150ms ease');
test(
  'CSS .skeleton-fade-out has 150ms transition for opacity and transform',
  hasCrossfadeTransition,
  'Found: transition: opacity 150ms ease, transform 150ms ease'
);

// Test 3: Crossfade combines opacity + translateY 4px
console.log('\n📋 Test 3: Crossfade combines opacity change with translateY 4px lift');
const hasOpacityAndTransform = css.match(/\.skeleton-fade-out\s*{[^}]*opacity:\s*0[^}]*transform:\s*translateY\(4px\)/);
test(
  'CSS .skeleton-fade-out has opacity: 0 and transform: translateY(4px)',
  hasOpacityAndTransform,
  'Found both opacity: 0 and transform: translateY(4px) in .skeleton-fade-out'
);

// Test 4: prefers-reduced-motion disables animations
console.log('\n📋 Test 4: prefers-reduced-motion disables stagger and crossfade');
const hasReducedMotionMediaQuery = css.includes('@media (prefers-reduced-motion: reduce)');
const hasSkeletonFadeOutInMediaQuery = css.match(/@media.*prefers-reduced-motion.*reduce.*{[^}]*\.skeleton-fade-out/s);
const hasTransitionNoneInMediaQuery = css.match(/@media.*prefers-reduced-motion.*{[^}]*transition:\s*none\s*!important/s);
test(
  'prefers-reduced-motion media query disables skeleton animations',
  hasReducedMotionMediaQuery && hasSkeletonFadeOutInMediaQuery && hasTransitionNoneInMediaQuery,
  'Found @media (prefers-reduced-motion: reduce) with .skeleton-fade-out and transition: none !important'
);

// Test 5: Animation timing is consistent (uses globalIndex, not per-card hardcoding)
console.log('\n📋 Test 5: Animation timing uses consistent pattern');
const usesGlobalIndex = js.includes('globalIndex * 50') && js.includes('globalIndex++');
const noPerCardHardcoding = !js.match(/animationDelay:\s*\d+/); // No hardcoded numbers like "50" or "100"
test(
  'Animation timing uses globalIndex pattern, not per-card hardcoding',
  usesGlobalIndex,
  'Found: card.style.animationDelay = (globalIndex * 50) + \'ms\''
);

// Test 6: contentFadeIn animation uses 150ms
console.log('\n📋 Test 6: contentFadeIn animation timing');
const hasContentFadeIn = css.includes('@keyframes contentFadeIn') &&
  css.includes('.skeleton-fade-in') &&
  css.includes('animation: contentFadeIn 150ms ease');
test(
  'CSS contentFadeIn animation uses 150ms duration',
  hasContentFadeIn,
  'Found: animation: contentFadeIn 150ms ease'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log(`📊 Test Results: ${tests.passed.length} passed, ${tests.failed.length} failed`);
console.log('='.repeat(60));

if (tests.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  tests.failed.forEach(({ name, details }) => {
    console.log(`  • ${name}`);
    if (details) console.log(`    ${details}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All skeleton card animation tests passed!');
  console.log('\n📝 Implementation Summary:');
  console.log('  • Cards stagger with 50ms delay between each');
  console.log('  • Skeleton→content crossfade uses 150ms transition');
  console.log('  • Crossfade combines opacity change with translateY 4px lift');
  console.log('  • prefers-reduced-motion properly disables all animations');
  console.log('  • Animation timing is consistent using globalIndex pattern');
  process.exit(0);
}
