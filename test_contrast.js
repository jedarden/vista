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

console.log('Testing contrast for Context Domain in dark theme:');
console.log('Text: #71767b, Background: #16181c');
console.log('Text luminance:', getLuminance('#71767b'));
console.log('BG luminance:', getLuminance('#16181c'));
console.log('Contrast ratio:', getContrastRatio('#71767b', '#16181c').toFixed(2) + ':1');
console.log('');
console.log('Testing with lighter background (#383c40):');
console.log('Contrast ratio:', getContrastRatio('#71767b', '#383c40').toFixed(2) + ':1');
