# bf-5yeeq — Add messaging platform frames

**Task:** Add context frames for Slack, Discord, Reddit, and WhatsApp (chrome,
neutral placeholder content, dark/light theming) in `platform-frames.js` /
`frames-theme.css`.

**Outcome:** No code changes required — all four platforms were already
implemented and committed prior to this bead. Verified against every acceptance
criterion; this note records the verification.

## State at HEAD (no working-tree changes to the two source files)

| Platform | In `PLATFORM_FRAMES` | Category | `hasThemeSupport` | Chrome prefix | CSS context class |
|----------|:---:|---|:---:|:---:|---|
| Slack    | ✅ | messaging | true | `slack`   | `.slack-context`   |
| Discord  | ✅ | messaging | true | `discord` | `.discord-context` |
| Reddit   | ✅ | social    | true | `rd`      | `.reddit-context`  |
| WhatsApp | ✅ | messaging | true | `wa`      | `.whatsapp-context`|

Provenance of the existing implementations:
- Slack / Discord / Reddit — added in `c29665b` (`feat(bf-1eq): implement
  platform context frames architecture`, 2026-05-30).
- WhatsApp — added in `c267924` (`feat(bf-3zk): implement messaging app context
  frames`, 2026-07-23).
- Reddit link-aggregator wiring — `cf8ba71` (`feat(bf-o164e)`).

## Acceptance-criteria verification

1. **All 4 platforms have context frames in `platform-frames.js`** — confirmed
   present in HEAD.
2. **Each frame visually distinct / platform-appropriate** — each carries a
   unique chrome prefix (`slack`/`discord`/`rd`/`wa`); Slack & Discord render a
   channel-sidebar + message stream, Reddit renders a subreddit banner +
   upvoted post + comment thread, WhatsApp renders a chat-header + bubbles.
   Cross-platform distinctness asserted below.
3. **Dark/light mode works for all 4** — each defines `themeVars.dark` and
   `themeVars.light`, all 12 `THEME_VAR_NAMES` populated in both modes.
4. **Render correctness** — exercised each platform through the real
   `buildContextFrame` path in dark + light; every render is non-empty,
   contains its chrome prefix, has no unfilled `{{placeholder}}`, and dark ≠
   light output.

## Tests run (all green)

- `npm test` (unit suite): **19/19 files passed**.
- `src/tests/test-link-aggregator-frames-wiring.js` (Reddit chrome, dual-theme,
  link-aggregator wiring): **ALL CHECKS PASSED**.
- `src/tests/test-all-7-platforms-wiring.js` (incl. Reddit in 7-platform
  distinctness matrix): **ALL 128 CHECKS PASSED**.
- `src/tests/test-render-platform-config-wiring.js` (config routing + legacy
  fallback): **ALL CHECKS PASSED**.
- Ad-hoc render verification of all four platforms (dark+light, distinctness,
  no unfilled placeholders): **PASSED**.

This is the same "bead opened against already-complete work" pattern seen in
bf-4bo1; closing as complete.
