# VISTA Platform Inventory

This is the canonical inventory for VISTA's product platform IDs. The source
of truth is `src/scorer.js`; the list below is the same 43 IDs used by scoring
and by the `/api/platforms` response.

## Canonical product platforms

| ID | Display name | Category |
|----|--------------|----------|
| `google` | Google Search | Social & Microblogging |
| `facebook` | Facebook | Social & Microblogging |
| `twitter` | X (Twitter) | Social & Microblogging |
| `linkedin` | LinkedIn | Social & Microblogging |
| `reddit` | Reddit | Social & Microblogging |
| `youtube` | YouTube | Social & Microblogging |
| `instagram` | Instagram | Social & Microblogging |
| `threads` | Threads | Social & Microblogging |
| `tiktok` | TikTok | Social & Microblogging |
| `producthunt` | Product Hunt | Social & Microblogging |
| `mastodon` | Mastodon | Social & Microblogging |
| `bluesky` | Bluesky | Social & Microblogging |
| `hackernews` | Hacker News | Social & Microblogging |
| `tumblr` | Tumblr | Social & Microblogging |
| `pinterest` | Pinterest | Social & Microblogging |
| `slack` | Slack | Messaging |
| `discord` | Discord | Messaging |
| `whatsapp` | WhatsApp | Messaging |
| `imessage` | iMessage | Messaging |
| `telegram` | Telegram | Messaging |
| `signal` | Signal | Messaging |
| `teams` | Microsoft Teams | Messaging |
| `googlechat` | Google Chat | Messaging |
| `zoom` | Zoom Chat | Messaging |
| `line` | Line | Messaging |
| `kakaotalk` | KakaoTalk | Messaging |
| `github` | GitHub | Collaboration & Productivity |
| `notion` | Notion | Collaboration & Productivity |
| `gitlab` | GitLab | Collaboration & Productivity |
| `jira` | Jira / Confluence | Collaboration & Productivity |
| `asana` | Asana | Collaboration & Productivity |
| `evernote` | Evernote | Collaboration & Productivity |
| `trello` | Trello | Collaboration & Productivity |
| `figma` | Figma | Collaboration & Productivity |
| `medium` | Medium | Content Platforms |
| `devto` | Dev.to | Content Platforms |
| `substack` | Substack | Content Platforms |
| `outlook` | Outlook | Email |
| `gmail` | Gmail | Email |
| `feedly` | Feedly / RSS | RSS / Readers |
| `stackoverflow` | Stack Overflow | Developer Tools |
| `vscode` | VS Code | Developer Tools |
| `jetbrains` | JetBrains IDEs | Developer Tools |

Use these IDs in URLs, API parameters, preferences, tests, and documentation.
`twitter` is the canonical ID for the X/Twitter platform; `x` is a display
name alias, not a second platform ID.

## Frame and theme scopes

The product inventory and the frame implementation are related but not
identical scopes:

- `src/public/platform-frames.js` contains 46 concrete frame templates: all 43
  canonical product IDs plus the frame-only IDs `matrix`, `sms`, and `twitch`.
  Its `generic` entry is a fallback template and is not a platform ID.
- `src/platform-frames.config.ts` and its browser mirror
  `src/public/platform-frames-config.js` currently describe 23 centrally
  routed frame configurations. Other canonical platforms continue through
  the legacy renderer until they are migrated.
- `src/public/frames-theme.css` contains platform-specific stylesheet aliases
  for the frame/theme implementations that need them. It is not a second
  product inventory; frames without a dedicated alias use the generic
  `--frame-*` runtime tokens.

The seven-platform screenshots and the seven namespaces in the original theme
verification report are representative verification scopes. They must not be
described as the complete VISTA platform inventory.
