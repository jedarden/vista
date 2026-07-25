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

const bgColor = '#16181c';
const currentColor = '#71767b';

console.log('Current contrast ratio:', getContrastRatio(currentColor, bgColor).toFixed(2) + ':1');

// Test alternative colors that maintain Twitter/X aesthetic while meeting WCAG AA
const testColors = [
    '#8b949a', // Slightly lighter gray
    '#9ba3b8', // Light gray (from vista's main theme)
    '#8899a6', // Twitter-like light gray
    '#6e767d', // Current alternative
    '#7a8288', // Between current and above
    '#868d92', // Lighter
];

testColors.forEach(color => {
    const ratio = getContrastRatio(color, bgColor);
    console.log(`${color}: ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? '✓ PASS' : '✗ FAIL'}`);
});

// Find the closest color that meets WCAG AA
console.log('\nRecommended colors that meet WCAG AA (4.5:1):');
const validColors = testColors.filter(color => getContrastRatio(color, bgColor) >= 4.5);
validColors.forEach(color => {
    console.log(`${color}: ${getContrastRatio(color, bgColor).toFixed(2)}:1`);
});