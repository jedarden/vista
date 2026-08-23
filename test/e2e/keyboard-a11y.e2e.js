// @ts-check
/**
 * VISTA — Keyboard-only navigation + accessibility e2e test (vista-bbb2604f).
 *
 * Proves the four acceptance criteria of the bead at RUNTIME, across every
 * interactive app state — not just the two states axe-audit.js covers
 * (landing + results):
 *
 *   1. Every icon-only button has aria-label / aria-labelledby.
 *   2. Every focusable element shows a VISIBLE focus indicator while
 *      keyboard-focused (computed outline or box-shadow — the app's chosen
 *      indicator mechanism, see style.css :focus-visible block).
 *   3. The full workflow is drivable with the keyboard ALONE: no page.click,
 *      no page.fill — every interaction is page.keyboard.* (Tab / Enter /
 *      Space / arrows / Escape / typing). Mouse users get nothing the
 *      keyboard doesn't.
 *   4. Custom interactive elements (divs/spans with tabindex or interactive
 *      roles) expose a proper role.
 *
 * Part 1 drives the workflow: skip link → nav (Paste HTML mode) → type
 * fixture → submit → results → ARIA tablist (arrows/Home/End + Enter) →
 * QR modal (Enter/Tab-trap/Escape/focus-restore) → badge modal → feedback
 * panel (star rating + Escape) → command palette (Ctrl+K, filter, arrows,
 * Enter, Escape). A focus-indicator assertion runs after every focus landing.
 *
 * Part 2 sweeps every app state (landing, results + each tab pane, all three
 * modals/panels, command palette) and statically checks names / roles /
 * per-element focus indicators for every visible interactive element.
 *
 * The fixture is a complete static og/twitter page fed through Paste HTML
 * mode, so the run is offline-deterministic (no external URL drift).
 *
 * Usage:  node test/e2e/keyboard-a11y.e2e.js
 */

const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Headless Chrome needs its shared libraries on the path. On this NixOS box the
// old extracted bundle (used by visual.test.js / axe-audit.js) is gone, so we
// locate each of chromium's deps under /nix/store at runtime and build
// LD_LIBRARY_PATH from them. Re-resolving every run means nix hash changes
// (garbage-collection / upgrades) can't silently break the test. If the legacy
// bundle is restored, we use it as-is for speed.
function resolveChromiumLibs() {
  const legacy = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
  if (fs.existsSync(path.join(legacy, 'libglib-2.0.so.0'))) {
    process.env.LD_LIBRARY_PATH =
      legacy + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
    return;
  }
  let binary;
  try {
    binary = chromium.executablePath();
  } catch (_) {
    return;
  }
  if (!binary || !fs.existsSync(binary)) return;
  const ldd = spawnSync('ldd', [binary], { encoding: 'utf8' });
  if (ldd.status !== 0 || !ldd.stdout) return;

  const dirs = new Set();
  for (const line of ldd.stdout.split('\n')) {
    if (!line.includes('not found')) continue;
    const name = line.split('=>')[0].trim();
    if (!name) continue;
    const found = spawnSync(
      // No -type filter: nix store libs are symlinks to versioned .so files,
      // which -type f would skip.
      'find',
      ['/nix/store', '-maxdepth', '4', '-name', name],
      { encoding: 'utf8', timeout: 20000 }
    );
    const first = (found.stdout || '').split('\n').find(p => p);
    if (first) dirs.add(path.dirname(first));
  }
  if (dirs.size > 0) {
    process.env.LD_LIBRARY_PATH =
      Array.from(dirs).join(':') +
      (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
  }
}
resolveChromiumLibs();

const SERVER_PORT = Number(process.env.E2E_PORT) || 14610;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function waitForServer(port, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, res => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(500, () => req.destroy());
      });
      return;
    } catch (_) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} did not start within ${timeout}ms`);
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

// Complete static metadata so platform cards render with real content and the
// diagnostics tab has ground truth. No JS injection, no network images (the
// data: image keeps the card renderer fully offline).
const FIXTURE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Acme Keyboard Navigation Fixture</title>
  <meta property="og:title" content="Acme — Keyboard Fixture">
  <meta property="og:description" content="A static page for keyboard-only a11y testing">
  <meta property="og:image" content="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='%235b8dee'/%3E%3C/svg%3E">
  <meta property="og:url" content="https://example.com/keyboard">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Acme — Keyboard Fixture">
  <meta name="twitter:description" content="A static page for keyboard-only a11y testing">
</head>
<body><h1>Keyboard fixture</h1><p>Static body content.</p></body>
</html>`;

// ─── In-page probe helpers (evaluated in the browser) ─────────────────────────

// Focusable elements per the app's own focus-trap selector plus contenteditable.
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const INTERACTIVE_ROLE_SELECTOR = [
  '[role="button"]', '[role="tab"]', '[role="menuitem"]', '[role="option"]',
  '[role="checkbox"]', '[role="switch"]', '[role="combobox"]', '[role="listbox"]',
].join(', ');

/**
 * Sweep the CURRENT DOM state of the page for the three static criteria
 * (names, icon-only labels, roles) plus per-element focus indicators.
 * Returns arrays of offender descriptors. Must run AFTER at least one real
 * keyboard Tab so Chromium's :focus-visible heuristic treats programmatic
 * focus() as keyboard focus (matching what a real keyboard user sees).
 */
async function sweepState(page, label) {
  return page.evaluate(({ sel, roleSel, label: stateLabel }) => {
    // ── In-page utilities (self-contained: evaluate() cannot see outer scope) ──
    function isVisible(el) {
      if (!el.isConnected) return false;
      if (el.closest('.hidden')) return false;   // .hidden { display:none !important }
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    // aria-labelledby wins, then aria-label, then text content, then title —
    // a pragmatic accname approximation (axe remains the authority).
    function textName(el) {
      const lb = el.getAttribute('aria-labelledby');
      if (lb) {
        const t = lb.split(/\s+/)
          .map(id => (document.getElementById(id) || {}).textContent || '')
          .join(' ').trim();
        if (t) return t;
      }
      const al = el.getAttribute('aria-label');
      if (al && al.trim()) return al.trim();
      if (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes((el.type || '').toLowerCase())) {
        if (el.value && el.value.trim()) return el.value.trim();
      }
      const text = (el.textContent || '').trim();
      if (text) return text;
      const title = el.getAttribute('title');
      if (title && title.trim()) return title.trim();
      return '';
    }
    const hasLettersOrDigits = s => /\p{L}|\p{N}/u.test(s || '');
    function focusIndicatorVisible(el) {
      const cs = getComputedStyle(el);
      const ow = parseFloat(cs.outlineWidth) || 0;
      const outlineOk = ow > 0 && cs.outlineStyle !== 'none'
        && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && cs.outlineColor !== 'transparent';
      const shadowOk = !!cs.boxShadow && cs.boxShadow !== 'none';
      return outlineOk || shadowOk;
    }

    const offenders = { unnamed: [], iconOnly: [], noRing: [], missingRole: [] };

    // 1+4: accessible names for buttons/links/interactive roles; roles for
    // custom (non-native) interactive elements in the tab order.
    const named = [
      ...document.querySelectorAll('button, a[href], ' + roleSel),
    ].filter(isVisible);
    for (const el of named) {
      const name = textName(el);
      const desc = `<${el.tagName.toLowerCase()}${el.id ? ' id=' + el.id : ''} class="${el.className}">`;
      if (!name) offenders.unnamed.push(desc);
      // Icon-only: no letters or digits in the accessible text — for these,
      // title alone is not enough (invisible on touch, weaker practice);
      // require aria-label or aria-labelledby.
      const ownText = (el.textContent || '').trim();
      if (!hasLettersOrDigits(ownText) && !hasLettersOrDigits(name)) {
        const hasProperLabel = el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby');
        if (!hasProperLabel) offenders.iconOnly.push(desc + ' text=' + JSON.stringify(ownText));
      }
      const NATIVE = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
      const inTabOrder = !el.hasAttribute('tabindex') || parseInt(el.getAttribute('tabindex'), 10) >= 0;
      if (!NATIVE.includes(el.tagName) && inTabOrder && !el.getAttribute('role') && el.getAttribute('contenteditable') !== 'true') {
        offenders.missingRole.push(desc);
      }
    }

    // 2: visible focus indicator on every focusable element while focused.
    const focusable = [...document.querySelectorAll(sel)].filter(isVisible);
    const withoutRing = [];
    for (const el of focusable) {
      el.focus();
      if (document.activeElement !== el) continue; // focus refused (hidden trap etc.)
      if (!focusIndicatorVisible(el)) {
        withoutRing.push(
          `<${el.tagName.toLowerCase()}${el.id ? ' id=' + el.id : ''} class="${el.className}">`
        );
      }
    }
    offenders.noRing = withoutRing;
    return { label: stateLabel, counts: { named: named.length, focusable: focusable.length }, offenders };
  }, { sel: FOCUSABLE_SELECTOR, roleSel: INTERACTIVE_ROLE_SELECTOR, label });
}

function reportSweep(result) {
  const o = result.offenders;
  check(
    `[${result.label}] all interactive elements have accessible names (${result.counts.named} checked)`,
    o.unnamed.length === 0,
    o.unnamed.slice(0, 5).join(' | ')
  );
  check(
    `[${result.label}] every icon-only button has aria-label/aria-labelledby`,
    o.iconOnly.length === 0,
    o.iconOnly.slice(0, 5).join(' | ')
  );
  check(
    `[${result.label}] every focusable element shows a visible focus indicator (${result.counts.focusable} checked)`,
    o.noRing.length === 0,
    o.noRing.slice(0, 8).join(' | ')
  );
  check(
    `[${result.label}] custom interactive elements expose a role`,
    o.missingRole.length === 0,
    o.missingRole.slice(0, 5).join(' | ')
  );
}

/**
 * Re-establish keyboard interaction, then sweep + report. A real mouse event
 * (page.click for state setup) flips Chromium's :focus-visible heuristic to
 * pointer mode, after which programmatic focus() no longer matches
 * :focus-visible — the sweep would report every global-ring element as
 * ring-less. One real keypress restores the keyboard heuristic.
 */
async function sweep(page, label) {
  await page.keyboard.press('Tab');
  reportSweep(await sweepState(page, label));
}

/** Assert the CURRENTLY focused element shows a visible focus indicator. */
async function expectFocusVisible(page, label) {
  // Many controls carry `transition: var(--transition)` (~200ms); computed
  // styles sampled immediately after focus land mid-transition (outline-width
  // still ~0, color still interpolating). Let the transition settle first —
  // the settled state is what a keyboard user actually sees.
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const cs = getComputedStyle(el);
    const ow = parseFloat(cs.outlineWidth) || 0;
    const outlineOk = ow > 0 && cs.outlineStyle !== 'none'
      && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && cs.outlineColor !== 'transparent';
    const shadowOk = !!cs.boxShadow && cs.boxShadow !== 'none';
    return outlineOk || shadowOk;
  });
  check(`focus indicator visible: ${label}`, ok);
}

/**
 * Press Tab until the active element satisfies predicate (an in-page function),
 * or fail after maxTabs. Returns true when the predicate matched.
 * NOTE: the predicate must be a real function — page.evaluate() in this
 * Playwright version treats a string as an EXPRESSION, so an arrow-function
 * string ("() => …") evaluates to a function object and serializes to
 * undefined instead of being invoked.
 */
async function tabUntil(page, predicate, label, maxTabs = 50) {
  for (let i = 0; i < maxTabs; i++) {
    const matched = await page.evaluate(predicate);
    if (matched) return true;
    await page.keyboard.press('Tab');
  }
  const got = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `#${el.id || '.' + (el.className || el.tagName)}` : 'none';
  });
  check(`Tab reaches ${label}`, false, `gave up after ${maxTabs} tabs; focus at ${got}`);
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const server = spawn('node', ['src/server.js'], {
    cwd: path.join(__dirname, '..', '..'),
    env: { ...process.env, PORT: String(SERVER_PORT) },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  await waitForServer(SERVER_PORT);
  console.log(`Server ready on port ${SERVER_PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', e => console.log(`  (pageerror) ${e.message}`));

  try {
    // ════════════════════════════════════════════════════════════════════
    // PART 1 — Keyboard-only full workflow
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── Part 1: keyboard-only workflow ──');

    // ?feedback=1 opts the feedback widget in (it is hidden by default) so
    // its fab + panel participate in the tab order and the sweeps.
    await page.goto(`${BASE_URL}/?feedback=1`, { waitUntil: 'networkidle' });

    // 1a. First Tab lands on the skip link.
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement?.className || '');
    check('first Tab focuses the skip link', firstFocus.includes('skip-link'),
      `active=${firstFocus}`);
    await expectFocusVisible(page, 'skip link');

    // 1b. Tab into the nav and activate Paste HTML mode with Enter.
    const navReached = await tabUntil(page, () => document.activeElement?.id === 'navPaste', 'navPaste button');
    if (navReached) {
      await expectFocusVisible(page, 'nav button');
      await page.keyboard.press('Enter');
      const pasteVisible = await page.evaluate(() => !document.getElementById('pasteMode').classList.contains('hidden'));
      check('Enter on nav button opens Paste HTML mode', pasteVisible);
    }

    // 1c. Tab to the textarea and TYPE the fixture (real key events).
    await tabUntil(page, () => document.activeElement?.id === 'htmlInput', 'html textarea');
    await expectFocusVisible(page, 'paste textarea');
    await page.keyboard.type(FIXTURE, { delay: 0 });

    // 1d. Tab to submit and press Enter.
    await tabUntil(page, () => {
      const el = document.activeElement;
      return el?.tagName === 'BUTTON' && el?.closest('form')?.id === 'pasteForm';
    }, 'paste submit button');
    await expectFocusVisible(page, 'paste submit');
    await page.keyboard.press('Enter');

    await page.waitForSelector('#previewGrid .platform-card', { timeout: 30000 });
    const resultsShown = await page.evaluate(() =>
      !document.getElementById('resultsSection').classList.contains('hidden'));
    check('keyboard-driven submit renders results', resultsShown);
    await page.waitForTimeout(800); // let async card settle (context toggles enable)

    // 1e. Tab into the ARIA tablist; arrows + Home/End move focus.
    await tabUntil(page, () => !!document.activeElement?.closest('[role="tablist"]'), 'results tablist');
    const tab1 = await page.evaluate(() => document.activeElement?.id);
    await expectFocusVisible(page, 'tab button');
    await page.keyboard.press('ArrowRight');
    const tab2 = await page.evaluate(() => document.activeElement?.id);
    check('ArrowRight moves focus in tablist', tab1 !== tab2, `${tab1} → ${tab2}`);
    await expectFocusVisible(page, 'tab button after arrow');
    await page.keyboard.press('Home');
    const tabHome = await page.evaluate(() => document.activeElement?.id);
    check('Home returns to first tab', tabHome === 'tabnav-previews', `active=${tabHome}`);
    await page.keyboard.press('End');
    const tabEnd = await page.evaluate(() => document.activeElement?.id);
    check('End reaches last visible tab', !!tabEnd, `active=${tabEnd}`);

    // 1f. Enter activates the focused tab (ARIA manual-activation pattern).
    await page.keyboard.press('ArrowLeft'); // one back from End
    await page.keyboard.press('Enter');
    const activated = await page.evaluate(() => {
      const t = document.activeElement;
      return { selected: t?.getAttribute('aria-selected'), tab: t?.dataset.tab };
    });
    check('Enter activates the focused tab (aria-selected=true)', activated.selected === 'true',
      `tab=${activated.tab}`);

    // 1g. Tab to the QR button, Enter opens the modal, focus moves inside,
    // Tab wraps within the trap, Escape closes and restores focus.
    await tabUntil(page, () => document.activeElement?.id === 'qrBtn', 'QR button');
    await expectFocusVisible(page, 'QR button');
    await page.keyboard.press('Enter');
    const qrOpen = await page.evaluate(() => {
      const m = document.getElementById('qrModal');
      return !m.classList.contains('hidden') && m.contains(document.activeElement);
    });
    check('Enter opens QR modal with focus inside', qrOpen);
    if (qrOpen) {
      await expectFocusVisible(page, 'element inside QR modal');
      // Wrap the trap: Shift-Tab from the first element should land on the last.
      const firstIsFocused = await page.evaluate(() => {
        const m = document.getElementById('qrModal');
        const f = [...m.querySelectorAll('button, input, select, textarea')].filter(el => !el.disabled);
        return document.activeElement === f[0];
      });
      if (firstIsFocused) {
        await page.keyboard.press('Shift+Tab');
        const wrapped = await page.evaluate(() => {
          const m = document.getElementById('qrModal');
          const f = [...m.querySelectorAll('button, input, select, textarea')].filter(el => !el.disabled);
          return document.activeElement === f[f.length - 1];
        });
        check('Shift-Tab wraps from first to last inside QR modal trap', wrapped);
      }
      await page.keyboard.press('Escape');
      const qrClosed = await page.evaluate(() => {
        const m = document.getElementById('qrModal');
        return m.classList.contains('hidden') && document.activeElement?.id === 'qrBtn';
      });
      check('Escape closes QR modal and restores focus to opener', qrClosed);
    }

    // 1h. Badge modal: same contract.
    await tabUntil(page, () => document.activeElement?.id === 'badgeBtn', 'badge button');
    await page.keyboard.press('Enter');
    const badgeOpen = await page.evaluate(() => {
      const m = document.getElementById('badgeModal');
      return !m.classList.contains('hidden') && m.contains(document.activeElement);
    });
    check('Enter opens badge modal with focus inside', badgeOpen);
    if (badgeOpen) {
      await expectFocusVisible(page, 'element inside badge modal');
      await page.keyboard.press('Escape');
      const badgeClosed = await page.evaluate(() => {
        const m = document.getElementById('badgeModal');
        return m.classList.contains('hidden') && document.activeElement?.id === 'badgeBtn';
      });
      check('Escape closes badge modal and restores focus to opener', badgeClosed);
    }

    // 1i. Feedback panel: Enter opens, star rating is keyboard-operable,
    // Escape closes and focus returns to the fab.
    await tabUntil(page, () => document.activeElement?.id === 'feedbackFab', 'feedback fab');
    await expectFocusVisible(page, 'feedback fab');
    await page.keyboard.press('Enter');
    const fbOpen = await page.evaluate(() => {
      const p = document.getElementById('feedbackPanel');
      return !p.classList.contains('hidden') && p.contains(document.activeElement);
    });
    check('Enter opens feedback panel with focus inside', fbOpen);
    if (fbOpen) {
      await expectFocusVisible(page, 'feedback panel close button');
      // Rate 3 stars via keyboard: Tab to the 3rd star, Enter.
      await tabUntil(page, () => document.activeElement?.dataset?.rating === '3', '3rd rating star');
      await page.keyboard.press('Enter');
      const pressed = await page.evaluate(() => {
        const b = document.querySelector('.rating-btn[data-rating="3"]');
        return b?.getAttribute('aria-pressed');
      });
      check('Enter on star sets aria-pressed', pressed === 'true', `aria-pressed=${pressed}`);
      await page.keyboard.press('Escape');
      const fbClosed = await page.evaluate(() => {
        const p = document.getElementById('feedbackPanel');
        return p.classList.contains('hidden') && document.activeElement?.id === 'feedbackFab';
      });
      check('Escape closes feedback panel and restores focus to fab', fbClosed);
    }

    // 1j. Command palette: Ctrl+K opens with input focused; typing filters;
    // ArrowDown moves selection; Enter executes; Escape closes.
    await page.keyboard.press('Control+k');
    const paletteOpen = await page.evaluate(() => {
      const p = document.getElementById('commandPalette');
      return !!p && document.activeElement?.id === 'commandInput';
    });
    check('Ctrl+K opens command palette with input focused', paletteOpen);
    if (paletteOpen) {
      await expectFocusVisible(page, 'command palette input');
      await page.keyboard.type('editor', { delay: 0 });
      const filtered = await page.evaluate(() =>
        document.querySelectorAll('#commandResults .command-palette-item').length);
      check('typing filters command list', filtered > 0, `${filtered} match(es)`);
      await page.keyboard.press('ArrowDown');
      const sel = await page.evaluate(() => {
        const s = document.querySelector('#commandResults .command-palette-item.selected');
        return { label: s?.textContent?.trim(), selected: s?.getAttribute('aria-selected') };
      });
      check('ArrowDown selects a command (aria-selected=true)', sel.selected === 'true',
        sel.label || '');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const paletteClosed = await page.evaluate(() => {
        const p = document.getElementById('commandPalette');
        return !p || p.classList.contains('hidden'); // closeCommandPalette hides, not removes
      });
      check('Enter executes command and closes palette', paletteClosed);
    }

    // ════════════════════════════════════════════════════════════════════
    // PART 2 — Exhaustive sweep of every app state
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── Part 2: per-state sweep (names / icon-only / roles / focus rings) ──');

    // A real keyboard press first, so Chromium's :focus-visible heuristic
    // treats the sweep's programmatic focus() as keyboard focus.
    await page.keyboard.press('Tab');

    // Reload for a clean landing state.
    await page.goto(`${BASE_URL}/?feedback=1`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');

    // Freeze CSS transitions for the sweep (after the reload — injected
    // styles do not survive navigation): many controls transition their
    // outline (~200ms), and computed styles sampled right after programmatic
    // focus() land mid-transition. The frozen computed style IS the settled
    // end-state the user sees.
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation-duration: 0s !important; }',
    });
    await sweep(page, 'landing');

    // Re-run the inspection to get back to results (keyboard: reuse nav).
    await page.keyboard.press('Tab'); // skip-link again
    await tabUntil(page, () => document.activeElement?.id === 'navPaste', 'navPaste button');
    await page.keyboard.press('Enter');
    await tabUntil(page, () => document.activeElement?.id === 'htmlInput', 'html textarea');
    await page.keyboard.type(FIXTURE, { delay: 0 });
    await tabUntil(page, () => {
      const el = document.activeElement;
      return el?.tagName === 'BUTTON' && el?.closest('form')?.id === 'pasteForm';
    }, 'paste submit button');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#previewGrid .platform-card', { timeout: 30000 });
    await page.waitForTimeout(800);

    await sweep(page, 'results (previews tab)');

    // Sweep every visible tab pane.
    const tabIds = await page.evaluate(() =>
      [...document.querySelectorAll('.tab-btn:not(.hidden)')].map(b => b.dataset.tab));
    for (const tabId of tabIds) {
      await page.click(`.tab-btn[data-tab="${tabId}"]`); // state setup — Part 1 proved keyboard activation
      await page.waitForTimeout(150);
      await sweep(page, `tab: ${tabId}`);
    }

    // Sweep modals/overlays (open via the app's own functions — Part 1 proved
    // the keyboard path; here we just need the state to exist).
    await page.evaluate(() => window.openBadgeModal?.() || document.getElementById('badgeBtn')?.click());
    await page.waitForTimeout(150);
    await sweep(page, 'badge modal');
    await page.evaluate(() => document.getElementById('badgeModalClose')?.click());

    await page.evaluate(() => window.openQrModal?.() || document.getElementById('qrBtn')?.click());
    await page.waitForTimeout(150);
    await sweep(page, 'QR modal');
    await page.evaluate(() => document.getElementById('qrModalClose')?.click());

    await page.evaluate(() => document.getElementById('feedbackFab')?.click());
    await page.waitForTimeout(150);
    await sweep(page, 'feedback panel');
    await page.evaluate(() => document.getElementById('feedbackPanelClose')?.click());

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(150);
    await sweep(page, 'command palette');
    await page.keyboard.press('Escape');
  } finally {
    await context.close();
    await browser.close();
    server.kill();
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`keyboard-a11y e2e: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error(e.stack || e.message);
  process.exit(1);
});
