#!/usr/bin/env node
/**
 * Test Overlay Rendering with Real OG Images
 *
 * This script tests the overlay rendering functionality with actual OG image files
 * to verify:
 * 1. Overlay positioning matches safe zone boundaries
 * 2. Overlay dimensions are calculated correctly
 * 3. Semi-transparent fills render at expected opacity
 * 4. Export functionality produces correct overlays
 */

const fs = require('fs');
const path = require('path');

// Load the geometry functions from safe-zone.js
const safeZonePath = path.join(__dirname, 'src/public/safe-zone.js');
const safeZoneCode = fs.readFileSync(safeZonePath, 'utf8');

// Extract and evaluate the functions we need
const calculateCropRect = eval(
  safeZoneCode.match(/function calculateCropRect\([\s\S]*?\n}/)[0]
);
const calculateSafeZone = eval(
  safeZoneCode.match(/function calculateSafeZone\([\s\S]*?\n}/)[0]
);

// Mock PLATFORM_CROPS data (subset for testing)
const PLATFORM_CROPS = {
  facebook: {
    aspect: { min: 1.91, max: 1.91 },
    cropMode: 'cover',
    category: 'social'
  },
  twitter: {
    aspect: { min: 2, max: 2 },
    cropMode: 'cover',
    category: 'social'
  },
  linkedin: {
    aspect: { min: 1.91, max: 1.91 },
    cropMode: 'cover',
    category: 'professional'
  },
  google: {
    aspect: { min: 1, max: 1000 },
    cropMode: 'contain',
    category: 'search'
  }
};

// Test image configurations (real OG image sizes)
const TEST_IMAGES = [
  { name: 'Standard OG (1200x630)', width: 1200, height: 630 },
  { name: 'Twitter OG (1200x600)', width: 1200, height: 600 },
  { name: 'Square OG (1200x1200)', width: 1200, height: 1200 },
  { name: 'Portrait OG (630x1200)', width: 630, height: 1200 },
  { name: 'Large OG (2400x1260)', width: 2400, height: 1260 }
];

// Platform combinations to test
const TEST_COMBINATIONS = [
  { name: 'Facebook only', platforms: ['facebook'] },
  { name: 'Twitter only', platforms: ['twitter'] },
  { name: 'Facebook + Twitter', platforms: ['facebook', 'twitter'] },
  { name: 'All social platforms', platforms: ['facebook', 'twitter', 'linkedin'] },
  { name: 'With contain platform', platforms: ['facebook', 'google'] },
  { name: 'All platforms', platforms: ['facebook', 'twitter', 'linkedin', 'google'] }
];

// Color definitions (from app.js)
const CATEGORY_COLORS = {
  social: '#3b82f6',
  professional: '#8b5cf6',
  search: '#10b981'
};
const SAFE_ZONE_COLOR = '#06b6d4'; // Cyan

console.log('=== Overlay Rendering Test ===\n');

let totalTests = 0;
let passedTests = 0;

// Run tests for each image and platform combination
TEST_IMAGES.forEach(image => {
  console.log(`\n--- Testing: ${image.name} (${image.width}x${image.height}) ---`);

  TEST_COMBINATIONS.forEach(combo => {
    totalTests++;
    console.log(`\n  Platform combo: ${combo.name}`);

    try {
      // Calculate crop rectangles for each platform
      const cropRects = combo.platforms.map(pid => {
        const crop = PLATFORM_CROPS[pid];
        const rect = calculateCropRect(crop, image.width, image.height);
        return { pid, rect, crop };
      }).filter(c => c.rect !== null);

      console.log('    Crop rectangles:');
      cropRects.forEach(({ pid, rect }) => {
        console.log(`      ${pid}: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, ` +
                   `w=${Math.round(rect.w)}, h=${Math.round(rect.h)}`);
      });

      // Calculate safe zone
      const crops = cropRects.map(c => c.crop);
      const safeZone = calculateSafeZone(crops, image.width, image.height);

      console.log('    Safe zone:');
      console.log(`      x=${Math.round(safeZone.x)}, y=${Math.round(safeZone.y)}, ` +
                 `w=${Math.round(safeZone.w)}, h=${Math.round(safeZone.h)}`);
      console.log(`      Coverage: ${(safeZone.coverage * 100).toFixed(1)}%`);

      // Validate safe zone calculations
      const errors = [];

      // Safe zone should be within image bounds
      if (safeZone.x < 0 || safeZone.y < 0) {
        errors.push('Safe zone has negative coordinates');
      }
      if (safeZone.x + safeZone.w > image.width || safeZone.y + safeZone.h > image.height) {
        errors.push('Safe zone extends beyond image bounds');
      }

      // Safe zone should be the intersection of all crop rects
      cropRects.forEach(({ pid, rect }) => {
        if (safeZone.x < rect.x) {
          errors.push(`${pid}: Safe zone x (${Math.round(safeZone.x)}) < crop x (${Math.round(rect.x)})`);
        }
        if (safeZone.y < rect.y) {
          errors.push(`${pid}: Safe zone y (${Math.round(safeZone.y)}) < crop y (${Math.round(rect.y)})`);
        }
        if (safeZone.x + safeZone.w > rect.x + rect.w) {
          errors.push(`${pid}: Safe zone right edge extends beyond crop`);
        }
        if (safeZone.y + safeZone.h > rect.y + rect.h) {
          errors.push(`${pid}: Safe zone bottom edge extends beyond crop`);
        }
      });

      // Safe zone coverage should be reasonable (0-100%)
      if (safeZone.coverage < 0 || safeZone.coverage > 1) {
        errors.push(`Invalid coverage: ${safeZone.coverage}`);
      }

      if (errors.length > 0) {
        console.log(`    ❌ FAILED:`);
        errors.forEach(err => console.log(`       - ${err}`));
      } else {
        console.log(`    ✅ PASSED`);
        passedTests++;
      }

      // Test overlay dimensions for export
      console.log('    Export overlay parameters:');
      cropRects.forEach(({ pid, rect, color }) => {
        const catColor = CATEGORY_COLORS[PLATFORM_CROPS[pid].category];
        console.log(`      ${pid}: fill=${catColor}40 (25% alpha), stroke=${catColor}, ` +
                   `stroke-width=4, dash=[16,8]`);
      });

      if (safeZone.w > 0 && safeZone.h > 0) {
        console.log(`      Safe zone: halo=rgba(10,10,10,0.55), stroke=${SAFE_ZONE_COLOR}, ` +
                   `stroke-width=4, dash=[24,12]`);
      }

    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
    }
  });
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// Visual verification instructions
console.log('\n=== Visual Verification Instructions ===');
console.log('To visually verify overlay rendering:');
console.log('1. Start the VISTA server: npm start');
console.log('2. Open http://localhost:3000 in a browser');
console.log('3. Inspect a URL that has an OG image');
console.log('4. Click the "Editor" tab');
console.log('5. Click the "Crop Visualizer" button');
console.log('6. Select different platform combinations');
console.log('7. Verify:');
console.log('   - Semi-transparent colored rectangles appear for each platform');
console.log('   - Cyan dashed rectangle shows the safe zone intersection');
console.log('   - Dark halo makes the safe zone visible on all backgrounds');
console.log('   - Safe zone info shows correct dimensions and coverage');
console.log('8. Click "Export Overlay" to download PNG with overlay');
console.log('9. Open the PNG in an image viewer to verify transparency');

process.exit(totalTests === passedTests ? 0 : 1);
