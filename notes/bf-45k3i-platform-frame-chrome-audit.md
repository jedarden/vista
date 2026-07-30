# Platform Frame Chrome Elements Audit

## Overview

This document catalogs all chrome styling elements across the 7 core platform frame components that require theme styling integration.

## Platform Frames Catalog

### 1. Twitter/X Platform Frame (`twitter-frame.html`)

**Chrome Elements:**
- **Header Chrome**
  - `.twitter-header` - Navigation header with logo and tabs
  - `.twitter-logo` - Platform logo container
  - `.twitter-nav-tabs` - Navigation tab container
  - `.twitter-nav-tab` - Individual navigation tabs (For you/Following)
  
- **Tweet Container Chrome**
  - `.tweet-container` - Individual tweet wrapper
  - `.tweet-avatar` - User avatar with border styling
  - `.tweet-verified-badge` - Verification badge
  - `.tweet-more-options` - Options menu button
  
- **Content Chrome**
  - `.tweet-text` - Tweet content text
  - `.tweet-image` - Image container with border
  - `.tweet-image-placeholder` - Placeholder gradient background
  - `.tweet-link-card` - Link preview card
  - `.quoted-tweet` - Embedded quoted tweet
  - `.tweet-poll` - Poll container
  - `.poll-option` - Individual poll options with progress bars
  
- **Action Chrome**
  - `.tweet-actions` - Action buttons container
  - `.tweet-action` - Individual action buttons (reply, retweet, like, view)
  - `.tweet-stats` - Stats display section
  - `.theme-toggle-btn` - Theme toggle button

**Theme Variables:**
- `--twitter-bg`, `--twitter-surface`, `--twitter-border`
- `--twitter-text-primary`, `--twitter-text-secondary`
- `--twitter-accent`, `--twitter-blue`, `--twitter-pink`, `--twitter-green`
- `--x-avatar-bg`, `--x-avatar-border`
- `--x-placeholder-bg`, `--x-placeholder-gradient`
- `--x-hover-bg`, `--x-link-card-hover-border`

---

### 2. Reddit Platform Frame (`reddit-frame.html`)

**Chrome Elements:**
- **Header Chrome**
  - `.reddit-header` - Header with logo and search
  - `.reddit-logo` - Platform logo
  - `.reddit-search-bar` - Search input styling

- **Post Chrome**
  - `.reddit-post` - Post container with border
  - `.reddit-voting-section` - Vote column
  - `.reddit-vote-btn` - Upvote/downvote buttons
  - `.reddit-vote-count` - Vote count display
  - `.reddit-post-content` - Main content area
  - `.reddit-post-header` - Post metadata header
  - `.reddit-post-title` - Post title
  - `.reddit-post-tags` - Tag/flair container

- **User Card Chrome**
  - `.reddit-user-card` - User profile card
  - `.reddit-user-avatar` - Avatar with gradient
  - `.reddit-join-btn` - Follow button

- **Comments Chrome**
  - `.reddit-comments-section` - Comments container
  - `.reddit-comments-header` - Comments section header
  - `.reddit-comment` - Individual comment
  - `.reddit-comment-avatar` - Comment avatar
  - `.reddit-comment-actions` - Comment action buttons

- **Footer Chrome**
  - `.reddit-footer-chrome` - Footer container
  - `.reddit-footer-content` - Footer content

**Theme Variables:**
- `--color-reddit-dark-bg`, `--color-reddit-light-bg`
- `--color-reddit-dark-surface`, `--color-reddit-light-surface`
- `--color-reddit-dark-border`, `--color-reddit-light-border`
- `--color-reddit-dark-text-primary`, `--color-reddit-light-text-primary`
- `--color-reddit-orange`, `--color-reddit-blue`

---

### 3. GitHub Issue Platform Frame (`github-issue-frame.html`)

**Chrome Elements:**
- **Issue Header Chrome**
  - `.gh-issue-header` - Issue header container
  - `.gh-issue-meta` - Metadata row
  - `.gh-issue-number` - Issue number display
  - `.gh-issue-status` - Status badge (open/closed)
  - `.gh-issue-title` - Issue title
  - `.gh-issue-author` - Author info row
  - `.gh-avatar` - Avatar with gradient

- **Comments Chrome**
  - `.gh-comments-list` - Comments container
  - `.gh-comment` - Individual comment
  - `.gh-comment-avatar` - Comment avatar
  - `.gh-comment-badge` - Role badge (Owner/Contributor)
  - `.gh-comment-body` - Comment content with background
  - `.gh-comment-actions` - Action buttons

- **Code Chrome**
  - `.gh-code-block` - Code block container
  - Syntax highlighting classes (`.gh-code-keyword`, `.gh-code-string`, etc.)

- **Link Preview Chrome**
  - `.gh-link-card` - Link preview card
  - `.gh-link-card-header` - Card header with favicon
  - `.gh-link-card-title` - Link title
  - `.gh-link-card-desc` - Link description

- **Footer Chrome**
  - `.gh-issue-footer` - Footer container
  - `.gh-issue-stats` - Stats display
  - `.theme-toggle` - Theme toggle button

**Theme Variables:**
- `--github-bg`, `--github-surface`, `--github-border`
- `--github-text-primary`, `--github-text-secondary`, `--github-text-muted`
- `--github-accent`, `--github-link-color`
- `--gh-comment-bg`, `--gh-code-bg`, `--gh-surface`

---

### 4. GitHub README Platform Frame (`github-readme-frame.html`)

**Chrome Elements:**
- **README Header Chrome**
  - `.gh-readme-header` - README header
  - `.gh-readme-icon` - File icon
  - `.gh-readme-title` - README title
  - `.gh-readme-meta` - Metadata row (stars, forks, watchers)

- **Content Chrome**
  - `.gh-readme-content` - Main content area
  - `.gh-readme-section-title` - Section headers with bottom border
  - `.gh-readme-text` - Text content
  - `.gh-readme-list` - List styling

- **Code Chrome**
  - `.gh-code-block` - Code block
  - `.gh-code-block-header` - Code block header with copy button
  - `.gh-inline-code` - Inline code styling

- **Link Chrome**
  - `.gh-link-card` - Link preview card
  - `.gh-link-card-favicon` - Favicon placeholder

- **Footer Chrome**
  - `.gh-readme-footer` - Footer with badges
  - `.gh-badge` - License badge

**Theme Variables:**
- Same as GitHub Issue frame
- Additional: `--gh-inline-bg`, `--gh-code-header-bg`

---

### 5. GitLab Issue Platform Frame (`gitlab-issue-frame.html`)

**Chrome Elements:**
- **Issue Header Chrome**
  - `.gl-issue-header` - Issue header
  - `.gl-issue-meta` - Metadata row
  - `.gl-issue-number` - Issue number
  - `.gl-issue-status` - Status badge (open/closed)
  - `.gl-issue-confidential` - Confidential badge
  - `.gl-issue-title` - Issue title
  - `.gl-issue-author` - Author row
  - `.gl-avatar` - Avatar with gradient

- **Discussion Chrome**
  - `.gl-discussion-list` - Discussion container
  - `.gl-comment` - Individual comment
  - `.gl-comment-avatar` - Comment avatar
  - `.gl-comment-badge` - Role badge
  - `.gl-comment-body` - Comment content with background

- **Code Chrome**
  - `.gl-code-block` - Code block
  - Syntax highlighting classes

- **Link Chrome**
  - `.gl-link-card` - Link preview
  - `.gl-link-card-header` - Card header
  - `.gl-link-card-favicon` - Favicon

- **Footer Chrome**
  - `.gl-issue-footer` - Footer container
  - `.gl-issue-stats` - Stats display
  - `.theme-toggle` - Theme toggle

**Theme Variables:**
- `--gitlab-bg`, `--gitlab-surface`, `--gitlab-border`
- `--gitlab-text-primary`, `--gitlab-text-secondary`, `--gitlab-text-muted`
- `--gitlab-accent`, `--gitlab-link-color`
- `--gl-comment-bg`, `--gl-code-bg`, `--gl-surface`

---

### 6. GitLab MR Platform Frame (`gitlab-mr-frame.html`)

**Chrome Elements:**
- **MR Header Chrome**
  - `.gl-mr-header` - MR header
  - `.gl-mr-meta` - Metadata row
  - `.gl-mr-number` - MR number
  - `.gl-mr-status` - Status badge (open/draft/merged)
  - `.gl-mr-title` - MR title
  - `.gl-mr-author` - Author row

- **Discussion Chrome**
  - `.gl-discussion-list` - Discussion container
  - `.gl-comment` - Comments
  - `.gl-comment-avatar` - Comment avatars
  - `.gl-comment-badge` - Badges (Maintainer/Developer)

- **Diff Chrome**
  - `.gl-diff-block` - Diff container
  - `.gl-diff-header` - Diff header
  - `.gl-diff-content` - Diff content
  - `.gl-diff-add` - Added lines (green)
  - `.gl-diff-remove` - Removed lines (red)

- **Link Chrome**
  - `.gl-link-card` - Link preview
  - Similar structure to GitLab Issue

- **Footer Chrome**
  - `.gl-mr-footer` - Footer
  - `.gl-mr-stats` - MR stats

**Theme Variables:**
- Similar to GitLab Issue
- Additional: `--gl-diff-header-bg`, diff coloring variables

---

### 7. TikTok Platform Frame (`tiktok-frame.html`)

**Chrome Elements:**
- **Video Chrome**
  - `.tt-video-container` - Video container (9:16 aspect ratio)
  - `.tt-video-placeholder` - Placeholder with gradient
  - `.tt-play-button` - Play button with shadow
  - `.tt-progress-bar` - Progress bar
  - `.tt-progress-fill` - Progress fill

- **Action Sidebar Chrome**
  - `.tt-right-sidebar` - Right action sidebar
  - `.tt-action-btn` - Action buttons (like, comment, share, save)
  - `.tt-action-icon` - Action icons with text shadow
  - `.tt-action-count` - Action counts with text shadow

- **Bottom Overlay Chrome**
  - `.tt-bottom-overlay` - Bottom overlay with gradient
  - `.tt-user-info` - User info row
  - `.tt-avatar` - User avatar with gradient and border
  - `.tt-username` - Username with verified badge
  - `.tt-caption` - Caption text
  - `.tt-hashtags` - Hashtag styling
  - `.tt-music` - Music info

- **Link Chrome**
  - `.tt-link-card` - Link preview with backdrop filter
  - `.tt-link-card-header` - Card header
  - `.tt-link-card-title` - Link title
  - `.tt-link-card-desc` - Link description

- **Comments Chrome**
  - `.tt-comments-section` - Comments section
  - `.tt-comments-header` - Comments header
  - `.tt-comment` - Individual comment
  - `.tt-comment-avatar` - Comment avatar with gradient
  - `.tt-comment-actions` - Comment action buttons

**Theme Variables:**
- `--color-tiktok-dark-bg`, `--color-tiktok-light-bg`
- `--color-tiktok-dark-surface`, `--color-tiktok-light-surface`
- `--color-tiktok-dark-border`, `--color-tiktok-light-border`
- `--color-tiktok-dark-text-primary`, `--color-tiktok-light-text-primary`
- `--color-tiktok-pink`, `--color-tiktok-cyan`

---

### 8. YouTube Platform Frame (`youtube-frame.html`)

**Chrome Elements:**
- **Video Player Chrome**
  - `.yt-video-player` - Video player (16:9)
  - `.yt-video-thumbnail` - Thumbnail with gradient
  - `.yt-play-button` - Play button (red gradient)
  - `.yt-video-duration` - Duration badge
  - `.yt-video-controls` - Video controls
  - `.yt-progress-container` - Progress bar
  - `.yt-progress-bar` - Progress fill (red)
  - `.yt-controls-row` - Control buttons row
  - `.yt-volume-slider` - Volume control

- **Channel Chrome**
  - `.yt-channel-section` - Channel row
  - `.yt-channel-avatar` - Channel avatar (red gradient)
  - `.yt-channel-name` - Channel name
  - `.yt-subscriber-count` - Subscriber count
  - `.yt-subscribe-btn` - Subscribe button

- **Action Chrome**
  - `.yt-action-buttons` - Action button row
  - `.yt-action-btn` - Individual action buttons

- **Description Chrome**
  - `.yt-description-section` - Description container with background
  - `.yt-description-text` - Description text
  - `.yt-description-meta` - Description metadata

- **Link Chrome**
  - `.yt-link-preview` - Link preview card
  - `.yt-link-preview-image` - Thumbnail
  - `.yt-link-preview-content` - Link content
  - `.yt-link-preview-title` - Link title
  - `.yt-link-preview-meta` - Link metadata

- **Comments Chrome**
  - `.yt-comments-section` - Comments section
  - `.yt-comments-header` - Comments header
  - `.yt-comment` - Individual comment
  - `.yt-comment-avatar` - Comment avatar
  - `.yt-comment-actions` - Comment action buttons

**Theme Variables:**
- `--youtube-bg`, `--youtube-surface`, `--youtube-border`
- `--youtube-text-primary`, `--youtube-text-secondary`, `--youtube-text-muted`
- `--color-youtube-red`, `--color-youtube-red-dark`
- `--color-youtube-link`, `--color-youtube-link-blue`

---

## Common Chrome Patterns Across Platforms

### Universal Elements
1. **Container Chrome**
   - `.context-frame` - Base container class
   - `.chrome-container` - Chrome wrapper
   - `.chrome-theme-transition` - Theme transition class

2. **Avatar Systems**
   - All platforms use circular avatars with platform-specific gradients
   - Border styling varies by platform (Twitter/X has distinct borders)

3. **Badge Chrome**
   - Status badges (open/closed, draft, etc.)
   - Role badges (Owner, Maintainer, Developer)
   - Verification badges

4. **Link Preview Cards**
   - Consistent structure across platforms
   - Platform-specific styling for headers, titles, descriptions
   - Placeholder gradients for missing images

5. **Action Buttons**
   - Platform-specific color schemes
   - Hover state transitions
   - Icon + text combinations

6. **Footer Chrome**
   - Stats displays
   - Theme toggle buttons
   - Platform-specific metadata

### Theme Integration Points

All platform frames require theme styling for:
- **Background colors**: Primary, surface, elevated levels
- **Border colors**: Default, hover, focus states
- **Text colors**: Primary, secondary, muted levels
- **Accent colors**: Platform-specific branding colors
- **Hover states**: Background and border transitions
- **Shadows**: Platform-specific depth levels
- **Gradients**: Avatar placeholders, image placeholders
- **Transitions**: Smooth theme switching (0.2s ease)

## Styling Approach Summary

### Current Implementation
- **CSS Variables**: Comprehensive use of CSS custom properties for theming
- **Inline Styles**: Each frame has extensive inline styles for platform-specific details
- **Shared CSS**: `frames-theme.css`, `platform-chrome-styles.css`, `social-platforms-frames.css`
- **Theme Classes**: `[data-theme="light"]` selectors for light mode variants

### Chrome Element Categories
1. **Headers**: Navigation, branding, search
2. **Avatars**: User/profile images with platform styling
3. **Badges**: Status, role, verification indicators
4. **Cards**: Link previews, embedded content
5. **Actions**: Buttons, interactions, stats
6. **Footers**: Metadata, stats, controls
7. **Comments**: Discussion threads with avatars
8. **Code**: Syntax highlighting, code blocks
9. **Media**: Video players, images, thumbnails
10. **Overlays**: Gradients, backdrop filters, shadows

## Notes

- All frames support dark/light theme switching via `data-theme` attribute
- Theme transitions are set to 0.2s ease across all platforms
- Platform-specific accent colors are maintained in themed variants
- Some platforms (Twitter/X, TikTok) use more complex gradient systems
- Code syntax highlighting is platform-specific (GitHub vs GitLab)
- Video platforms (TikTok, YouTube) have unique overlay and control styling
- All platforms implement responsive design for mobile breakpoints