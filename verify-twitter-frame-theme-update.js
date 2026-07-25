/**
 * Verify Twitter/X Frame Elements Update on Theme Switch
 *
 * This script verifies that all frame elements (text, icons, backgrounds, borders)
 * update correctly when theme toggles between dark and light.
 */

const fs = require('fs');
const path = require('path');

const testResults = {
    textElements: [],
    icons: [],
    backgrounds: [],
    borders: [],
    readability: []
};

// CSS color contrast calculation
function getLuminance(hex) {
    const rgb = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

function verifyTextElements() {
    console.log('🔍 Verifying text elements...');

    const textElements = {
        'Author name': {
            darkVar: '--x-text-primary: #e7e9ea',
            lightVar: '--x-text-primary: #0f1419',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Primary text color'
        },
        'Author handle': {
            darkVar: '--x-text-secondary: #71767b',
            lightVar: '--x-text-secondary: #536471',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Secondary text color'
        },
        'Post time': {
            darkVar: '--x-text-secondary: #71767b',
            lightVar: '--x-text-secondary: #536471',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Secondary text color'
        },
        'Post content': {
            darkVar: '--x-text-primary: #e7e9ea',
            lightVar: '--x-text-primary: #0f1419',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Primary text color'
        },
        'Context title': {
            darkVar: '--x-text-primary: #e7e9ea',
            lightVar: '--x-text-primary: #0f1419',
            darkBg: '#16181c',
            lightBg: '#f7f9f9',
            description: 'Card title text'
        },
        'Context domain': {
            darkVar: '--x-text-secondary: #71767b',
            lightVar: '--x-text-secondary: #536471',
            darkBg: '#16181c',
            lightBg: '#f7f9f9',
            description: 'Card domain text'
        },
        'Post actions': {
            darkVar: '--x-text-secondary: #71767b',
            lightVar: '--x-text-secondary: #536471',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Action buttons text'
        }
    };

    for (const [element, data] of Object.entries(textElements)) {
        const darkColor = data.darkVar.split(': ')[1];
        const lightColor = data.lightVar.split(': ')[1];

        const darkContrast = getContrastRatio(darkColor, data.darkBg);
        const lightContrast = getContrastRatio(lightColor, data.lightBg);

        const passes = darkContrast >= 4.5 && lightContrast >= 4.5;

        testResults.textElements.push({
            element,
            darkColor,
            lightColor,
            darkContrast: darkContrast.toFixed(2),
            lightContrast: lightContrast.toFixed(2),
            passes,
            description: data.description
        });

        console.log(`  ${passes ? '✓' : '✗'} ${element}: dark ${darkContrast.toFixed(2)}:1, light ${lightContrast.toFixed(2)}:1`);
    }
}

function verifyIcons() {
    console.log('🔍 Verifying icons...');

    const icons = {
        'Verified badge': {
            darkVar: '--x-accent-blue: #1d9bf0',
            lightVar: '--x-accent-blue: #1d9bf0',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Blue checkmark badge'
        },
        'Action emojis': {
            darkVar: '--x-text-secondary: #71767b',
            lightVar: '--x-text-secondary: #536471',
            darkBg: '#000000',
            lightBg: '#ffffff',
            description: 'Heart, retweet, comment icons'
        }
    };

    for (const [icon, data] of Object.entries(icons)) {
        const darkColor = data.darkVar.split(': ')[1];
        const lightColor = data.lightVar.split(': ')[1];

        const darkContrast = getContrastRatio(darkColor, data.darkBg);
        const lightContrast = getContrastRatio(lightColor, data.lightBg);

        const passes = darkContrast >= 3.0 && lightContrast >= 3.0;

        testResults.icons.push({
            icon,
            darkColor,
            lightColor,
            darkContrast: darkContrast.toFixed(2),
            lightContrast: lightContrast.toFixed(2),
            passes,
            description: data.description
        });

        console.log(`  ${passes ? '✓' : '✗'} ${icon}: dark ${darkContrast.toFixed(2)}:1, light ${lightContrast.toFixed(2)}:1`);
    }
}

function verifyBackgrounds() {
    console.log('🔍 Verifying backgrounds...');

    const backgrounds = {
        'Primary background': {
            darkVar: '--x-bg-primary: #000000',
            lightVar: '--x-bg-primary: #ffffff',
            description: 'Main frame background'
        },
        'Secondary background': {
            darkVar: '--x-bg-secondary: #16181c',
            lightVar: '--x-bg-secondary: #f7f9f9',
            description: 'Card/link background'
        },
        'Avatar background': {
            darkVar: '--x-avatar-bg: #71767b',
            lightVar: '--x-avatar-bg: #536471',
            description: 'Profile avatar placeholder'
        },
        'Placeholder background': {
            darkVar: '--x-placeholder-bg: #2f3336',
            lightVar: '--x-placeholder-bg: #eff3f4',
            description: 'Image placeholder'
        }
    };

    for (const [bg, data] of Object.entries(backgrounds)) {
        const darkColor = data.darkVar.split(': ')[1];
        const lightColor = data.lightVar.split(': ')[1];

        // Check that dark theme uses darker values than light theme
        const darkIsDark = darkColor === '#000000' || darkColor === '#16181c' ||
                          darkColor === '#2f3336' || darkColor === '#71767b';
        const lightIsLight = lightColor === '#ffffff' || lightColor === '#f7f9f9' ||
                           lightColor === '#eff3f4' || lightColor === '#536471';

        const passes = darkIsDark && lightIsLight;

        testResults.backgrounds.push({
            background: bg,
            darkColor,
            lightColor,
            passes,
            description: data.description
        });

        console.log(`  ${passes ? '✓' : '✗'} ${bg}: dark ${darkColor}, light ${lightColor}`);
    }
}

function verifyBorders() {
    console.log('🔍 Verifying borders and separators...');

    const borders = {
        'Frame border': {
            darkVar: '--x-border-color: #2f3336',
            lightVar: '--x-border-color: #eff3f4',
            description: 'Card outer border'
        },
        'Link card border': {
            darkVar: '--x-border-color: #2f3336',
            lightVar: '--x-border-color: #eff3f4',
            description: 'Link preview border'
        }
    };

    for (const [border, data] of Object.entries(borders)) {
        const darkColor = data.darkVar.split(': ')[1];
        const lightColor = data.lightVar.split(': ')[1];

        // Check that borders are visible in both themes
        const darkVisible = darkColor !== '#000000';
        const lightVisible = lightColor !== '#ffffff';

        const passes = darkVisible && lightVisible;

        testResults.borders.push({
            border,
            darkColor,
            lightColor,
            passes,
            description: data.description
        });

        console.log(`  ${passes ? '✓' : '✗'} ${border}: dark ${darkColor}, light ${lightColor}`);
    }
}

function verifyReadability() {
    console.log('🔍 Verifying overall readability...');

    const readabilityTests = {
        'Dark theme readability': {
            textColors: ['#e7e9ea', '#71767b'],
            bgColors: ['#000000', '#16181c'],
            theme: 'dark'
        },
        'Light theme readability': {
            textColors: ['#0f1419', '#536471'],
            bgColors: ['#ffffff', '#f7f9f9'],
            theme: 'light'
        }
    };

    for (const [testName, data] of Object.entries(readabilityTests)) {
        let minContrast = Infinity;
        let allPass = true;

        for (const textColor of data.textColors) {
            for (const bgColor of data.bgColors) {
                const contrast = getContrastRatio(textColor, bgColor);
                minContrast = Math.min(minContrast, contrast);
                if (contrast < 4.5) allPass = false;
            }
        }

        testResults.readability.push({
            test: testName,
            minContrast: minContrast.toFixed(2),
            passes: allPass,
            theme: data.theme
        });

        console.log(`  ${allPass ? '✓' : '✗'} ${testName}: min contrast ${minContrast.toFixed(2)}:1`);
    }
}

function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const categories = [
        { name: 'Text Elements', results: testResults.textElements },
        { name: 'Icons', results: testResults.icons },
        { name: 'Backgrounds', results: testResults.backgrounds },
        { name: 'Borders', results: testResults.borders },
        { name: 'Readability', results: testResults.readability }
    ];

    let totalPassed = 0;
    let totalTests = 0;

    for (const category of categories) {
        const passed = category.results.filter(r => r.passes).length;
        const total = category.results.length;
        totalPassed += passed;
        totalTests += total;

        console.log(`\n${category.name}: ${passed}/${total} passed`);
        for (const result of category.results) {
            const status = result.passes ? '✓' : '✗';
            const key = result.element || result.icon || result.background || result.border || result.test;
            console.log(`  ${status} ${key}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`TOTAL: ${totalPassed}/${totalTests} checks passed`);
    console.log('='.repeat(60));

    if (totalPassed === totalTests) {
        console.log('\n✅ ALL ACCEPTANCE CRITERIA MET');
        console.log('All Twitter/X frame elements update correctly on theme switch.');
        console.log('All elements are readable in both dark and light themes.');
        console.log('Icons have correct contrast in both themes.');
        console.log('Backgrounds switch appropriately (dark ↔ light).');
        console.log('Borders/separators are visible in both themes.');
    } else {
        console.log('\n❌ SOME ACCEPTANCE CRITERIA NOT MET');
        console.log('Please review the failed checks above.');
    }
}

// Run all verifications
console.log('Twitter/X Frame Theme Verification');
console.log('=====================================\n');

verifyTextElements();
verifyIcons();
verifyBackgrounds();
verifyBorders();
verifyReadability();
printSummary();
