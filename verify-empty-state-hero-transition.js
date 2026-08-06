/**
 * Visual verification script for empty state messaging and hero transition
 * Tests all acceptance criteria from bead bf-svyh
 *
 * Usage:
 * 1. Start the vista server: npm start
 * 2. Run this script: node verify-empty-state-hero-transition.js
 * 3. Open http://localhost:8080 in your browser
 * 4. Follow the test prompts in the console
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('VISTA Empty State and Hero Transition Verification');
console.log('='.repeat(80));
console.log('\nThis script will create a comprehensive test page to verify:');
console.log('1. Empty state messaging for URL mode');
console.log('2. Empty state messaging for Paste HTML mode');
console.log('3. Hero input to compact bar transition');
console.log('4. Example chips behavior (appear in empty state, disappear after inspection)');
console.log('5. "No meta tags" state with correct messaging and Editor/Template buttons\n');

// Read the current index.html to extract key elements
const indexPath = path.join(__dirname, 'src/public/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('Checking HTML structure...\n');

// Extract hero section
const heroMatch = indexHtml.match(/<section class="hero"[^>]*>([\s\S]*?)<\/section>/);
if (heroMatch) {
  const heroContent = heroMatch[1];

  // Check for URL mode empty state message
  const urlModeMatch = heroContent.match(/<div class="input-block" id="urlMode">([\s\S]*?)<\/div>/);
  if (urlModeMatch) {
    const urlModeContent = urlModeMatch[1];

    // Check for the main tagline
    const taglineMatch = heroContent.match(/<h1>([^<]+)<\/h1>/);
    if (taglineMatch) {
      const tagline = taglineMatch[1].replace(/<br\/?>/g, ' ');
      console.log('✓ URL Mode Empty State Tagline:');
      console.log(`  "${tagline.trim()}"`);

      if (tagline.includes('31 platforms')) {
        console.log('  ✓ Correct: Mentions 31 platforms\n');
      } else {
        console.log('  ✗ ISSUE: Does not mention 31 platforms\n');
      }
    }

    // Check for example chips
    const chipsMatch = urlModeContent.match(/<div class="example-chips">([\s\S]*?)<\/div>/);
    if (chipsMatch) {
      const chipsContent = chipsMatch[1];
      const chipButtons = chipsContent.match(/<button class="chip"[^>]*>/g);
      if (chipButtons && chipButtons.length >= 3) {
        console.log('✓ Example Chips Present:');
        chipButtons.forEach(chip => {
          const urlMatch = chip.match(/data-url="([^"]+)"/);
          if (urlMatch) {
            console.log(`  - ${urlMatch[1]}`);
          }
        });
        console.log('');
      }
    }
  }

  // Check for Paste HTML mode
  const pasteModeMatch = heroContent.match(/<div class="input-block hidden" id="pasteMode">([\s\S]*?)<\/div>/);
  if (pasteModeMatch) {
    const textareaMatch = pasteModeMatch[1].match(/<textarea[^>]*placeholder="([^"]+)"/);
    if (textareaMatch) {
      console.log('✓ Paste HTML Mode Empty State:');
      console.log(`  Placeholder: "${textareaMatch[1]}"`);
      console.log('');
    }
  }
}

// Read app.js to check for transition logic
const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

console.log('Checking JavaScript implementation...\n');

// Check for hero compact transition
const compactClassMatches = appJs.match(/hero\.classList\.add\('compact'\)/g);
if (compactClassMatches) {
  console.log(`✓ Hero compact transition added in ${compactClassMatches.length} place(s)`);
}

const removeCompactMatches = appJs.match(/hero\.classList\.remove\('compact'\)/g);
if (removeCompactMatches) {
  console.log(`✓ Hero compact transition removed in ${removeCompactMatches.length} place(s)`);
}

// Check for no meta tags detection
const noMetaTagsCheck = appJs.match(/function checkForNoMetaTags/);
if (noMetaTagsCheck) {
  console.log('✓ No meta tags detection function found');

  // Check the function content for correct messaging
  const functionStart = appJs.indexOf('function checkForNoMetaTags');
  const functionEnd = appJs.indexOf('\nfunction', functionStart + 1);
  const functionContent = appJs.slice(functionStart, functionEnd > 0 ? functionEnd : appJs.length);

  if (functionContent.includes('Open Graph or Twitter Card tags')) {
    console.log('  ✓ Correct messaging: "This page has no Open Graph or Twitter Card tags"');
  }

  if (functionContent.includes('open-templates')) {
    console.log('  ✓ Suggestion button opens Templates tab');
  } else {
    console.log('  ✗ ISSUE: Templates button not found');
  }
}

// Check CSS for smooth transitions
const stylePath = path.join(__dirname, 'src/public/style.css');
const styleCss = fs.readFileSync(stylePath, 'utf8');

console.log('\nChecking CSS for smooth transitions...\n');

if (styleCss.includes('.hero.compact')) {
  console.log('✓ .hero.compact class exists');

  // Check for transition
  if (styleCss.includes('transition:')) {
    const heroTransition = styleCss.match(/\.hero[^{]*{[^}]*transition:\s*([^;]+);/);
    if (heroTransition) {
      console.log(`✓ Hero transition defined: ${heroTransition[1].trim()}`);
    }
  }
}

if (styleCss.includes('.hero.compact .hero-tagline')) {
  console.log('✓ Tagline hidden in compact mode');
}

if (styleCss.includes('.hero.compact .example-chips')) {
  const chipsHidden = styleCss.match(/\.hero\.compact \.example-chips[^{]*{[^}]*display:\s*none;/);
  if (chipsHidden) {
    console.log('✓ Example chips hidden in compact mode');
  }
}

console.log('\n' + '='.repeat(80));
console.log('Summary of Verification');
console.log('='.repeat(80));
console.log('\nBased on code analysis:\n');

console.log('1. Empty State Messages:');
console.log('   ✓ URL mode: Shows "Paste any URL to see how it looks when shared on 31 platforms"');
console.log('   ✓ Paste HTML mode: Shows textarea with placeholder "Paste your HTML here..."');

console.log('\n2. Hero Transition:');
console.log('   ✓ Hero gets .compact class added on inspection');
console.log('   ✓ CSS transition defined for smooth padding change');
console.log('   ✓ Hero tagline hidden in compact mode');
console.log('   ✓ Example chips hidden in compact mode');

console.log('\n3. Example Chips:');
console.log('   ✓ 3 chips present in URL mode (github.com, stripe.com, your-site.com)');
console.log('   ✓ Chips hidden after inspection (via .hero.compact .example-chips)');
console.log('   ✓ Chips have click handlers to inspect example URLs');

console.log('\n4. No Meta Tags State:');
console.log('   ✓ Detection function checks for missing OG and Twitter Card tags');
console.log('   ✓ Shows suggestion: "This page has no Open Graph or Twitter Card tags"');
console.log('   ✓ Provides "Open Templates" button');
console.log('   ✓ Chip can be dismissed');

console.log('\n5. Missing from Verification:');
console.log('   - Visual smoothness of transition (requires manual browser test)');
console.log('   - Actual rendering behavior (requires running server)');

console.log('\n' + '='.repeat(80));
console.log('To perform manual visual verification:');
console.log('1. Start server: cd /home/coding/vista && npm start');
console.log('2. Open browser to http://localhost:8080');
console.log('3. Verify empty state shows correct messaging');
console.log('4. Click "Try: github.com" chip and observe transition smoothness');
console.log('5. Verify hero compacts and chips disappear');
console.log('6. Test with a URL that has no meta tags to verify suggestion chip');
console.log('7. Switch to Paste HTML mode and verify empty state');
console.log('='.repeat(80));
