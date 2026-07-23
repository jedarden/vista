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
const hasStaggerDelay = js.includes('globalIndex * 50') && js.includes('--stagger-delay');
const hasReducedMotionCheck = js.includes('reducedMotion ? 0 :') && js.includes('globalIndex * 50');
test(
  'JS sets --stagger-delay with globalIndex * 50ms pattern',
  hasStaggerDelay && hasReducedMotionCheck,
  'Found: card.style.setProperty(\'--stagger-delay\', animDelay + \'ms\') with animDelay = reducedMotion ? 0 : globalIndex * 50'
);

// Test 2: 150ms crossfade transition in CSS
console.log('\n📋 Test 2: Skeleton→content crossfade (150ms transition)');
const hasCrossfadeVars = css.includes('--skeleton-crossfade-duration: 150ms') &&
  css.includes('--skeleton-crossfade-distance: 4px');
const hasCrossfadeTransition = css.includes('.skeleton-fade-out') &&
  css.includes('transition: opacity var(--skeleton-crossfade-duration)');
test(
  'CSS uses 150ms/4px skeleton crossfade variables',
  hasCrossfadeVars && hasCrossfadeTransition,
  'Found: --skeleton-crossfade-duration: 150ms, --skeleton-crossfade-distance: 4px with CSS var references'
);

// Test 3: Crossfade combines opacity + translateY 4px
console.log('\n📋 Test 3: Crossfade combines opacity change with translateY 4px lift');
const hasOpacityAndTransform = css.includes('.skeleton-fade-out') &&
  css.includes('opacity: 0') &&
  css.includes('transform: translateY(var(--skeleton-crossfade-distance))');
const hasDistanceVar = css.includes('--skeleton-crossfade-distance: 4px');
test(
  'CSS .skeleton-fade-out has opacity: 0 and transform: translateY(var(--skeleton-crossfade-distance)) with 4px value',
  hasOpacityAndTransform && hasDistanceVar,
  'Found opacity: 0, transform: translateY(var(--skeleton-crossfade-distance)), and --skeleton-crossfade-distance: 4px'
);

// Test 4: prefers-reduced-motion disables animations
console.log('\n📋 Test 4: prefers-reduced-motion disables stagger and crossfade');
const hasReducedMotionMediaQuery = css.includes('@media (prefers-reduced-motion: reduce)');
const hasZeroDurationVar = css.match(/@media.*prefers-reduced-motion.*{[^}]*--skeleton-crossfade-duration:\s*0ms/s);
const hasZeroDistanceVar = css.match(/@media.*prefers-reduced-motion.*{[^}]*--skeleton-crossfade-distance:\s*0px/s);
const hasTransitionNone = css.includes('@media (prefers-reduced-motion: reduce)') &&
  css.match(/@media[\s\S]*?transition:\s*none\s*!important/s);
test(
  'prefers-reduced-motion media query disables stagger and crossfade',
  hasReducedMotionMediaQuery && hasZeroDurationVar && hasZeroDistanceVar && hasTransitionNone,
  'Found @media (prefers-reduced-motion: reduce) with CSS vars set to 0ms/0px and transition: none !important'
);

// Test 5: Animation timing is consistent (uses globalIndex, not per-card hardcoding)
console.log('\n📋 Test 5: Animation timing uses consistent pattern');
const usesGlobalIndex = js.includes('globalIndex * 50') && js.includes('globalIndex++');
const usesCssVar = js.includes('card.style.setProperty(\'--stagger-delay\'');
test(
  'Animation timing uses globalIndex pattern and CSS variable',
  usesGlobalIndex && usesCssVar,
  'Found: globalIndex * 50 pattern with --stagger-delay CSS variable'
);

// Test 6: contentFadeIn animation uses 150ms
console.log('\n📋 Test 6: contentFadeIn animation timing');
const hasContentFadeInKeyframe = css.includes('@keyframes contentFadeIn');
const hasSkeletonFadeIn = css.includes('.skeleton-fade-in') &&
  css.includes('animation: contentFadeIn var(--skeleton-crossfade-duration)');
test(
  'CSS contentFadeIn animation uses CSS variable for duration',
  hasContentFadeInKeyframe && hasSkeletonFadeIn,
  'Found: @keyframes contentFadeIn and .skeleton-fade-in with animation: contentFadeIn var(--skeleton-crossfade-duration)'
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
  console.log('  • Cards stagger with 50ms delay between each (via --stagger-delay CSS variable)');
  console.log('  • Skeleton→content crossfade uses 150ms/4px transition (via CSS variables)');
  console.log('  • Crossfade combines opacity change with translateY 4px lift');
  console.log('  • prefers-reduced-motion sets CSS variables to 0ms/0px and disables animations');
  console.log('  • Animation timing is consistent using globalIndex pattern');
  console.log('  • Reduced motion mode is instant (no animation)');
  process.exit(0);
}
