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

console.log('=== VERIFIED: Twitter/X Frame Contrast Fix ===\n');
console.log('Dark Theme Secondary Text (handles, timestamps, domains):');
console.log('Text: #8899a6, Background: #16181c');
console.log('Text luminance:', getLuminance('#8899a6'));
console.log('BG luminance:', getLuminance('#16181c'));
const ratio = getContrastRatio('#8899a6', '#16181c');
console.log('Contrast ratio:', ratio.toFixed(2) + ':1');
console.log('WCAG AA Status:', ratio >= 4.5 ? '✅ PASS (≥ 4.5:1)' : '❌ FAIL (< 4.5:1)');
console.log('WCAG AAA Status:', ratio >= 7.0 ? '✅ PASS (≥ 7.0:1)' : '⚠️  FAIL (< 7.0:1)');