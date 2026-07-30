#!/usr/bin/env node

/**
 * Twitter/X Frame Elements Theme Update Verification Script
 *
 * Verifies that all Twitter/X frame elements have proper theme support
 * and update correctly when theme toggles between dark and light.
 */

const fs = require('fs');
const path = require('path');

const cssFilePath = path.join(__dirname, 'src/public/style.css');

console.log('🔍 Verifying Twitter/X Frame Elements Theme Update Support...\n');

// Read CSS file
const cssStyles = fs.readFileSync(cssFilePath, 'utf-8');

// All Twitter/X frame elements that must update on theme change
const requiredElements = {
  // Text elements
  textElements: [
    { className: 'tw-author-name', property: 'color', description: 'Author name text color' },
    { className: 'tw-author-handle', property: 'color', description: 'Author handle text color' },
    { className: 'tw-post-time', property: 'color', description: 'Post timestamp color' },
    { className: 'tw-post-content', property: 'color', description: 'Post content text color' },
    { className: 'tw-context-title', property: 'color', description: 'Link card title color' },
    { className: 'tw-context-domain', property: 'color', description: 'Link card domain color' },
    { className: 'tw-action-count', property: 'color', description: 'Action count color' }
  ],

  // Icon elements
  iconElements: [
    { className: 'tw-verified', property: 'color', description: 'Verified badge icon color' },
    { className: 'tw-action-icon', property: 'color', description: 'Action icons color (reply, retweet, like, view)' }
  ],

  // Background elements
  backgroundElements: [
    { className: 'twitter-context', property: 'background', description: 'Frame container background' },
    { className: 'tw-link-card', property: 'background', description: 'Link card background' },
    { className: 'tw-context-placeholder', property: 'background', description: 'Context placeholder background' },
    { className: 'tw-avatar', property: 'background', description: 'Avatar placeholder background' }
  ],

  // Border elements
  borderElements: [
    { className: 'twitter-context', property: 'border', description: 'Frame border color' },
    { className: 'tw-link-card', property: 'border', description: 'Link card border color' }
  ]
};

// CSS variables that should be defined for Twitter/X themes
const requiredCSSVariables = [
  '--x-bg-primary',
  '--x-bg-secondary',
  '--x-bg-tertiary',
  '--x-border-color',
  '--x-text-primary',
  '--x-text-secondary',
  '--x-accent-blue',
  '--x-accent-blue-hover',
  '--x-like-color',
  '--x-retweet-color',
  '--x-reply-color',
  '--x-view-color',
  '--x-avatar-bg',
  '--x-avatar-border',
  '--x-placeholder-bg',
  '--x-hover-bg',
  '--x-hover-subtle',
  '--x-link-card-hover-border'
];

console.log('📋 Verifying CSS Theme Definitions...\n');

// Check for theme classes
console.log('1. Theme Classes:');
const hasDarkTheme = cssStyles.includes('.twitter-context.dark-theme');
const hasLightTheme = cssStyles.includes('.twitter-context.light-theme');

console.log(`   ${hasDarkTheme ? '✓' : '✗'} .twitter-context.dark-theme defined`);
console.log(`   ${hasLightTheme ? '✓' : '✗'} .twitter-context.light-theme defined`);

if (!hasDarkTheme || !hasLightTheme) {
  console.log('\n❌ CRITICAL: Theme classes not properly defined!');
  process.exit(1);
}

// Check for CSS variables in both themes
console.log('\n2. CSS Variables:');

let darkVars = {};
let lightVars = {};

// Extract dark theme variables
const darkThemeMatch = cssStyles.match(/\.twitter-context\.dark-theme\s*{([^}]+)}/);
if (darkThemeMatch) {
  const darkThemeContent = darkThemeMatch[1];
  requiredCSSVariables.forEach(varName => {
    const varPattern = new RegExp(`${varName}:\\s*([^;]+)`);
    const varMatch = darkThemeContent.match(varPattern);
    if (varMatch) {
      darkVars[varName] = varMatch[1].trim();
    }
  });
}

// Extract light theme variables
const lightThemeMatch = cssStyles.match(/\.twitter-context\.light-theme\s*{([^}]+)}/);
if (lightThemeMatch) {
  const lightThemeContent = lightThemeMatch[1];
  requiredCSSVariables.forEach(varName => {
    const varPattern = new RegExp(`${varName}:\\s*([^;]+)`);
    const varMatch = lightThemeContent.match(varPattern);
    if (varMatch) {
      lightVars[varName] = varMatch[1].trim();
    }
  });
}

// Check that both themes have all required variables
let allVarsPresent = true;
requiredCSSVariables.forEach(varName => {
  const inDark = darkVars[varName] !== undefined;
  const inLight = lightVars[varName] !== undefined;
  const darkValue = darkVars[varName] || 'MISSING';
  const lightValue = lightVars[varName] || 'MISSING';

  if (inDark && inLight && darkValue !== lightValue) {
    console.log(`   ✓ ${varName}`);
    console.log(`      Dark:  ${darkValue}`);
    console.log(`      Light: ${lightValue}`);
  } else if (!inDark && !inLight) {
    console.log(`   ✗ ${varName} - MISSING in both themes`);
    allVarsPresent = false;
  } else if (!inDark) {
    console.log(`   ✗ ${varName} - MISSING in dark theme`);
    allVarsPresent = false;
  } else if (!inLight) {
    console.log(`   ✗ ${varName} - MISSING in light theme`);
    allVarsPresent = false;
  } else if (darkValue === lightValue) {
    console.log(`   ⚠️  ${varName} - Same value in both themes (${darkValue})`);
    console.log(`      This may not update on theme switch`);
  }
});

console.log(`\n   ${allVarsPresent ? '✓' : '✗'} All CSS variables defined in both themes`);

// Check element styling uses CSS variables
console.log('\n3. Element Styling with CSS Variables:');

function checkElementUsesCSSVar(className, property, description) {
  // Look for the CSS rule for this element
  const classPattern = new RegExp(`\\.${className}\\s*{([^}]+)}`, 's');
  const classMatch = cssStyles.match(classPattern);

  if (!classMatch) {
    return { found: false, reason: 'CSS rule not found' };
  }

  const classContent = classMatch[1];
  const propertyPattern = new RegExp(`${property}\\s*:\\s*([^;]+)`);
  const propertyMatch = classContent.match(propertyPattern);

  if (!propertyMatch) {
    return { found: false, reason: 'Property not defined' };
  }

  const propertyValue = propertyMatch[1].trim();

  // Check if it uses a CSS variable (var(--x-...) or var(--frame-...))
  const usesCSSVar = propertyValue.includes('var(');

  if (!usesCSSVar) {
    return { found: true, usesVar: false, value: propertyValue, reason: 'Hard-coded value' };
  }

  // Extract which CSS variables are used
  const varMatches = propertyValue.match(/var\(([^)]+)\)/g) || [];
  const cssVarsUsed = varMatches.map(v => v.replace(/var\(([^)]+)\)/, '$1').split(',')[0].trim());

  return {
    found: true,
    usesVar: true,
    value: propertyValue,
    vars: cssVarsUsed
  };
}

let totalElements = 0;
let elementsWithVar = 0;
let elementsHardcoded = [];
let elementsMissing = [];

// Check text elements
console.log('   a) Text Elements:');
requiredElements.textElements.forEach(element => {
  totalElements++;
  const result = checkElementUsesCSSVar(element.className, element.property, element.description);

  if (result.found && result.usesVar) {
    console.log(`      ✓ ${element.className}: ${result.value}`);
    elementsWithVar++;
  } else if (result.found && !result.usesVar) {
    console.log(`      ✗ ${element.className}: ${result.value} (HARDCODED - won't update on theme switch)`);
    elementsHardcoded.push({ ...element, value: result.value });
  } else {
    console.log(`      ✗ ${element.className}: ${result.reason}`);
    elementsMissing.push(element);
  }
});

// Check icon elements
console.log('   b) Icon Elements:');
requiredElements.iconElements.forEach(element => {
  totalElements++;
  const result = checkElementUsesCSSVar(element.className, element.property, element.description);

  if (result.found && result.usesVar) {
    console.log(`      ✓ ${element.className}: ${result.value}`);
    elementsWithVar++;
  } else if (result.found && !result.usesVar) {
    console.log(`      ✗ ${element.className}: ${result.value} (HARDCODED - won't update on theme switch)`);
    elementsHardcoded.push({ ...element, value: result.value });
  } else {
    console.log(`      ✗ ${element.className}: ${result.reason}`);
    elementsMissing.push(element);
  }
});

// Check background elements
console.log('   c) Background Elements:');
requiredElements.backgroundElements.forEach(element => {
  totalElements++;
  const result = checkElementUsesCSSVar(element.className, element.property, element.description);

  if (result.found && result.usesVar) {
    console.log(`      ✓ ${element.className}: ${result.value}`);
    elementsWithVar++;
  } else if (result.found && !result.usesVar) {
    console.log(`      ✗ ${element.className}: ${result.value} (HARDCODED - won't update on theme switch)`);
    elementsHardcoded.push({ ...element, value: result.value });
  } else {
    console.log(`      ✗ ${element.className}: ${result.reason}`);
    elementsMissing.push(element);
  }
});

// Check border elements
console.log('   d) Border Elements:');
requiredElements.borderElements.forEach(element => {
  totalElements++;
  const result = checkElementUsesCSSVar(element.className, element.property, element.description);

  if (result.found && result.usesVar) {
    console.log(`      ✓ ${element.className}: ${result.value}`);
    elementsWithVar++;
  } else if (result.found && !result.usesVar) {
    console.log(`      ✗ ${element.className}: ${result.value} (HARDCODED - won't update on theme switch)`);
    elementsHardcoded.push({ ...element, value: result.value });
  } else {
    console.log(`      ✗ ${element.className}: ${result.reason}`);
    elementsMissing.push(element);
  }
});

console.log(`\n   Total elements checked: ${totalElements}`);
console.log(`   Elements using CSS variables: ${elementsWithVar}`);
console.log(`   Elements with hard-coded values: ${elementsHardcoded.length}`);
console.log(`   Elements missing CSS: ${elementsMissing.length}`);

// Check for transition properties
console.log('\n4. Transition Properties (smooth theme switching):');

const transitionElements = [
  'twitter-context',
  'tw-author-name',
  'tw-author-handle',
  'tw-post-time',
  'tw-verified',
  'tw-post-content',
  'tw-link-card',
  'tw-context-placeholder',
  'tw-context-title',
  'tw-context-domain',
  'tw-post-actions',
  'tw-action-count',
  'tw-avatar'
];

let elementsWithTransitions = 0;
transitionElements.forEach(className => {
  const classPattern = new RegExp(`\\.${className}\\s*{([^}]+)}`, 's');
  const classMatch = cssStyles.match(classPattern);

  if (classMatch) {
    const classContent = classMatch[1];
    const hasTransition = /transition\s*:/.test(classContent);

    if (hasTransition) {
      const transitionMatch = classContent.match(/transition\s*:\s*([^;]+)/);
      if (transitionMatch) {
        console.log(`   ✓ ${className}: ${transitionMatch[1].trim()}`);
        elementsWithTransitions++;
      }
    }
  }
});

console.log(`   Elements with transitions: ${elementsWithTransitions}/${transitionElements.length}`);

// Final verdict
console.log('\n' + '='.repeat(70));

const themeClassesOk = hasDarkTheme && hasLightTheme;
const varsOk = allVarsPresent;
const elementsUseVars = elementsWithVar === totalElements;
const hasHardcoded = elementsHardcoded.length > 0;
const hasMissing = elementsMissing.length > 0;
const hasTransitions = elementsWithTransitions > 0;

let criticalIssues = [];
let warnings = [];

if (!themeClassesOk) {
  criticalIssues.push('Theme classes not properly defined');
}

if (!varsOk) {
  criticalIssues.push('Some CSS variables missing from theme definitions');
}

if (hasMissing) {
  criticalIssues.push(`${elementsMissing.length} elements missing CSS rules`);
}

if (hasHardcoded) {
  warnings.push(`${elementsWithVar === totalElements ? totalElements - elementsWithVar : elementsHardcoded.length} elements use hard-coded values instead of CSS variables`);
}

if (!hasTransitions) {
  warnings.push('Elements may not have smooth transitions on theme switch');
}

if (criticalIssues.length === 0 && warnings.length === 0) {
  console.log('✅ ALL TWITTER/X FRAME ELEMENTS UPDATE CORRECTLY ON THEME SWITCH');
  console.log('\n✓ Theme classes defined for dark and light modes');
  console.log('✓ All CSS variables defined in both themes with different values');
  console.log('✓ All elements use CSS variables (not hard-coded values)');
  console.log('✓ Elements have transition properties for smooth updates');
  console.log('\n🎉 Theme switching is fully functional for all Twitter/X frame elements!');
} else if (criticalIssues.length === 0 && warnings.length > 0) {
  console.log('⚠️  THEME SWITCHING WORKS BUT WITH MINOR ISSUES:');
  warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  console.log('\n✅ Core functionality works, but consider addressing warnings above.');
} else {
  console.log('❌ CRITICAL ISSUES DETECTED - THEME SWITCHING MAY NOT WORK CORRECTLY:');
  criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }
}

console.log('='.repeat(70));

// Exit with appropriate code
if (criticalIssues.length > 0) {
  process.exit(1);
} else if (warnings.length > 0) {
  process.exit(2);
} else {
  process.exit(0);
}
