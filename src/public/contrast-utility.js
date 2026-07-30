/**
 * Contrast Ratio Utility for Vista Theme Variables
 *
 * This utility provides functions to check and validate contrast ratios
 * for theme variables across all platforms, ensuring WCAG AA compliance.
 */

class ContrastChecker {
  /**
   * Calculate relative luminance of a color
   * @param {string} color - CSS color value (hex, rgb, or named color)
   * @returns {number} Relative luminance (0-1)
   */
  static calculateLuminance(color) {
    // Convert color to RGB
    const rgb = this.colorToRGB(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert CSS color to RGB array
   * @param {string} color - CSS color value
   * @returns {number[]|null} RGB array or null if invalid
   */
  static colorToRGB(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return hex.split('').map(c => parseInt(c + c, 16));
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]),
        parseInt(rgbMatch[2]),
        parseInt(rgbMatch[3])
      ];
    }

    // Handle named colors (basic set)
    const namedColors = {
      'black': [0, 0, 0],
      'white': [255, 255, 255],
      'red': [255, 0, 0],
      'green': [0, 128, 0],
      'blue': [0, 0, 255]
    };

    if (namedColors[color.toLowerCase()]) {
      return namedColors[color.toLowerCase()];
    }

    return null;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First CSS color
   * @param {string} color2 - Second CSS color
   * @returns {number} Contrast ratio (1-21)
   */
  static calculateContrastRatio(color1, color2) {
    const lum1 = this.calculateLuminance(color1);
    const lum2 = this.calculateLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   * @param {number} ratio - Contrast ratio
   * @param {string} textSize - 'normal' or 'large'
   * @param {string} level - 'AA' or 'AAA'
   * @returns {boolean} Whether the ratio meets the standard
   */
  static meetsWCAG(ratio, textSize = 'normal', level = 'AA') {
    const thresholds = {
      'normal': { 'AA': 4.5, 'AAA': 7.0 },
      'large': { 'AA': 3.0, 'AAA': 4.5 }
    };

    return ratio >= thresholds[textSize][level];
  }

  /**
   * Get contrast rating for a ratio
   * @param {number} ratio - Contrast ratio
   * @returns {string} Rating: 'AAA', 'AA', 'AA Large', or 'Fail'
   */
  static getContrastRating(ratio) {
    if (ratio >= 7.0) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3.0) return 'AA Large';
    return 'Fail';
  }

  /**
   * Check platform theme variables for contrast issues
   * @param {string} platform - Platform identifier (youtube, twitch, etc.)
   * @param {string} theme - Theme mode ('dark' or 'light')
   * @returns {Object} Contrast check results
   */
  static checkPlatformContrast(platform, theme = 'dark') {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // Get platform colors
    const bg = computedStyle.getPropertyValue(`--${platform}-bg`).trim();
    const textPrimary = computedStyle.getPropertyValue(`--${platform}-text-primary`).trim();
    const textSecondary = computedStyle.getPropertyValue(`--${platform}-text-secondary`).trim();
    const accent = computedStyle.getPropertyValue(`--${platform}-accent`).trim();
    const surface = computedStyle.getPropertyValue(`--${platform}-surface`).trim();

    // Calculate contrast ratios
    const primaryRatio = this.calculateContrastRatio(textPrimary, bg);
    const secondaryRatio = this.calculateContrastRatio(textSecondary, bg);
    const accentRatio = this.calculateContrastRatio(accent, bg);
    const surfaceTextRatio = this.calculateContrastRatio(textPrimary, surface);

    return {
      platform,
      theme,
      ratios: {
        textOnBackground: primaryRatio,
        secondaryOnBackground: secondaryRatio,
        accentOnBackground: accentRatio,
        textOnSurface: surfaceTextRatio
      },
      ratings: {
        textOnBackground: this.getContrastRating(primaryRatio),
        secondaryOnBackground: this.getContrastRating(secondaryRatio),
        accentOnBackground: this.getContrastRating(accentRatio),
        textOnSurface: this.getContrastRating(surfaceTextRatio)
      },
      passes: {
        textAA: this.meetsWCAG(primaryRatio, 'normal', 'AA'),
        textAAA: this.meetsWCAG(primaryRatio, 'normal', 'AAA'),
        secondaryAA: this.meetsWCAG(secondaryRatio, 'normal', 'AA'),
        accentAA: this.meetsWCAG(accentRatio, 'normal', 'AA'),
        surfaceTextAA: this.meetsWCAG(surfaceTextRatio, 'normal', 'AA')
      }
    };
  }

  /**
   * Check all platforms for contrast compliance
   * @param {string} theme - Theme mode ('dark' or 'light')
   * @returns {Object[]} Array of contrast check results for all platforms
   */
  static checkAllPlatforms(theme = 'dark') {
    const platforms = ['youtube', 'twitch', 'twitter', 'reddit', 'tiktok', 'github', 'gitlab'];

    return platforms.map(platform => this.checkPlatformContrast(platform, theme));
  }

  /**
   * Generate contrast report
   * @param {string} theme - Theme mode ('dark' or 'light')
   * @returns {string} Formatted contrast report
   */
  static generateContrastReport(theme = 'dark') {
    const results = this.checkAllPlatforms(theme);
    let report = `=== Vista Theme Variables Contrast Report (${theme.toUpperCase()} MODE) ===\n\n`;

    let allPass = true;

    results.forEach(result => {
      const platformPass = result.passes.textAA && result.passes.secondaryAA && result.passes.surfaceTextAA;
      if (!platformPass) allPass = false;

      report += `${result.platform.toUpperCase()}:\n`;
      report += `  Text on BG: ${result.ratios.textOnBackground.toFixed(2)}:1 (${result.ratings.textOnBackground})\n`;
      report += `  Secondary on BG: ${result.ratios.secondaryOnBackground.toFixed(2)}:1 (${result.ratings.secondaryOnBackground})\n`;
      report += `  Accent on BG: ${result.ratios.accentOnBackground.toFixed(2)}:1 (${result.ratings.accentOnBackground})\n`;
      report += `  Text on Surface: ${result.ratios.textOnSurface.toFixed(2)}:1 (${result.ratings.textOnSurface})\n`;
      report += `  Status: ${platformPass ? '✅ PASS' : '❌ FAIL'}\n\n`;
    });

    report += `=== Overall Status: ${allPass ? '✅ ALL PLATFORMS PASS' : '❌ SOME PLATFORMS FAIL'} ===\n`;
    report += `\nWCAG AA Requirements:\n`;
    report += `- Normal text: ≥4.5:1 contrast ratio\n`;
    report += `- Large text: ≥3.0:1 contrast ratio\n`;
    report += `- UI components: ≥3.0:1 contrast ratio\n`;

    return report;
  }

  /**
   * Get computed CSS variable value
   * @param {string} variableName - CSS variable name (with or without --)
   * @returns {string} Computed value
   */
  static getVariableValue(variableName) {
    const name = variableName.startsWith('--') ? variableName : `--${variableName}`;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /**
   * Test contrast between two CSS variables
   * @param {string} var1 - First CSS variable name
   * @param {string} var2 - Second CSS variable name
   * @returns {Object} Contrast result with ratio and rating
   */
  static testVariableContrast(var1, var2) {
    const color1 = this.getVariableValue(var1);
    const color2 = this.getVariableValue(var2);

    if (!color1 || !color2) {
      return {
        error: 'One or both variables not found',
        color1: color1 || 'undefined',
        color2: color2 || 'undefined'
      };
    }

    const ratio = this.calculateContrastRatio(color1, color2);
    return {
      color1,
      color2,
      ratio: ratio.toFixed(2),
      rating: this.getContrastRating(ratio),
      passesAA: this.meetsWCAG(ratio, 'normal', 'AA'),
      passesAAA: this.meetsWCAG(ratio, 'normal', 'AAA')
    };
  }
}

// Browser console API
if (typeof window !== 'undefined') {
  window.ContrastChecker = ContrastChecker;

  // Convenience functions for console use
  window.checkContrast = (var1, var2) => ContrastChecker.testVariableContrast(var1, var2);
  window.checkPlatform = (platform, theme) => ContrastChecker.checkPlatformContrast(platform, theme);
  window.checkAllPlatforms = (theme) => ContrastChecker.checkAllPlatforms(theme);
  window.contrastReport = (theme) => console.log(ContrastChecker.generateContrastReport(theme));

  console.log('ContrastChecker loaded. Usage:');
  console.log('  checkContrast("--youtube-bg", "--youtube-text-primary")');
  console.log('  checkPlatform("youtube", "dark")');
  console.log('  checkAllPlatforms("dark")');
  console.log('  contrastReport("dark")');
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContrastChecker;
}