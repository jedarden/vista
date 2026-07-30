#!/usr/bin/env node
/**
 * Verify all 43 platforms have complete infrastructure
 * Checks: frames (dark + light), skeleton mappings, scoring rules
 */

const fs = require('fs');
const path = require('path');

const ALL_PLATFORMS = [
  'asana', 'bluesky', 'devto', 'discord', 'evernote', 'facebook', 'feedly',
  'figma', 'github', 'gitlab', 'gmail', 'google', 'googlechat', 'hackernews',
  'imessage', 'instagram', 'jetbrains', 'jira', 'kakaotalk', 'line',
  'linkedin', 'mastodon', 'medium', 'notion', 'outlook', 'pinterest',
  'producthunt', 'reddit', 'signal', 'slack', 'stackoverflow', 'substack',
  'teams', 'telegram', 'threads', 'tiktok', 'trello', 'tumblr', 'twitter',
  'vscode', 'whatsapp', 'youtube', 'zoom'
];

const publicDir = path.join(__dirname, '../src/public');
const scorerPath = path.join(__dirname, '../src/scorer.js');
const skeletonTypesPath = path.join(__dirname, '../src/skeleton-types.js');

function checkFrame(platform, mode) {
  const framePath = path.join(publicDir, `${platform}-${mode}.html`);
  return fs.existsSync(framePath);
}

function checkSkeletonMapping(platform) {
  const { PLATFORM_SKELETON_MAP } = require(skeletonTypesPath);
  return !!PLATFORM_SKELETON_MAP[platform];
}

function checkScoringRule(platform) {
  const scorerContent = fs.readFileSync(scorerPath, 'utf8');
  // Check for case statement with the platform name
  return scorerContent.includes(`case '${platform}'`);
}

function getSkeletonType(platform) {
  const { PLATFORM_SKELETON_MAP } = require(skeletonTypesPath);
  return PLATFORM_SKELETON_MAP[platform];
}

function main() {
  console.log('🔍 Verifying all 43 platforms...\n');

  const results = {};
  let totalPass = 0;
  let totalFail = 0;

  // Skeleton breakdown
  const byType = { tall: [], short: [], text_only: [] };

  for (const platform of ALL_PLATFORMS) {
    const light = checkFrame(platform, 'light');
    const dark = checkFrame(platform, 'dark');
    const skeleton = checkSkeletonMapping(platform);
    const scoring = checkScoringRule(platform);
    const skeletonType = getSkeletonType(platform);

    results[platform] = { light, dark, skeleton, scoring, skeletonType };

    if (skeletonType) {
      byType[skeletonType].push(platform);
    }

    const allPass = light && dark && skeleton && scoring;
    if (allPass) totalPass++;
    else totalFail++;
  }

  // Print summary
  console.log(`📊 Summary:`);
  console.log(`  Total platforms: ${ALL_PLATFORMS.length}`);
  console.log(`  ✅ Pass: ${totalPass}`);
  console.log(`  ❌ Fail: ${totalFail}\n`);

  // Print skeleton breakdown
  console.log(`🎨 Skeleton Type Breakdown:`);
  console.log(`  Tall (${byType.tall.length}): ${byType.tall.join(', ')}`);
  console.log(`  Short (${byType.short.length}): ${byType.short.join(', ')}`);
  console.log(`  Text Only (${byType.text_only.length}): ${byType.text_only.join(', ')}\n`);

  // Print detailed results
  console.log(`🔍 Platform Details:`);
  for (const platform of ALL_PLATFORMS) {
    const { light, dark, skeleton, scoring, skeletonType } = results[platform];
    const allPass = light && dark && skeleton && scoring;

    const status = allPass ? '✅' : '❌';
    const checks = [
      light ? 'L' : 'l',
      dark ? 'D' : 'd',
      skeleton ? 'S' : 's',
      scoring ? 'R' : 'r'
    ].join('');

    const typeLabel = skeletonType ? skeletonType.padEnd(10) : 'MISSING    ';

    console.log(`  ${status} ${platform.padEnd(15)} ${typeLabel} ${checks}`);
  }

  console.log(`\nLegend: L=Light frame, D=Dark frame, S=Skeleton mapping, R=Scoring rule`);

  // Return exit code
  process.exit(totalFail > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFrame, checkSkeletonMapping, checkScoringRule, getSkeletonType, ALL_PLATFORMS };
