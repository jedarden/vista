# Platform Context Frame Structure Guide

This guide explains the structure and patterns for implementing platform context frames in Vista. Context frames provide the visual chrome and layout that shows how a link preview appears within different platforms.

## Overview

Each platform in Vista has a **frame configuration** that determines how link previews are rendered. Frames consist of:

- **Chrome HTML**: The platform UI surrounding the link (headers, sidebars, navigation)
- **Neutral Content**: The user's contribution (what "you" would post/share)
- **Theme Variables**: CSS custom properties for dark/light mode theming
- **Frame Type**: Category that determines the rendering approach

## Frame Type Categories

Platforms are categorized into 11 frame types based on their UI patterns:

### Social Feed (`social-feed`)
Platforms with card-based feeds where users post links with context.
- **Examples**: Twitter (X), Facebook, LinkedIn, Threads, Mastodon, Bluesky
- **Layout**: Vertical feed with cards showing avatar, name, timestamp, link preview
- **Aspect Ratio**: `1.91:1` (landscape social standard)

### Messaging (`messaging`)
Chat and messaging platforms where links are shared in conversations.
- **Examples**: Slack, Discord, WhatsApp, iMessage, Telegram, Signal, Teams, Google Chat
- **Layout**: Message bubbles with avatars, names, timestamps, link embeds
- **Aspect Ratio**: `variable` (flexible height)

### Email (`email`)
Email clients where links are shared in message bodies.
- **Examples**: Gmail, Outlook
- **Layout**: Message headers, subject lines, link preview cards
- **Aspect Ratio**: `variable` (flexible height)

### Collaboration (`collaboration`)
Developer tools and team collaboration platforms.
- **Examples**: GitHub, GitLab, Notion, Jira, Figma, Trello, Asana
- **Layout**: Context-specific (issues, PRs, documents, tasks)
- **Aspect Ratio**: `variable` (depends on content)

### Content Feed (`content-feed`)
Content platforms with articles, blog posts, and long-form content.
- **Examples**: Medium, Dev.to, Substack, Tumblr
- **Layout**: Article cards with authors, titles, tags, engagement metrics
- **Aspect Ratio**: `variable` (flexible height)

### Video Platform (`video-platform`)
Video-focused platforms with thumbnails and video embeds.
- **Examples**: YouTube (16:9), TikTok (9:16 portrait)
- **Layout**: Video thumbnails, titles, channel info, view counts
- **Aspect Ratio**: `16:9` or `9:16` (platform-specific)

### Image Focused (`image-focused`)
Image-centric platforms where the link preview IS the main content.
- **Examples**: Instagram (1:1 square), Pinterest (2:3 portrait)
- **Layout**: Image-focused cards with minimal chrome
- **Aspect Ratio**: `1:1` or `2:3` (platform-specific)
- **Note**: `neutralContent` is empty - link preview is the main content

### RSS Reader (`rss-reader`)
RSS readers and feed aggregators.
- **Examples**: Feedly
- **Layout**: Feed items with source icons, titles, summaries
- **Aspect Ratio**: `variable` (flexible height)

### Search Results (`search-results`)
Search engine results pages.
- **Examples**: Google Search
- **Layout**: Minimalist results with titles, descriptions, URL breadcrumbs
- **Aspect Ratio**: `variable` (flexible height)
- **Note**: Usually no theme support (search results have fixed styling)

### Q&A Forum (`qa-forum`)
Question and answer forums with voting and answers.
- **Examples**: Stack Overflow
- **Layout**: Questions with tags, votes, answer counts, author info
- **Aspect Ratio**: `variable` (flexible height)

### Link Aggregator (`link-aggregator`)
Community-driven link aggregation platforms.
- **Examples**: Reddit, Hacker News, Product Hunt
- **Layout**: Compact list items with upvotes, comments, domains
- **Aspect Ratio**: `variable` or `1.91:1` (depends on platform)

## Configuration Structure

Each platform is configured in `src/platform-frames.config.ts`:

```typescript
{
  id: 'twitter',                    // Platform ID (matches scorer.js)
  name: 'X (Twitter)',              // Display name
  sourceCategory: 'Social & Microblogging',  // From scorer.js
  frameType: 'social-feed',         // Frame type category
  hasThemeSupport: true,            // Dark/light mode support
  aspectRatio: '1.91:1',            // Preferred aspect ratio
  structure: {                       // Frame requirements
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: true,
    usesCardLayout: true,
  },
  placeholderFrame: {               // Temporary/stub data
    isStub: true,
    implementationNotes: '...',
  }
}
```

## Template Syntax

Frame templates use `{{placeholder}}` syntax for dynamic content insertion:

### Standard Placeholders
- `{{title}}` - Page title
- `{{description}}` - Page description
- `{{image}}` - Page image URL
- `{{domain}}` - Domain/hostname
- `{{site}}` - Site name
- `{{author}}` - Author name
- `{{timeAgo}}` - Time ago string (e.g., "2h")
- `{{themeColor}}` - Theme accent color

### Platform-Specific Placeholders
- **Reddit**: `{{subreddit}}`, `{{upvotes}}`
- **GitHub**: `{{issueNumber}}`, `{{repo}}`
- **Hacker News**: `{{points}}`, `{{comments}}`
- **Stack Overflow**: `{{votes}}`, `{{answers}}`, `{{tags}}`

### Composite Placeholders
- `{{linkPreview}}` - Complete link preview card
- `{{linkCard}}` - Link card with image, title, description
- `{{cardContent}}` - Card content area
- `{{userMessage}}` - User's message/contribution
- `{{userComment}}` - User's comment
- `{{userCard}}` - User profile card
- `{{userArticle}}` - User's article/post

## Theme Variables

Each frame defines CSS custom properties for both dark and light themes:

```typescript
{
  dark: {
    '--frame-bg': '#000000',
    '--frame-surface': '#16181c',
    '--frame-border': '#2f3336',
    '--frame-text-primary': '#e7e9ea',
    '--frame-text-secondary': '#71767b',
    '--frame-accent': '#1d9bf0',
    // ... more variables
  },
  light: {
    '--frame-bg': '#ffffff',
    '--frame-surface': '#f7f9f9',
    '--frame-border': '#eff3f4',
    '--frame-text-primary': '#0f1419',
    '--frame-text-secondary': '#536471',
    '--frame-accent': '#1d9bf0',
    // ... more variables
  }
}
```

## Implementation Workflow

### 1. Add Configuration
Add your platform to `src/platform-frames.config.ts`:

```typescript
mysite: {
  id: 'mysite',
  name: 'My Site',
  sourceCategory: 'Social & Microblogging',
  frameType: 'social-feed',
  hasThemeSupport: true,
  aspectRatio: '1.91:1',
  structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
  placeholderFrame: {
    isStub: true,
    implementationNotes: 'Describe the platform layout',
  },
}
```

### 2. Choose Frame Type
Select the appropriate frame type based on the platform's UI pattern. If unsure, use `social-feed` as a default for social platforms.

### 3. Determine Aspect Ratio
Choose the most common aspect ratio for link previews on the platform:
- `1:1` - Square (Instagram)
- `1.91:1` - Landscape social (Twitter, Facebook, LinkedIn)
- `16:9` - Widescreen (YouTube)
- `9:16` - Portrait (TikTok)
- `2:3` - Portrait (Pinterest)
- `variable` - Flexible height (most platforms)

### 4. Implement Chrome Template
Create the HTML chrome template that shows the platform UI:

```html
<div class="mysite-frame">
  <div class="mysite-header">
    <div class="mysite-logo">{{site}}</div>
    <div class="mysite-nav">...</div>
  </div>
  <div class="mysite-content">
    {{userMessage}}
    {{linkPreview}}
  </div>
</div>
```

### 5. Implement Neutral Content
Create the template for the user's contribution:

```html
<div class="user-post">
  <div class="user-avatar">
    <img src="{{userAvatar}}" alt="{{author}}" />
  </div>
  <div class="user-content">
    <div class="user-name">{{author}}</div>
    <div class="user-text">{{userMessage}}</div>
    <div class="user-time">{{timeAgo}}</div>
  </div>
</div>
```

### 6. Define Theme Variables
Create CSS custom properties for both dark and light themes:

```typescript
themeVars: {
  dark: {
    '--frame-bg': '#000000',
    '--frame-surface': '#0d0d0d',
    // ... all required variables
  },
  light: {
    '--frame-bg': '#ffffff',
    '--frame-surface': '#f0f0f0',
    // ... all required variables
  }
}
```

## Validation

The configuration includes validation utilities in `src/utils/platform-frames-validator.ts`:

```typescript
import { validateAllConfigs, getConfigStats } from './utils/platform-frames-validator';

// Validate all configurations
const result = validateAllConfigs();
console.log(result.valid ? 'Valid!' : 'Errors:', result.errors);

// Get statistics
const stats = getConfigStats();
console.log(`Total platforms: ${stats.totalPlatforms}`);
console.log(`With theme support: ${stats.platformsWithThemeSupport}`);
```

## Testing

When implementing a new platform frame:

1. **Start with a stub**: Add the configuration with `isStub: true`
2. **Test with sample data**: Use the Vista dev tools to preview the frame
3. **Verify theme switching**: Ensure dark/light modes work correctly
4. **Check responsiveness**: Test at different viewport sizes
5. **Validate against real platform**: Compare with actual platform screenshots

## Common Patterns

### Social Feed Pattern
```html
<div class="feed">
  <div class="post">
    <div class="post-header">
      <img src="{{userAvatar}}" class="avatar" />
      <div class="user-info">
        <div class="user-name">{{author}}</div>
        <div class="user-handle">@{{handle}}</div>
      </div>
      <div class="timestamp">{{timeAgo}}</div>
    </div>
    <div class="post-content">
      {{userMessage}}
      {{linkPreview}}
    </div>
  </div>
</div>
```

### Messaging Pattern
```html
<div class="chat">
  <div class="message">
    <img src="{{avatar}}" class="avatar" />
    <div class="message-content">
      <div class="message-header">
        <span class="author">{{author}}</span>
        <span class="time">{{timeAgo}}</span>
      </div>
      <div class="message-body">
        {{userMessage}}
        {{linkPreview}}
      </div>
    </div>
  </div>
</div>
```

### Link Aggregator Pattern
```html
<div class="link-list">
  <div class="link-item">
    <div class="upvotes">{{points}}</div>
    <div class="link-details">
      <a href="{{url}}" class="link-title">{{title}}</a>
      <div class="link-meta">
        <span class="domain">{{domain}}</span>
        <span class="time">{{timeAgo}}</span>
      </div>
    </div>
  </div>
</div>
```

## File Structure

```
src/
├── platform-frames.config.ts           # All platform configurations
├── types/
│   ├── platform-frames.d.ts           # Type definitions for frame API
│   └── platform-frames-config.ts      # Type definitions for config system
└── utils/
    └── platform-frames-validator.ts   # Validation utilities
```

## Contributing

When adding a new platform frame:

1. **Check existing platforms**: Look for similar platforms to use as a template
2. **Follow the pattern**: Use the appropriate frame type for the platform's UI
3. **Add tests**: Include tests for the new configuration
4. **Update documentation**: Add any platform-specific notes to this guide
5. **Validate**: Run validation utilities to ensure correctness

## Resources

- **Platform Frames API**: See `src/types/platform-frames.d.ts` for full API reference
- **Configuration Validator**: See `src/utils/platform-frames-validator.ts` for validation functions
- **Example Configurations**: See `src/platform-frames.config.ts` for all platform examples
