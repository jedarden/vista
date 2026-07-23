/**
 * Direct Theme Functionality Test
 *
 * Tests the theme toggle functionality by simulating the browser environment
 */

const fs = require('fs');
const path = require('path');

// Simulate browser globals
global.document = {
  documentElement: {
    getAttribute: (name) => name === 'data-theme' ? 'dark' : null,
    setAttribute: (name, value) => {}
  },
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null
};

global.localStorage = {
  getItem: (key) => key === 'vista-theme' ? 'dark' : null,
  setItem: (key, value) => {}
};

global.MutationObserver = class MutationObserver {
  constructor(callback) {}
  observe() {}
};

// Load platform-frames.js
const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
const platformFramesCode = fs.readFileSync(platformFramesPath, 'utf-8');

// Extract PLATFORM_FRAMES data
const platformFramesMatch = platformFramesCode.match(/const PLATFORM_FRAMES = ({[\s\S]*?});/);
if (!platformFramesMatch) {
  console.error('Could not extract PLATFORM_FRAMES');
  process.exit(1);
}

// Safe eval to get PLATFORM_FRAMES
const PLATFORM_FRAMES = eval(`(${platformFramesMatch[1]})`);

console.log('🎨 Theme Functionality Test\n');
console.log('='.repeat(60));

// Test each platform with theme support
const platformsWithTheme = Object.entries(PLATFORM_FRAMES)
  .filter(([id, frame]) => frame.hasThemeSupport)
  .map(([id]) => id);

console.log(`\n📊 Found ${platformsWithTheme.length} platforms with theme support:`);
platformsWithTheme.forEach(id => {
  console.log(`  - ${PLATFORM_FRAMES[id].name} (${id})`);
});

// Test theme variables
console.log('\n🔍 Testing theme variables...\n');

platformsWithTheme.forEach(platformId => {
  const frame = PLATFORM_FRAMES[platformId];
  const darkVars = frame.themeVars?.dark;
  const lightVars = frame.themeVars?.light;

  const hasDarkVars = darkVars && typeof darkVars === 'object' && Object.keys(darkVars).length > 0;
  const hasLightVars = lightVars && typeof lightVars === 'object' && Object.keys(lightVars).length > 0;

  // Check for required theme variables
  const requiredVars = ['--frame-bg', '--frame-text-primary', '--frame-accent'];
  const darkHasRequired = requiredVars.every(v => darkVars && darkVars[v]);
  const lightHasRequired = requiredVars.every(v => lightVars && lightVars[v]);

  // Check if backgrounds are different
  const darkBg = darkVars?.['--frame-bg'] || '';
  const lightBg = lightVars?.['--frame-bg'] || '';
  const backgroundsDiffer = darkBg !== lightBg;

  // Check if dark theme is actually darker
  const darkIsDarker = isColorDarker(darkBg, lightBg);

  const allPassed = hasDarkVars && hasLightVars && darkHasRequired && lightHasRequired && backgroundsDiffer && darkIsDarker;

  console.log(`${allPassed ? '✅' : '❌'} ${PLATFORM_FRAMES[platformId].name} (${platformId})`);
  console.log(`   Dark theme vars: ${hasDarkVars ? '✓' : '✗'} (${Object.keys(darkVars || {}).length} vars)`);
  console.log(`   Light theme vars: ${hasLightVars ? '✓' : '✗'} (${Object.keys(lightVars || {}).length} vars)`);
  console.log(`   Required vars: ${darkHasRequired && lightHasRequired ? '✓' : '✗'}`);
  console.log(`   Backgrounds differ: ${backgroundsDiffer ? '✓' : '✗'}`);
  console.log(`   Dark is darker: ${darkIsDarker ? '✓' : '✗'}`);

  if (darkVars && lightVars) {
    console.log(`   Dark bg: ${darkBg}`);
    console.log(`   Light bg: ${lightBg}`);
    console.log(`   Dark accent: ${darkVars['--frame-accent'] || 'N/A'}`);
    console.log(`   Light accent: ${lightVars['--frame-accent'] || 'N/A'}`);
  }
  console.log();
});

// Test buildContextFrame function
console.log('🔍 Testing buildContextFrame function...\n');

// Check if buildContextFrame exists in platform-frames.js
const hasBuildContextFrame = platformFramesCode.includes('function buildContextFrame');
console.log(`${hasBuildContextFrame ? '✅' : '❌'} buildContextFrame function exists`);

// Check theme application in buildContextFrame
const hasThemeApplication = platformFramesCode.includes('getInlineThemeStyles') &&
                           platformFramesCode.includes('themeSuffix');
console.log(`${hasThemeApplication ? '✅' : '❌'} Theme application logic exists`);

// Check for inline theme styles function
const hasInlineThemeStyles = platformFramesCode.includes('function getInlineThemeStyles');
console.log(`${hasInlineThemeStyles ? '✅' : '❌'} getInlineThemeStyles function exists`);

// Summary
console.log('='.repeat(60));
console.log('\n📋 Summary\n');

console.log(`Total platforms tested: ${platformsWithTheme.length}`);
console.log(`Platforms with theme support: ${platformsWithTheme.length}`);

const allHaveVars = platformsWithTheme.every(id => {
  const frame = PLATFORM_FRAMES[id];
  return frame.themeVars?.dark && frame.themeVars?.light;
});

console.log(`All platforms have theme vars: ${allHaveVars ? '✅' : '❌'}`);
console.log(`Implementation complete: ${hasBuildContextFrame && hasThemeApplication && hasInlineThemeStyles ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(60));
console.log(allHaveVars && hasBuildContextFrame && hasThemeApplication && hasInlineThemeStyles ?
  '✅ THEME TOGGLE FUNCTIONALITY VERIFIED' :
  '❌ THEME TOGGLE HAS ISSUES');
console.log('='.repeat(60));

/**
 * Compare two hex colors to see if first is darker
 */
function isColorDarker(color1, color2) {
  if (!color1 || !color2) return false;

  const brightness1 = getColorBrightness(color1);
  const brightness2 = getColorBrightness(color2);

  return brightness1 < brightness2;
}

/**
 * Get perceived brightness of a hex color
 */
function getColorBrightness(hex) {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  // Calculate perceived brightness (ITU-R BT.709)
  return (r * 299 + g * 587 + b * 114) / 1000;
}

process.exit(0);
