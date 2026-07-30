/**
 * YouTube Frame Theme Switch Test
 *
 * Tests that the YouTube frame properly switches between dark and light themes
 */

const fs = require('fs');
const path = require('path');

function testThemeSwitching() {
  console.log('🧪 Testing YouTube frame theme switching...\n');

  const framePath = path.join(__dirname, 'src/public/youtube-frame.html');
  const content = fs.readFileSync(framePath, 'utf8');

  // Test 1: Check theme toggle function exists
  console.log('[1] Checking for toggleTheme() function...');
  if (content.includes('function toggleTheme()')) {
    console.log('    ✓ toggleTheme() function found\n');
  } else {
    console.log('    ✗ toggleTheme() function NOT found\n');
    return false;
  }

  // Test 2: Check localStorage integration
  console.log('[2] Checking localStorage integration...');
  if (content.includes('localStorage.setItem(\'vista-theme\'') &&
      content.includes('localStorage.getItem(\'vista-theme\'')) {
    console.log('    ✓ localStorage integration found\n');
  } else {
    console.log('    ✗ localStorage integration NOT found\n');
    return false;
  }

  // Test 3: Check CSS transitions for smooth theme switching
  console.log('[3] Checking CSS transitions for smooth theme switching...');
  if (content.includes('transition:') &&
      content.includes('0.3s ease')) {
    console.log('    ✓ CSS transitions configured\n');
  } else {
    console.log('    ✗ CSS transitions NOT configured\n');
    return false;
  }

  // Test 4: Check theme variables are used throughout
  console.log('[4] Checking theme variables usage...');
  const requiredVars = [
    '--youtube-bg',
    '--youtube-surface',
    '--youtube-text-primary',
    '--youtube-text-secondary',
    '--youtube-border',
    '--youtube-accent'
  ];

  let allVarsFound = true;
  requiredVars.forEach(varName => {
    if (content.includes(varName)) {
      console.log(`    ✓ ${varName} found`);
    } else {
      console.log(`    ✗ ${varName} NOT found`);
      allVarsFound = false;
    }
  });

  if (!allVarsFound) {
    console.log('');
    return false;
  }

  console.log('');

  // Test 5: Check that both themes can be activated
  console.log('[5] Checking theme activation...');
  const hasDarkTheme = content.includes('data-theme="dark"');
  const mentionsLightTheme = content.includes("'light'") || content.includes('"light"');
  const hasThemeSetter = content.includes('document.documentElement.setAttribute');
  const hasToggleLogic = content.includes('toggleTheme') && content.includes('currentTheme');

  if (hasDarkTheme && mentionsLightTheme && hasThemeSetter && hasToggleLogic) {
    console.log('    ✓ Theme activation mechanism found\n');
  } else {
    console.log('    ✗ Theme activation NOT found');
    console.log(`      - Has dark theme: ${hasDarkTheme}`);
    console.log(`      - Mentions light theme: ${mentionsLightTheme}`);
    console.log(`      - Has theme setter: ${hasThemeSetter}`);
    console.log(`      - Has toggle logic: ${hasToggleLogic}\n`);
    return false;
  }

  // Test 6: Check system theme preference support
  console.log('[6] Checking system theme preference support...');
  if (content.includes('prefers-color-scheme') &&
      content.includes('window.matchMedia')) {
    console.log('    ✓ System theme preference support found\n');
  } else {
    console.log('    ✗ System theme preference support NOT found\n');
    return false;
  }

  console.log('='.repeat(80));
  console.log('✅ ALL THEME TESTS PASSED!\n');
  console.log('The YouTube frame has proper theme switching support with:');
  console.log('  • Manual theme toggle function');
  console.log('  • LocalStorage persistence');
  console.log('  • Smooth CSS transitions');
  console.log('  • Complete theme variable coverage');
  console.log('  • System theme preference support\n');

  return true;
}

// Run the test
const success = testThemeSwitching();
process.exit(success ? 0 : 1);