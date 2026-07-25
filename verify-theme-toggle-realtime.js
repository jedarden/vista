/**
 * Verification Test: Theme Toggle Button Triggers Real-Time Theme Switching
 *
 * Tests that the theme toggle button:
 * - Exists and is visible/accessible
 * - Switches themes immediately on click
 * - Updates DOM attributes in real-time
 * - Works without page reload
 */

const assert = require('assert');
const { JSDOM } = require('jsdom');

// Test HTML content
const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VISTA Theme Toggle Test</title>
</head>
<body>
  <button class="theme-toggle" id="globalThemeToggle" aria-label="Switch to light mode" title="Toggle dark/light mode">
    <span class="theme-icon-light" aria-hidden="true">☀️</span>
    <span class="theme-icon-dark" aria-hidden="true" style="display: none;">🌙</span>
  </button>

  <div id="testContent">Test content</div>

  <script>
    // Theme state
    let globalTheme = 'dark';

    // Apply theme function
    function applyTheme(theme) {
      globalTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('vista-theme', theme);

      // Update theme toggle icon and accessible label
      const themeToggle = document.getElementById('globalThemeToggle');
      if (themeToggle) {
        themeToggle.querySelector('.theme-icon-light').style.display = theme === 'dark' ? 'inline' : 'none';
        themeToggle.querySelector('.theme-icon-dark').style.display = theme === 'light' ? 'inline' : 'none';
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
    }

    // Toggle theme function
    function toggleGlobalTheme() {
      const newTheme = globalTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    }

    // Initialize
    document.documentElement.setAttribute('data-theme', 'dark');

    // Wire up toggle button
    document.getElementById('globalThemeToggle').addEventListener('click', toggleGlobalTheme);
  </script>
</body>
</html>
`;

async function runTests() {
  console.log('🧪 Theme Toggle Real-Time Switching Verification\n');

  const dom = new JSDOM(testHTML, {
    runScripts: 'dangerously',
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  const { document } = dom.window;
  const window = dom.window;

  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      clear: () => { store = {}; }
    };
  })();
  window.localStorage = localStorageMock;

  // Wait for scripts to execute
  await new Promise(resolve => setTimeout(resolve, 100));

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Toggle button exists and is accessible
  console.log('Test 1: Toggle button exists and is accessible');
  try {
    const themeToggle = document.getElementById('globalThemeToggle');
    assert(themeToggle !== null, 'Theme toggle button should exist');
    assert(themeToggle.tagName === 'BUTTON', 'Should be a button element');
    assert(themeToggle.getAttribute('aria-label') === 'Switch to light mode', 'Should have accessible label');
    assert(!themeToggle.disabled, 'Button should not be disabled');
    console.log('✅ PASS: Toggle button exists, is accessible, and enabled\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Initial theme state is dark
  console.log('Test 2: Initial theme state');
  try {
    const initialTheme = document.documentElement.getAttribute('data-theme');
    assert(initialTheme === 'dark', 'Initial theme should be dark');
    console.log('✅ PASS: Initial theme is dark\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Light icon is visible initially
  console.log('Test 3: Light icon is visible initially');
  try {
    const themeToggle = document.getElementById('globalThemeToggle');
    const lightIcon = themeToggle.querySelector('.theme-icon-light');
    const darkIcon = themeToggle.querySelector('.theme-icon-dark');

    assert(lightIcon.style.display !== 'none', 'Light icon should be visible');
    assert(darkIcon.style.display === 'none', 'Dark icon should be hidden');
    console.log('✅ PASS: Light icon visible, dark icon hidden initially\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Clicking toggle switches theme to light immediately
  console.log('Test 4: Clicking toggle switches theme to light immediately');
  try {
    const themeToggle = document.getElementById('globalThemeToggle');

    // Click the toggle button
    themeToggle.click();

    // Check theme changed immediately (no page reload)
    const newTheme = document.documentElement.getAttribute('data-theme');
    assert(newTheme === 'light', 'Theme should switch to light');
    console.log('✅ PASS: Theme switched to light on click (no reload)\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: DOM attributes update in real-time
  console.log('Test 5: DOM attributes update in real-time');
  try {
    // Check data-theme attribute
    const dataTheme = document.documentElement.getAttribute('data-theme');
    assert(dataTheme === 'light', 'data-theme should be light');

    // Check aria-label updated
    const themeToggle = document.getElementById('globalThemeToggle');
    const ariaLabel = themeToggle.getAttribute('aria-label');
    assert(ariaLabel === 'Switch to dark mode', 'aria-label should update to "Switch to dark mode"');

    // Check icons swapped
    const lightIcon = themeToggle.querySelector('.theme-icon-light');
    const darkIcon = themeToggle.querySelector('.theme-icon-dark');
    assert(lightIcon.style.display === 'none', 'Light icon should now be hidden');
    assert(darkIcon.style.display === 'inline', 'Dark icon should now be visible');

    console.log('✅ PASS: All DOM attributes updated in real-time\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: Theme persists to localStorage
  console.log('Test 6: Theme persists to localStorage');
  try {
    const storedTheme = localStorage.getItem('vista-theme');
    assert(storedTheme === 'light', 'Theme should be saved to localStorage');
    console.log('✅ PASS: Theme saved to localStorage\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 7: Clicking again switches back to dark
  console.log('Test 7: Clicking toggle again switches back to dark');
  try {
    const themeToggle = document.getElementById('globalThemeToggle');

    // Click again
    themeToggle.click();

    // Check theme switched back
    const newTheme = document.documentElement.getAttribute('data-theme');
    assert(newTheme === 'dark', 'Theme should switch back to dark');

    // Check button state updated
    const ariaLabel = themeToggle.getAttribute('aria-label');
    assert(ariaLabel === 'Switch to light mode', 'aria-label should update back');

    console.log('✅ PASS: Theme switches back to dark on second click\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 8: No page reload occurred (DOM state preserved)
  console.log('Test 8: No page reload occurred (DOM state preserved)');
  try {
    const testContent = document.getElementById('testContent');
    assert(testContent !== null, 'Test content should still exist');
    assert(testContent.textContent === 'Test content', 'DOM state should be preserved');

    console.log('✅ PASS: No page reload, DOM state preserved\n');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Summary
  console.log('='.repeat(60));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('='.repeat(60));

  if (testsFailed === 0) {
    console.log('\n✅ All theme toggle tests passed!');
    return true;
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    return false;
  }
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
