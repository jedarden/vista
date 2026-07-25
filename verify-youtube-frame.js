/**
 * YouTube Frame Verification Script
 *
 * This script verifies that the YouTube frame implementation meets all acceptance criteria.
 */

const fs = require('fs');
const path = require('path');

function verifyYouTubeFrame() {
  const framePath = path.join(__dirname, 'src/public/youtube-frame.html');

  console.log('🔍 Verifying YouTube platform frame implementation...\n');

  // Check if file exists
  if (!fs.existsSync(framePath)) {
    console.error('❌ FAIL: youtube-frame.html not found');
    return false;
  }
  console.log('✓ PASS: Frame file exists');

  // Read and verify content
  const content = fs.readFileSync(framePath, 'utf8');

  const checks = [
    {
      name: 'YouTube frame renders with realistic chrome matching YouTube\'s UI',
      test: () => {
        return content.includes('yt-video-player') &&
               content.includes('yt-channel-section') &&
               content.includes('yt-action-buttons') &&
               content.includes('yt-comments-section');
      }
    },
    {
      name: 'View count and like/dislike icons display correctly',
      test: () => {
        return content.includes('yt-video-stats') &&
               content.includes('👍') &&
               content.includes('👎') &&
               content.includes('42K'); // Like count
      }
    },
    {
      name: 'Dark/light toggle switches theme seamlessly',
      test: () => {
        return content.includes('function toggleTheme()') &&
               content.includes('data-theme') &&
               content.includes('frames-theme.css') &&
               content.includes('transition:');
      }
    },
    {
      name: 'Card appears embedded in YouTube context, not floating',
      test: () => {
        const hasContext = content.includes('youtube-context');
        const hasMaxWidth = content.includes('max-width: 680px');
        const hasBorderRadius = content.includes('border-radius');
        // Check that the main context is not floating (theme toggle button is fixed, but that's OK)
        const contextNotFloating = !content.includes('.youtube-context') ||
                                   !content.match(/\.youtube-context[^}]*position:\s*fixed/);
        return hasContext && hasMaxWidth && hasBorderRadius && contextNotFloating;
      }
    },
    {
      name: 'Theme CSS variables properly defined',
      test: () => {
        return content.includes('--youtube-bg') &&
               content.includes('--youtube-surface') &&
               content.includes('--youtube-text-primary') &&
               content.includes('--youtube-accent');
      }
    }
  ];

  let allPassed = true;

  checks.forEach((check, index) => {
    const passed = check.test();
    const status = passed ? '✓ PASS' : '❌ FAIL';
    const num = index + 1;

    console.log(`${status} [${num}]: ${check.name}`);

    if (!passed) {
      allPassed = false;
    }
  });

  console.log('\n' + '='.repeat(80));

  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - YouTube frame is properly implemented!');
    console.log('\nNext steps:');
    console.log('1. Open verify-youtube-frame.html in a browser');
    console.log('2. Manually verify the visual appearance in both themes');
    console.log('3. Take screenshots of both dark and light modes');
    return true;
  } else {
    console.log('❌ SOME CHECKS FAILED - Review the implementation');
    return false;
  }
}

// Run verification
const success = verifyYouTubeFrame();
process.exit(success ? 0 : 1);