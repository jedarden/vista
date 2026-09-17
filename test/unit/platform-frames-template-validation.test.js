/**
 * PLATFORM_FRAMES template and metadata validation — vista-67e96e56
 *
 * This is intentionally a data-driven contract test.  A new registry entry
 * must satisfy the same schema, category/ratio domains, placeholder contract,
 * and dark/light token contract as every existing entry.  It also has to be
 * safe to hand to the dependency-free frame renderer used when the richer
 * theme module is unavailable.
 *
 * Usage: node test/unit/platform-frames-template-validation.test.js
 *        (or via npm test)
 */

'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PlatformFrames = require(path.join(ROOT, 'src', 'public', 'platform-frames.js'));
const FrameRenderer = require(path.join(ROOT, 'src', 'public', 'frame-renderer.js'));

const {
  PLATFORM_FRAMES,
  THEME_VAR_NAMES,
  buildContextFrame,
  interpolateTemplate,
} = PlatformFrames;

const VALID_CATEGORIES = new Set([
  'social',
  'messaging',
  'collaboration',
  'content',
  'email',
  'rss',
  'other',
]);

const VALID_ASPECT_RATIOS = new Set([
  '1:1',
  '1.91:1',
  '16:9',
  '9:16',
  '2:3',
  'variable',
]);

// These are the names accepted by the template interpolator.  Structural
// slots are populated by buildContextFrame; the remaining names are metadata
// or neutral-content tokens used by the platform templates.  Keeping this
// list explicit means a misspelled token fails the test instead of silently
// rendering as an empty string.
const SUPPORTED_PLACEHOLDERS = new Set([
  'answer',
  'assignee',
  'author',
  'boardName',
  'cardContent',
  'checklist',
  'claps',
  'comment',
  'commentCount',
  'comments',
  'description',
  'descriptionSection',
  'domain',
  'dueDate',
  'feedName',
  'feedTitle',
  'fileName',
  'from',
  'game',
  'image',
  'imageSection',
  'issueKey',
  'issueNumber',
  'labels',
  'likeCount',
  'likes',
  'linkCard',
  'linkCards',
  'linkPreview',
  'mainResult',
  'mrNumber',
  'notebookName',
  'pageTitle',
  'platformName',
  'points',
  'preview',
  'productName',
  'projectName',
  'response',
  'responses',
  'senderEmail',
  'senderName',
  'site',
  'siteSection',
  'status',
  'streamTitle',
  'streamerName',
  'subject',
  'subscriberCount',
  'tag1',
  'tag2',
  'tag3',
  'tagline',
  'tags',
  'taskId',
  'themeColor',
  'time',
  'timeAgo',
  'title',
  'titleSection',
  'to',
  'unreadCount',
  'upvotes',
  'userAnswer',
  'userArticle',
  'userBlock',
  'userCard',
  'userComment',
  'userMessage',
  'userNote',
  'userResponse',
  'viewerCount',
  'yourEmail',
]);

const PLACEHOLDER_RE = /\{\{([^{}]*)\}\}/g;

let failures = 0;
let passes = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateTemplate(id, field, template) {
  const label = `${id}.${field}`;
  check(`${label} is a string`, typeof template === 'string');
  if (typeof template !== 'string') return;

  const seen = [];
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const name = match[1];
    seen.push(name);
    check(`${label} placeholder {{${name}}} is recognized`,
      /^\w+$/.test(name) && SUPPORTED_PLACEHOLDERS.has(name));
  }

  const withoutValidPlaceholders = template.replace(PLACEHOLDER_RE, '');
  check(`${label} has no malformed placeholder braces`,
    !withoutValidPlaceholders.includes('{{') && !withoutValidPlaceholders.includes('}}'));

  // Exercise the same interpolation primitive used by buildContextFrame with
  // a value for every supported token.  No valid token may survive rendering.
  const sampleValues = Object.fromEntries(
    [...SUPPORTED_PLACEHOLDERS].map((name) => [name, `marker-${name}`])
  );
  const rendered = interpolateTemplate(template, sampleValues);
  check(`${label} interpolates without leftover tokens`, !PLACEHOLDER_RE.test(rendered));

  // Reset the global regexp state before the next test uses it.
  PLACEHOLDER_RE.lastIndex = 0;
  return seen;
}

console.log(`\nPLATFORM_FRAMES template validation (${Object.keys(PLATFORM_FRAMES).length} entries)\n`);

console.log('1. Required fields and recognized metadata domains');
for (const [id, frame] of Object.entries(PLATFORM_FRAMES)) {
  check(`${id} registry key is non-empty`, typeof id === 'string' && id.length > 0);
  check(`${id}.name is a non-empty string`, typeof frame.name === 'string' && frame.name.trim().length > 0);
  check(`${id}.category is recognized`, VALID_CATEGORIES.has(frame.category), `got ${JSON.stringify(frame.category)}`);
  check(`${id}.hasThemeSupport is boolean`, typeof frame.hasThemeSupport === 'boolean');
  check(`${id}.aspectRatio is recognized`, VALID_ASPECT_RATIOS.has(frame.aspectRatio), `got ${JSON.stringify(frame.aspectRatio)}`);
  check(`${id}.chrome is non-empty`, typeof frame.chrome === 'string' && frame.chrome.trim().length > 0);
  check(`${id}.neutralContent is a string`, typeof frame.neutralContent === 'string');
  check(`${id}.themeVars is an object`, isRecord(frame.themeVars));
  check(`${id}.themeVars has dark and light objects`,
    isRecord(frame.themeVars) && isRecord(frame.themeVars.dark) && isRecord(frame.themeVars.light));

  validateTemplate(id, 'chrome', frame.chrome);
  validateTemplate(id, 'neutralContent', frame.neutralContent);
}

console.log('\n2. Dark/light theme variable contract');
for (const [id, frame] of Object.entries(PLATFORM_FRAMES)) {
  if (!isRecord(frame.themeVars)) continue;
  for (const mode of ['dark', 'light']) {
    const vars = frame.themeVars[mode];
    if (!isRecord(vars)) continue;
    const missing = THEME_VAR_NAMES.filter((name) => !(name in vars));
    const unknown = Object.keys(vars).filter((name) => !THEME_VAR_NAMES.includes(name));
    check(`${id}.${mode} defines every required theme variable`, missing.length === 0,
      missing.length ? `missing ${missing.join(', ')}` : '');
    check(`${id}.${mode} has no unrecognized theme variables`, unknown.length === 0,
      unknown.length ? `unknown ${unknown.join(', ')}` : '');
    check(`${id}.${mode} theme values are non-empty strings`,
      THEME_VAR_NAMES.every((name) => typeof vars[name] === 'string' && vars[name].trim().length > 0));
  }
  check(`${id} dark and light themes are both usable`,
    isRecord(frame.themeVars.dark) && isRecord(frame.themeVars.light) &&
    THEME_VAR_NAMES.every((name) => frame.themeVars.dark[name] && frame.themeVars.light[name]));
}

console.log('\n3. buildContextFrame consumes every registry entry safely');
const content = {
  title: 'Validation title',
  description: 'Validation description',
  domain: 'validation.example',
  site: 'Validation site',
  image: 'https://validation.example/image.png',
  themeColor: '#123456',
  cardHTML: '<div class="validation-card">card</div>',
};
for (const id of Object.keys(PLATFORM_FRAMES)) {
  for (const theme of ['dark', 'light']) {
    let html;
    try {
      html = buildContextFrame(id, content, theme);
    } catch (error) {
      check(`${id} ${theme} context frame does not throw`, false, error.message);
      continue;
    }
    check(`${id} ${theme} context frame is HTML`, typeof html === 'string' && html.includes('<div'));
    check(`${id} ${theme} context frame identifies its platform`,
      html.includes(`data-platform="${id}"`));
    check(`${id} ${theme} context frame has no unresolved placeholders`,
      !/\{\{[^}]*\}\}/.test(html));
  }
}

console.log('\n4. Dependency-free fallback renderer compatibility');
for (const id of Object.keys(PLATFORM_FRAMES)) {
  check(`${id} has a supported fallback frame type`,
    Object.values(FrameRenderer.FRAME_TYPES).includes(FrameRenderer.getFrameType(id)));
  for (const theme of ['dark', 'light']) {
    let html;
    try {
      html = FrameRenderer.renderPlatformFrame({
        platform: id,
        title: 'Fallback validation title',
        description: 'Fallback validation description',
        domain: `${id}.example`,
        theme,
      });
    } catch (error) {
      check(`${id} ${theme} fallback renderer does not throw`, false, error.message);
      continue;
    }
    check(`${id} ${theme} fallback renderer returns HTML`, typeof html === 'string' && html.includes('<div'));
    check(`${id} ${theme} fallback renderer emits the platform class`,
      html.includes(`class="frame-base ${id}-context"`));
    check(`${id} ${theme} fallback renderer emits its theme`,
      html.includes(`data-frame-theme="${theme}"`));
    check(`${id} ${theme} fallback renderer emits an accessible article label`,
      html.includes(`aria-label="${id} context frame"`));
    check(`${id} ${theme} fallback renderer leaves no template tokens`,
      !/\{\{[^}]*\}\}/.test(html));
  }
}

console.log(`\n${'─'.repeat(70)}`);
console.log(`PLATFORM_FRAMES template validation: ${passes} passed, ${failures} failed`);
console.log(`${'─'.repeat(70)}`);
process.exit(failures > 0 ? 1 : 0);
