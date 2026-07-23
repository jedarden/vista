'use strict';

/**
 * Platform Context Frames Architecture
 *
 * This module provides a standardized data structure for platform context frames
 * and helper functions to generate them programmatically.
 *
 * A platform frame consists of:
 * - chrome: The UI chrome (header, sidebar, navigation, etc.)
 * - neutralContent: Generic placeholder content (fake posts, messages, etc.)
 * - themeVars: CSS custom properties for dark/light mode theming
 *
 * Adding a new platform frame:
 * 1. Add an entry to PLATFORM_FRAMES with the platform ID as key
 * 2. Define chrome HTML template with {{placeholder}} markers for dynamic content
 * 3. Define neutralContent HTML template (generic post/message placeholders)
 * 4. Define themeVars with CSS custom properties for dark/light modes
 * 5. Add corresponding CSS classes to style.css for .{platform}-context
 */

// ============================================================================
// DATA STRUCTURE
// ============================================================================

/**
 * CSS variable names that should be defined per platform/theme
 * Used for consistent theming across all platform frames
 */
const THEME_VAR_NAMES = [
  '--frame-bg',           // Frame background color
  '--frame-surface',      // Surface/card background color
  '--frame-border',       // Border color
  '--frame-text-primary', // Primary text color
  '--frame-text-secondary', // Secondary text color
  '--frame-text-muted',   // Muted/disabled text color
  '--frame-accent',       // Accent/brand color
  '--frame-accent-bg',    // Accent background color
  '--frame-link-color',   // Link color
  '--frame-divider',      // Divider line color
  '--frame-input-bg',     // Input background color
  '--frame-overlay',      // Overlay/shadow color
];

/**
 * Platform frame definitions
 *
 * Each platform has:
 * - name: Display name
 * - category: Platform category (social, messaging, collaboration, content, email, rss)
 * - hasThemeSupport: Whether the platform supports dark/light mode toggle
 * - aspectRatio: Preferred card aspect ratio (for context frame sizing)
 * - chrome: HTML template for the platform UI chrome (surrounds the link preview)
 * - neutralContent: HTML template for neutral placeholder content
 * - themeVars: CSS custom properties for dark and light modes
 */
const PLATFORM_FRAMES = {
  // Social & Microblogging
  google: {
    name: 'Google Search',
    category: 'social',
    hasThemeSupport: false,
    aspectRatio: 'variable',
    chrome: `
      <div class="google-search-bar">
        <span class="search-icon">🔍</span>
        <span class="search-text">Search...</span>
      </div>
      <div class="google-results">
        {{mainResult}}
        <div class="google-result-item google-result-dim">
          <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">Another result</span></div>
          <div class="google-title">Related Search Result</div>
        </div>
        <div class="google-result-item google-result-dim">
          <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">More results</span></div>
          <div class="google-title">Additional Result Link</div>
        </div>
      </div>
    `,
    neutralContent: `
      <div class="google-result-item">
        <div class="google-breadcrumb">
          <span class="google-favicon">🌐</span>
          <span class="google-domain">{{domain}}</span>
        </div>
        <div class="google-title">{{title}}</div>
        <div class="google-desc">{{description}}</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#202124',
        '--frame-surface': '#303134',
        '--frame-border': '#5f6368',
        '--frame-text-primary': '#bdc1c6',
        '--frame-text-secondary': '#9aa0a6',
        '--frame-text-muted': '#5f6368',
        '--frame-accent': '#8ab4f8',
        '--frame-accent-bg': '#1a73e8',
        '--frame-link-color': '#8ab4f8',
        '--frame-divider': '#3c4043',
        '--frame-input-bg': '#303134',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f1f3f4',
        '--frame-border': '#dadce0',
        '--frame-text-primary': '#202124',
        '--frame-text-secondary': '#5f6368',
        '--frame-text-muted': '#9aa0a6',
        '--frame-accent': '#1a73e8',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#1a73e8',
        '--frame-divider': '#dadce0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  facebook: {
    name: 'Facebook',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="fb-post-header">
        <div class="fb-avatar"></div>
        <div class="fb-post-meta">
          <span class="fb-author-name">Jane Smith</span>
          <span class="fb-post-time">2h · 🌍</span>
        </div>
        <span class="fb-menu">•••</span>
      </div>
      <div class="fb-post-content">Check out this interesting article!</div>
      {{linkPreview}}
      <div class="fb-post-stats">👍 24 · 💬 8 · 🔗 5</div>
    `,
    neutralContent: '', // No neutral content needed - link preview is the main content
    themeVars: {
      dark: {
        '--frame-bg': '#242526',
        '--frame-surface': '#3a3b3c',
        '--frame-border': '#3e4042',
        '--frame-text-primary': '#e4e6eb',
        '--frame-text-secondary': '#b0b3b8',
        '--frame-text-muted': '#65676b',
        '--frame-accent': '#2d88ff',
        '--frame-accent-bg': '#2d88ff',
        '--frame-link-color': '#2d88ff',
        '--frame-divider': '#3e4042',
        '--frame-input-bg': '#3a3b3c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f0f2f5',
        '--frame-border': '#ced0d4',
        '--frame-text-primary': '#050505',
        '--frame-text-secondary': '#65676b',
        '--frame-text-muted': '#b0b3b8',
        '--frame-accent': '#1877f2',
        '--frame-accent-bg': '#e7f3ff',
        '--frame-link-color': '#1877f2',
        '--frame-divider': '#ced0d4',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  twitter: {
    name: 'X (Twitter)',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="tw-post-header">
        <div class="tw-avatar"></div>
        <div class="tw-post-meta">
          <span class="tw-author-name">Alex Johnson</span>
          <span class="tw-author-handle">@alexj</span>
          <span class="tw-post-time">· 2h</span>
        </div>
        <span class="tw-verified">✓</span>
      </div>
      <div class="tw-post-content">You have to see this! 🔗</div>
      {{linkCard}}
      <div class="tw-post-actions">💬 12 · 🔁 34 · ❤️ 128</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#16181c',
        '--frame-border': '#2f3336',
        '--frame-text-primary': '#e7e9ea',
        '--frame-text-secondary': '#71767b',
        '--frame-text-muted': '#71767b',
        '--frame-accent': '#1d9bf0',
        '--frame-accent-bg': '#1d9bf0',
        '--frame-link-color': '#1d9bf0',
        '--frame-divider': '#2f3336',
        '--frame-input-bg': '#202327',
        '--frame-overlay': 'rgba(91, 112, 131, 0.4)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f7f9f9',
        '--frame-border': '#eff3f4',
        '--frame-text-primary': '#0f1419',
        '--frame-text-secondary': '#536471',
        '--frame-text-muted': '#536471',
        '--frame-accent': '#1d9bf0',
        '--frame-accent-bg': '#e8f5fe',
        '--frame-link-color': '#1d9bf0',
        '--frame-divider': '#eff3f4',
        '--frame-input-bg': '#eff3f4',
        '--frame-overlay': 'rgba(0, 0, 0, 0.08)',
      },
    },
  },

  linkedin: {
    name: 'LinkedIn',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="li-post-header">
        <div class="li-avatar"></div>
        <div class="li-post-meta">
          <span class="li-author-name">Sarah Chen</span>
          <span class="li-post-headline">Product Manager at Tech Corp</span>
          <span class="li-post-time">2h · 🌐</span>
        </div>
      </div>
      <div class="li-post-content">Great article on industry trends!</div>
      {{linkPreview}}
      <div class="li-post-stats">👍 45 · 💬 12 · 🔁 8</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#1a1a1b',
        '--frame-border': '#2d2d2d',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a8b3ba',
        '--frame-text-muted': '#666666',
        '--frame-accent': '#0a66c2',
        '--frame-accent-bg': '#0a66c2',
        '--frame-link-color': '#0a66c2',
        '--frame-divider': '#2d2d2d',
        '--frame-input-bg': '#1a1a1b',
        '--frame-overlay': 'rgba(0, 0, 0, 0.7)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f3f5f7',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#0a66c2',
        '--frame-accent-bg': '#e0f1ff',
        '--frame-link-color': '#0a66c2',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  instagram: {
    name: 'Instagram',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1:1',
    chrome: `
      <div class="ig-post-header">
        <div class="ig-avatar"></div>
        <div class="ig-post-meta">
          <span class="ig-username">travel_photographer</span>
          <span class="ig-post-time">2 hours ago</span>
        </div>
        <span class="ig-menu">•••</span>
      </div>
      {{linkPreview}}
      <div class="ig-post-content">
        <div class="ig-caption">Check out this amazing view! 📸</div>
        <div class="ig-hashtags">#travel #photography #adventure</div>
      </div>
      <div class="ig-post-actions">♡ 124 · 💬 18 · 🔗 Share</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#121212',
        '--frame-border': '#262626',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a8a8a8',
        '--frame-text-muted': '#737373',
        '--frame-accent': '#e1306c',
        '--frame-accent-bg': '#e1306c',
        '--frame-link-color': '#0095f6',
        '--frame-divider': '#262626',
        '--frame-input-bg': '#262626',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#fafafa',
        '--frame-border': '#dbdbdb',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#737373',
        '--frame-text-muted': '#a8a8a8',
        '--frame-accent': '#e1306c',
        '--frame-accent-bg': '#fce4ec',
        '--frame-link-color': '#0095f6',
        '--frame-divider': '#dbdbdb',
        '--frame-input-bg': '#fafafa',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  youtube: {
    name: 'YouTube',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '16:9',
    chrome: `
      <div class="yt-video-header">
        <div class="yt-channel-avatar"></div>
        <div class="yt-channel-meta">
          <span class="yt-channel-name">TechChannel</span>
          <span class="yt-subscriber-count">1.2M subscribers</span>
        </div>
        <button class="yt-subscribe-btn">Subscribe</button>
      </div>
      <div class="yt-video-title">Amazing Tutorial - Learn in 10 Minutes!</div>
      <div class="yt-video-stats">234K views · 3 hours ago</div>
      <div class="yt-comments-section">
        <div class="yt-comment-header">Comments</div>
        <div class="yt-comment yt-comment-dim">
          <div class="yt-comment-avatar"></div>
          <div class="yt-comment-meta">
            <span class="yt-comment-author">User123</span>
            <span class="yt-comment-time">2 hours ago</span>
            <div class="yt-comment-text">This was really helpful, thanks!</div>
            <div class="yt-comment-actions">👍 45 · 💬 Reply</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="yt-comment">
        <div class="yt-comment-avatar"></div>
        <div class="yt-comment-meta">
          <span class="yt-comment-author">You</span>
          <span class="yt-comment-time">Just now</span>
          <div class="yt-comment-text">{{description}}</div>
          <div class="yt-comment-actions">👍 0 · 💬 Reply</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#0f0f0f',
        '--frame-surface': '#1a1a1a',
        '--frame-border': '#303030',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#aaaaaa',
        '--frame-text-muted': '#666666',
        '--frame-accent': '#ff0000',
        '--frame-accent-bg': '#ff0000',
        '--frame-link-color': '#3ea6ff',
        '--frame-divider': '#303030',
        '--frame-input-bg': '#1a1a1a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.7)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#e5e5e5',
        '--frame-text-primary': '#0f0f0f',
        '--frame-text-secondary': '#606060',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#ff0000',
        '--frame-accent-bg': '#ffe5e5',
        '--frame-link-color': '#065fd4',
        '--frame-divider': '#e5e5e5',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  slack: {
    name: 'Slack',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="slack-sidebar">
        <div class="slack-workspace">Acme Co</div>
        <div class="slack-channel"># general</div>
        <div class="slack-channel"># random</div>
      </div>
      <div class="slack-main">
        <div class="slack-channel-header"># general</div>
        <div class="slack-messages">
          <div class="slack-message slack-message-dim">
            <div class="slack-msg-avatar"></div>
            <div class="slack-msg-content">
              <span class="slack-msg-author">Mike</span>
              <span class="slack-msg-time">10:30 AM</span>
              <p>Has anyone seen this?</p>
            </div>
          </div>
          {{userMessage}}
        </div>
      </div>
    `,
    neutralContent: `
      <div class="slack-message">
        <div class="slack-msg-avatar"></div>
        <div class="slack-msg-content">
          <span class="slack-msg-author">You</span>
          <span class="slack-msg-time">10:32 AM</span>
          <div class="slack-link-preview">
            <div class="slack-site">{{site}}</div>
            <div class="slack-title">{{title}}</div>
            <div class="slack-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1d23',
        '--frame-surface': '#23262c',
        '--frame-border': '#3a3d44',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#b0b0b0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#2ac7de',
        '--frame-accent-bg': '#2ac7de',
        '--frame-link-color': '#2ac7de',
        '--frame-divider': '#3a3d44',
        '--frame-input-bg': '#23262c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#616061',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#2ac7de',
        '--frame-accent-bg': '#e0f7fa',
        '--frame-link-color': '#2ac7de',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  discord: {
    name: 'Discord',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="discord-sidebar">
        <div class="discord-server">Gaming Hub</div>
        <div class="discord-channel"># general</div>
        <div class="discord-channel"># off-topic</div>
      </div>
      <div class="discord-main">
        <div class="discord-channel-header"># general</div>
        <div class="discord-messages">
          <div class="discord-message discord-message-dim">
            <div class="discord-msg-avatar"></div>
            <div class="discord-msg-content">
              <span class="discord-msg-author">GameMaster</span>
              <span class="discord-msg-time">Today at 10:30 AM</span>
              <p>Check this out everyone!</p>
            </div>
          </div>
          {{userMessage}}
        </div>
      </div>
    `,
    neutralContent: `
      <div class="discord-message">
        <div class="discord-msg-avatar"></div>
        <div class="discord-msg-content">
          <span class="discord-msg-author">You</span>
          <span class="discord-msg-time">Today at 10:31 AM</span>
          <div class="discord-link-preview" style="border-left-color:{{themeColor}}">
            {{siteSection}}
            <div class="discord-title">{{title}}</div>
            <div class="discord-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#313338',
        '--frame-surface': '#2b2d31',
        '--frame-border': '#3f4147',
        '--frame-text-primary': '#dbdee1',
        '--frame-text-secondary': '#949ba4',
        '--frame-text-muted': '#4e5058',
        '--frame-accent': '#5865f2',
        '--frame-accent-bg': '#5865f2',
        '--frame-link-color': '#00a8fc',
        '--frame-divider': '#3f4147',
        '--frame-input-bg': '#383a40',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f2f3f5',
        '--frame-border': '#e3e5e8',
        '--frame-text-primary': '#060607',
        '--frame-text-secondary': '#4e5058',
        '--frame-text-muted': '#949ba4',
        '--frame-accent': '#5865f2',
        '--frame-accent-bg': '#e8f0ff',
        '--frame-link-color': '#00a8fc',
        '--frame-divider': '#e3e5e8',
        '--frame-input-bg': '#f8f9fa',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Messaging Platforms
  imessage: {
    name: 'iMessage',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="im-chat-header">
        <span class="im-back">‹</span>
        <span class="im-contact-name">John Appleseed</span>
        <span class="im-video">▤</span>
      </div>
      <div class="im-messages">
        <div class="im-message im-message-incoming">
          <div class="im-bubble">Hey! Check this out 👀</div>
        </div>
        <div class="im-message im-message-incoming">
          <div class="im-bubble">This looks really interesting</div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="im-message im-message-outgoing">
        <div class="im-bubble im-bubble-with-link">
          <div class="im-link-preview">
            {{siteSection}}
            <div class="im-title">{{title}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#1c1c1e',
        '--frame-border': '#2c2c2e',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a1a1a6',
        '--frame-text-muted': '#636366',
        '--frame-accent': '#007aff',
        '--frame-accent-bg': '#007aff',
        '--frame-link-color': '#007aff',
        '--frame-divider': '#2c2c2e',
        '--frame-input-bg': '#1c1c1e',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#e5e1e5',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#c6c6c8',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#6e6e73',
        '--frame-text-muted': '#aeaeb2',
        '--frame-accent': '#007aff',
        '--frame-accent-bg': '#e5f1ff',
        '--frame-link-color': '#007aff',
        '--frame-divider': '#d1d1d6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  whatsapp: {
    name: 'WhatsApp',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="wa-chat-header">
        <span class="wa-back">‹</span>
        <span class="wa-contact">Sarah Wilson</span>
        <span class="wa-menu">⋮</span>
      </div>
      <div class="wa-messages">
        <div class="wa-message wa-message-incoming">
          <div class="wa-msg-bubble">Did you see this? 🤔</div>
        </div>
        <div class="wa-message wa-message-incoming">
          <div class="wa-msg-bubble">Thought you might be interested</div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="wa-message">
        <div class="wa-msg-bubble wa-msg-with-link">
          <div class="wa-link-preview">
            {{siteSection}}
            <div class="wa-title">{{title}}</div>
            <div class="wa-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#0b141a',
        '--frame-surface': '#0b141a',
        '--frame-border': '#1f2c34',
        '--frame-text-primary': '#e9edef',
        '--frame-text-secondary': '#8696a0',
        '--frame-text-muted': '#54656f',
        '--frame-accent': '#00a884',
        '--frame-accent-bg': '#00a884',
        '--frame-link-color': '#53bdeb',
        '--frame-divider': '#1f2c34',
        '--frame-input-bg': '#1f2c34',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#efeae2',
        '--frame-surface': '#ffffff',
        '--frame-border': '#d1d7db',
        '--frame-text-primary': '#111b21',
        '--frame-text-secondary': '#54656f',
        '--frame-text-muted': '#8696a0',
        '--frame-accent': '#00a884',
        '--frame-accent-bg': '#dcf8c6',
        '--frame-link-color': '#53bdeb',
        '--frame-divider': '#d1d7db',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  telegram: {
    name: 'Telegram',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="tg-chat-header">
        <span class="tg-back">‹</span>
        <span class="tg-contact">Tech Updates Channel</span>
        <span class="tg-menu">⋮</span>
      </div>
      <div class="tg-messages">
        <div class="tg-message">
          <div class="tg-msg-avatar">TC</div>
          <div class="tg-bubble">
            <p>Breaking news everyone! 📢</p>
          </div>
        </div>
        <div class="tg-message">
          <div class="tg-msg-avatar">TC</div>
          <div class="tg-bubble">
            <p>Check this out</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="tg-message">
        <div class="tg-msg-avatar">Y</div>
        <div class="tg-bubble">
          <p>Thanks for sharing!</p>
          <div class="tg-link-preview">
            {{siteSection}}
            <div class="tg-title">{{title}}</div>
            <div class="tg-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#17212b',
        '--frame-surface': '#0e1621',
        '--frame-border': '#0e1621',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#aaaaaa',
        '--frame-text-muted': '#777777',
        '--frame-accent': '#2b5278',
        '--frame-accent-bg': '#2b5278',
        '--frame-link-color': '#64b5ef',
        '--frame-divider': '#0e1621',
        '--frame-input-bg': '#242f3d',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#3390ec',
        '--frame-accent-bg': '#e0f0ff',
        '--frame-link-color': '#007aff',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  signal: {
    name: 'Signal',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="signal-chat-header">
        <span class="signal-back">‹</span>
        <span class="signal-contact">Alex Chen</span>
        <span class="signal-video">▤</span>
      </div>
      <div class="signal-messages">
        <div class="signal-message">
          <div class="signal-bubble">Have you seen this yet?</div>
          <div class="signal-time">10:30 AM</div>
        </div>
        <div class="signal-message">
          <div class="signal-bubble">Pretty interesting stuff</div>
          <div class="signal-time">10:31 AM</div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="signal-message">
        <div class="signal-bubble">
          <div class="signal-link-preview">
            {{imageSection}}
            <div class="signal-link-meta">
              <div class="signal-title">{{title}}</div>
              {{descriptionSection}}
              <div class="signal-domain">{{domain}}</div>
            </div>
          </div>
        </div>
        <div class="signal-time">Just now</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1c1c1e',
        '--frame-surface': '#2c2c2e',
        '--frame-border': '#3a3a3c',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a1a1a6',
        '--frame-text-muted': '#636366',
        '--frame-accent': '#3a76f0',
        '--frame-accent-bg': '#3a76f0',
        '--frame-link-color': '#0a84ff',
        '--frame-divider': '#3a3a3c',
        '--frame-input-bg': '#2c2c2e',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#f6f6f6',
        '--frame-surface': '#ffffff',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#616161',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#3a76f0',
        '--frame-accent-bg': '#e8f0ff',
        '--frame-link-color': '#007aff',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  teams: {
    name: 'Microsoft Teams',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="ms-chat-header">
        <span class="ms-back">‹</span>
        <span class="ms-channel-name">General</span>
        <span class="ms-participants">24</span>
      </div>
      <div class="ms-messages">
        <div class="ms-message ms-message-incoming">
          <div class="ms-msg-avatar">JD</div>
          <div class="ms-msg-content">
            <span class="ms-msg-author">John Doe</span>
            <span class="ms-msg-time">10:30 AM</span>
            <p>Has anyone seen this resource?</p>
          </div>
        </div>
        <div class="ms-message ms-message-incoming">
          <div class="ms-msg-avatar">AS</div>
          <div class="ms-msg-content">
            <span class="ms-msg-author">Alice Smith</span>
            <span class="ms-msg-time">10:32 AM</span>
            <p>Great find!</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="ms-message">
        <div class="ms-msg-avatar">Y</div>
        <div class="ms-msg-content">
          <span class="ms-msg-author">You</span>
          <span class="ms-msg-time">10:33 AM</span>
          <div class="ms-link-preview">
            {{imageSection}}
            <div class="ms-title">{{title}}</div>
            <div class="ms-desc">{{description}}</div>
            <div class="ms-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1f1f1f',
        '--frame-surface': '#2d2d2d',
        '--frame-border': '#3d3d3d',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#6264a7',
        '--frame-accent-bg': '#6264a7',
        '--frame-link-color': '#6264a7',
        '--frame-divider': '#3d3d3d',
        '--frame-input-bg': '#2d2d2d',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#252423',
        '--frame-text-secondary': '#605e5c',
        '--frame-text-muted': '#979593',
        '--frame-accent': '#6264a7',
        '--frame-accent-bg': '#e8e8f8',
        '--frame-link-color': '#6264a7',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  googlechat: {
    name: 'Google Chat',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="gc-chat-header">
        <span class="gc-back">‹</span>
        <span class="gc-room-name">Project Updates</span>
        <span class="gc-menu">⋮</span>
      </div>
      <div class="gc-messages">
        <div class="gc-message gc-message-incoming">
          <div class="gc-msg-avatar">TM</div>
          <div class="gc-msg-content">
            <span class="gc-msg-author">Team Member</span>
            <span class="gc-msg-time">10:30 AM</span>
            <p>Check this out everyone!</p>
          </div>
        </div>
        <div class="gc-message gc-message-incoming">
          <div class="gc-msg-avatar">PM</div>
          <div class="gc-msg-content">
            <span class="gc-msg-author">Project Lead</span>
            <span class="gc-msg-time">10:31 AM</span>
            <p>This looks useful</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="gc-message">
        <div class="gc-msg-avatar">Y</div>
        <div class="gc-msg-content">
          <span class="gc-msg-author">You</span>
          <span class="gc-msg-time">10:32 AM</span>
          <div class="gc-link-preview">
            {{imageSection}}
            <div class="gc-title">{{title}}</div>
            <div class="gc-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#202124',
        '--frame-surface': '#2d2e30',
        '--frame-border': '#3f4042',
        '--frame-text-primary': '#e8eaed',
        '--frame-text-secondary': '#9aa0a6',
        '--frame-text-muted': '#5f6368',
        '--frame-accent': '#8ab4f8',
        '--frame-accent-bg': '#8ab4f8',
        '--frame-link-color': '#8ab4f8',
        '--frame-divider': '#3f4042',
        '--frame-input-bg': '#2d2e30',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f9fa',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#202124',
        '--frame-text-secondary': '#5f6368',
        '--frame-text-muted': '#9aa0a6',
        '--frame-accent': '#1a73e8',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#1a73e8',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  zoom: {
    name: 'Zoom Chat',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="zm-chat-header">
        <span class="zm-back">‹</span>
        <span class="zm-channel-name">Team Chat</span>
        <span class="zm-menu">⋮</span>
      </div>
      <div class="zm-messages">
        <div class="zm-message zm-message-incoming">
          <div class="zm-msg-avatar">CL</div>
          <div class="zm-msg-content">
            <span class="zm-msg-author">Colleague</span>
            <span class="zm-msg-time">10:30 AM</span>
            <p>Found this helpful resource!</p>
          </div>
        </div>
        <div class="zm-message zm-message-incoming">
          <div class="zm-msg-avatar">TM</div>
          <div class="zm-msg-content">
            <span class="zm-msg-author">Team Mate</span>
            <span class="zm-msg-time">10:31 AM</span>
            <p>Thanks for sharing</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="zm-message">
        <div class="zm-msg-avatar">Y</div>
        <div class="zm-msg-content">
          <span class="zm-msg-author">You</span>
          <span class="zm-msg-time">10:32 AM</span>
          <div class="zm-link-preview">
            {{imageSection}}
            <div class="zm-title">{{title}}</div>
            <div class="zm-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#0d71eb',
        '--frame-accent-bg': '#0d71eb',
        '--frame-link-color': '#0d71eb',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#0d71eb',
        '--frame-accent-bg': '#e8f0ff',
        '--frame-link-color': '#0d71eb',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  line: {
    name: 'Line',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="ln-chat-header">
        <span class="ln-back">‹</span>
        <span class="ln-room-name">Group Chat</span>
        <span class="ln-menu">⋮</span>
      </div>
      <div class="ln-messages">
        <div class="ln-message ln-message-incoming">
          <div class="ln-msg-avatar">F</div>
          <div class="ln-msg-content">
            <span class="ln-msg-author">Friend</span>
            <span class="ln-msg-time">10:30</span>
            <p>Check this out!</p>
          </div>
        </div>
        <div class="ln-message ln-message-incoming">
          <div class="ln-msg-avatar">B</div>
          <div class="ln-msg-content">
            <span class="ln-msg-author">Buddy</span>
            <span class="ln-msg-time">10:31</span>
            <p>Interesting!</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="ln-message">
        <div class="ln-msg-avatar">Y</div>
        <div class="ln-msg-content">
          <span class="ln-msg-author">You</span>
          <span class="ln-msg-time">10:32</span>
          <div class="ln-link-preview">
            {{imageSection}}
            <div class="ln-title">{{title}}</div>
            <div class="ln-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1b1b1b',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#00b900',
        '--frame-accent-bg': '#00b900',
        '--frame-link-color': '#00b900',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f0f0f0',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#00b900',
        '--frame-accent-bg': '#e8f5e9',
        '--frame-link-color': '#00b900',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  kakaotalk: {
    name: 'KakaoTalk',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="kt-chat-header">
        <span class="kt-back">‹</span>
        <span class="kt-room-name">Chat Room</span>
        <span class="kt-menu">⋮</span>
      </div>
      <div class="kt-messages">
        <div class="kt-message kt-message-incoming">
          <div class="kt-msg-avatar">친구</div>
          <div class="kt-msg-content">
            <span class="kt-msg-author">Friend</span>
            <span class="kt-msg-time">10:30</span>
            <p>이거 봐!</p>
          </div>
        </div>
        <div class="kt-message kt-message-incoming">
          <div class="kt-msg-avatar">동료</div>
          <div class="kt-msg-content">
            <span class="kt-msg-author">Colleague</span>
            <span class="kt-msg-time">10:31</span>
            <p>좋아!</p>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="kt-message">
        <div class="kt-msg-avatar">Y</div>
        <div class="kt-msg-content">
          <span class="kt-msg-author">You</span>
          <span class="kt-msg-time">10:32</span>
          <div class="kt-link-preview">
            {{imageSection}}
            <div class="kt-title">{{title}}</div>
            <div class="kt-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#fae000',
        '--frame-accent-bg': '#fae000',
        '--frame-link-color': '#fae000',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#fae000',
        '--frame-accent-bg': '#fff8e0',
        '--frame-link-color': '#fae000',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Video Content
  tiktok: {
    name: 'TikTok',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '9:16',
    chrome: `
      <div class="tt-video-container">
        <div class="tt-video-placeholder"></div>
        <div class="tt-right-sidebar">
          <div class="tt-action-btn">
            <span class="tt-action-icon">♡</span>
            <span class="tt-action-count">24</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">💬</span>
            <span class="tt-action-count">8</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">↗</span>
            <span class="tt-action-count">12</span>
          </div>
        </div>
        <div class="tt-bottom-overlay">
          <div class="tt-username">@tiktok_user</div>
          <div class="tt-caption">Check out this amazing content! 🔗</div>
          <div class="tt-music">🎵 Original Sound - Artist</div>
        </div>
      </div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#121212',
        '--frame-border': '#262626',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a8a8a8',
        '--frame-text-muted': '#737373',
        '--frame-accent': '#ff0050',
        '--frame-accent-bg': '#ff0050',
        '--frame-link-color': '#00f2ea',
        '--frame-divider': '#262626',
        '--frame-input-bg': '#1a1a1a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.7)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e5e5e5',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#e60045',
        '--frame-accent-bg': '#e60045',
        '--frame-link-color': '#00d0cf',
        '--frame-divider': '#e5e5e5',
        '--frame-input-bg': '#f5f5f5',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Visual Discovery
  pinterest: {
    name: 'Pinterest',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '2:3',
    chrome: `
      <div class="pin-card">
        <div class="pin-image-container">
          <div class="pin-image-placeholder"></div>
          <button class="pin-save-btn">Save</button>
        </div>
        <div class="pin-meta">
          <div class="pin-title">Amazing Pin Title</div>
          <div class="pin-desc">Discover this inspiring idea for your next project</div>
          <div class="pin-domain">pinterest.com</div>
        </div>
        <div class="pin-footer">
          <div class="pin-saver">
            <div class="pin-saver-avatar">JP</div>
            <span class="pin-saver-name">Jane Parker</span>
          </div>
        </div>
      </div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#242424',
        '--frame-border': '#333333',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#999999',
        '--frame-text-muted': '#666666',
        '--frame-accent': '#E60023',
        '--frame-accent-bg': '#E60023',
        '--frame-link-color': '#E60023',
        '--frame-divider': '#333333',
        '--frame-input-bg': '#242424',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e5e5e5',
        '--frame-text-primary': '#111111',
        '--frame-text-secondary': '#767676',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#E60023',
        '--frame-accent-bg': '#E60023',
        '--frame-link-color': '#E60023',
        '--frame-divider': '#e5e5e5',
        '--frame-input-bg': '#f8f8f8',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  bluesky: {
    name: 'Bluesky',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="bs-post-header">
        <div class="bs-avatar"></div>
        <div class="bs-post-meta">
          <span class="bs-author-name">SkyUser</span>
          <span class="bs-author-handle">@skyuser.bsky.social</span>
          <span class="bs-post-time">· 2h</span>
        </div>
      </div>
      <div class="bs-post-content">This is worth checking out! 🔗</div>
      {{linkCard}}
      <div class="bs-post-actions">💬 8 · 🔁 23 · ♡ 45</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#111111',
        '--frame-border': '#2d2d2d',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#888888',
        '--frame-text-muted': '#5a5a5a',
        '--frame-accent': '#0085ff',
        '--frame-accent-bg': '#0085ff',
        '--frame-link-color': '#0085ff',
        '--frame-divider': '#2d2d2d',
        '--frame-input-bg': '#1a1a1a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f7f7f7',
        '--frame-border': '#e5e5e5',
        '--frame-text-primary': '#0a0a0a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#0085ff',
        '--frame-accent-bg': '#e5f1ff',
        '--frame-link-color': '#0085ff',
        '--frame-divider': '#e5e5e5',
        '--frame-input-bg': '#f0f0f0',
        '--frame-overlay': 'rgba(0, 0, 0, 0.08)',
      },
    },
  },

  mastodon: {
    name: 'Mastodon',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="mdn-post-header">
        <div class="mdn-avatar"></div>
        <div class="mdn-post-meta">
          <span class="mdn-author-name">FediverseUser</span>
          <span class="mdn-author-handle">@fediverse@mastodon.social</span>
          <span class="mdn-post-time">· 2h</span>
        </div>
        <span class="mdn-visibility">🌐</span>
      </div>
      <div class="mdn-post-content">Shared this interesting link!</div>
      {{linkPreview}}
      <div class="mdn-post-actions">💬 5 · 🔁 12 · ⭐ 28</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#191b22',
        '--frame-surface': '#282c37',
        '--frame-border': '#393f4f',
        '--frame-text-primary': '#d9e1e8',
        '--frame-text-secondary': '#9baec8',
        '--frame-text-muted': '#636b7f',
        '--frame-accent': '#6364ff',
        '--frame-accent-bg': '#6364ff',
        '--frame-link-color': '#563acc',
        '--frame-divider': '#393f4f',
        '--frame-input-bg': '#282c37',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f7f9fc',
        '--frame-border': '#d9e1e8',
        '--frame-text-primary': '#282c37',
        '--frame-text-secondary': '#636b7f',
        '--frame-text-muted': '#9baec8',
        '--frame-accent': '#6364ff',
        '--frame-accent-bg': '#e8e8ff',
        '--frame-link-color': '#563acc',
        '--frame-divider': '#d9e1e8',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  threads: {
    name: 'Threads',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1:1',
    chrome: `
      <div class="th-post-header">
        <div class="th-avatar"></div>
        <div class="th-post-meta">
          <span class="th-author-name">ThreadsUser</span>
          <span class="th-post-time">2h</span>
        </div>
        <span class="th-menu">•••</span>
      </div>
      <div class="th-post-content">You need to see this! 🔗</div>
      {{linkCard}}
      <div class="th-post-actions">💬 12 · ♡ 89 · 🔗 5</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#101010',
        '--frame-surface': '#1a1a1a',
        '--frame-border': '#2a2a2a',
        '--frame-text-primary': '#f0f0f0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#e0e0e0',
        '--frame-accent-bg': '#e0e0e0',
        '--frame-link-color': '#0095f6',
        '--frame-divider': '#2a2a2a',
        '--frame-input-bg': '#1a1a1a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#dbdbdb',
        '--frame-text-primary': '#262626',
        '--frame-text-secondary': '#737373',
        '--frame-text-muted': '#a8a8a8',
        '--frame-accent': '#262626',
        '--frame-accent-bg': '#262626',
        '--frame-link-color': '#0095f6',
        '--frame-divider': '#dbdbdb',
        '--frame-input-bg': '#efefef',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  tumblr: {
    name: 'Tumblr',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="tm-post-header">
        <div class="tm-avatar"></div>
        <div class="tm-post-meta">
          <span class="tm-author-name">CreativeUser</span>
          <span class="tm-post-time">2 hours ago</span>
        </div>
        <span class="tm-menu">•••</span>
      </div>
      <div class="tm-post-content">Check this out!</div>
      <div class="tm-tags">#art #design</div>
      <div class="tm-post-actions">♡ 24 · ↗ 5 · 💬 3</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#001035',
        '--frame-surface': '#0a1a4f',
        '--frame-border': '#1a2a5f',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#00b8ff',
        '--frame-accent-bg': '#00b8ff',
        '--frame-link-color': '#00d4f5',
        '--frame-divider': '#1a2a5f',
        '--frame-input-bg': '#0a1a4f',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#001035',
        '--frame-text-secondary': '#5a5a5a',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#00b8ff',
        '--frame-accent-bg': '#e0f7ff',
        '--frame-link-color': '#00d4f5',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Discussion & Community
  reddit: {
    name: 'Reddit',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="rd-subreddit-header">
        <div class="rd-subreddit-banner"></div>
        <div class="rd-subreddit-info">
          <div class="rd-subreddit-icon">r/</div>
          <div class="rd-subreddit-details">
            <div class="rd-subreddit-name">r/{{subreddit}}</div>
            <div class="rd-subreddit-meta">{{memberCount}} members · {{onlineCount}} online</div>
          </div>
          <button class="rd-join-btn">Join</button>
        </div>
      </div>
      <div class="rd-post-list">
        {{postList}}
      </div>
    `,
    neutralContent: `
      <div class="rd-post-item">
        <div class="rd-upvote-section">
          <div class="rd-upvote-arrow">▲</div>
          <div class="rd-vote-count">{{upvotes}}</div>
          <div class="rd-downvote-arrow">▼</div>
        </div>
        <div class="rd-post-main">
          <div class="rd-post-meta">
            <span class="rd-subreddit-link">r/{{subreddit}}</span>
            <span class="rd-post-author">• Posted by u/{{author}}</span>
            <span class="rd-post-time">• {{timeAgo}}</span>
          </div>
          <div class="rd-post-title">{{title}}</div>
          {{linkPreview}}
          <div class="rd-post-actions">
            <span>💬 {{commentCount}} comments</span>
            <span>🔗 Share</span>
            <span>💾 Save</span>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1e',
        '--frame-surface': '#25252a',
        '--frame-border': '#343536',
        '--frame-text-primary': '#e4e4e7',
        '--frame-text-secondary': '#a5a5a9',
        '--frame-text-muted': '#6e6e73',
        '--frame-accent': '#FF4500',
        '--frame-accent-bg': '#FF4500',
        '--frame-link-color': '#5f99cf',
        '--frame-divider': '#343536',
        '--frame-input-bg': '#272729',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f9fa',
        '--frame-border': '#ccc',
        '--frame-text-primary': '#1c1c1c',
        '--frame-text-secondary': '#5a5a5a',
        '--frame-text-muted': '#7a7a7a',
        '--frame-accent': '#FF4500',
        '--frame-accent-bg': '#FF4500',
        '--frame-link-color': '#5f99cf',
        '--frame-divider': '#ddd',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Developer Platforms
  github: {
    name: 'GitHub',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="gh-issue-header">
        <div class="gh-issue-meta">
          <span class="gh-issue-number">Issue #{{issueNumber}}</span>
          <span class="gh-issue-status">Open</span>
        </div>
        <div class="gh-issue-title">{{title}}</div>
        <div class="gh-issue-author">
          <div class="gh-avatar"></div>
          <span class="gh-author-name">{{author}}</span>
          <span class="gh-issue-time">opened {{timeAgo}}</span>
        </div>
      </div>
      <div class="gh-comments-list">
        <div class="gh-comment gh-comment-dim">
          <div class="gh-comment-avatar"></div>
          <div class="gh-comment-content">
            <div class="gh-comment-meta">
              <span class="gh-comment-author">Contributor</span>
              <span class="gh-comment-time">{{timeAgo}}</span>
            </div>
            <div class="gh-comment-body">This looks great! 👍</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="gh-comment">
        <div class="gh-comment-avatar"></div>
        <div class="gh-comment-content">
          <div class="gh-comment-meta">
            <span class="gh-comment-author">You</span>
            <span class="gh-comment-time">Just now</span>
          </div>
          <div class="gh-comment-body">{{comment}}</div>
          <div class="gh-comment-actions">
            <span class="gh-reaction-btn">👍 0</span>
            <span class="gh-reply-btn">Reply</span>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#0d1117',
        '--frame-surface': '#161b22',
        '--frame-border': '#30363d',
        '--frame-text-primary': '#c9d1d9',
        '--frame-text-secondary': '#8b949e',
        '--frame-text-muted': '#6e7681',
        '--frame-accent': '#58a6ff',
        '--frame-accent-bg': '#1f6feb',
        '--frame-link-color': '#58a6ff',
        '--frame-divider': '#30363d',
        '--frame-input-bg': '#0d1117',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f6f8fa',
        '--frame-border': '#d0d7de',
        '--frame-text-primary': '#24292f',
        '--frame-text-secondary': '#57606a',
        '--frame-text-muted': '#6e7681',
        '--frame-accent': '#0969da',
        '--frame-accent-bg': '#ddf4ff',
        '--frame-link-color': '#0969da',
        '--frame-divider': '#d0d7de',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  gitlab: {
    name: 'GitLab',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="gl-mr-header">
        <div class="gl-mr-meta">
          <span class="gl-mr-number">!{{mrNumber}}</span>
          <span class="gl-mr-status">Open</span>
        </div>
        <div class="gl-mr-title">{{title}}</div>
        <div class="gl-mr-author">
          <div class="gl-avatar"></div>
          <span class="gl-author-name">{{author}}</span>
          <span class="gl-mr-time">opened {{timeAgo}}</span>
        </div>
      </div>
      <div class="gl-discussion-list">
        <div class="gl-comment gl-comment-dim">
          <div class="gl-comment-avatar"></div>
          <div class="gl-comment-content">
            <div class="gl-comment-meta">
              <span class="gl-comment-author">Reviewer</span>
              <span class="gl-comment-time">{{timeAgo}}</span>
            </div>
            <div class="gl-comment-body">LGTM! Ready to merge 🎉</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="gl-comment">
        <div class="gl-comment-avatar"></div>
        <div class="gl-comment-content">
          <div class="gl-comment-meta">
            <span class="gl-comment-author">You</span>
            <span class="gl-comment-time">Just now</span>
          </div>
          <div class="gl-comment-body">{{comment}}</div>
          <div class="gl-comment-actions">
            <span class="gl-reaction-btn">👍 0</span>
            <span class="gl-reply-btn">Reply</span>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1f1e24',
        '--frame-surface': '#292730',
        '--frame-border': '#3f3d44',
        '--frame-text-primary': '#ebebeb',
        '--frame-text-secondary': '#a3a3a3',
        '--frame-text-muted': '#737278',
        '--frame-accent': '#7b5cfd',
        '--frame-accent-bg': '#7b5cfd',
        '--frame-link-color': '#7b5cfd',
        '--frame-divider': '#3f3d44',
        '--frame-input-bg': '#1f1e24',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#fbfbfc',
        '--frame-border': '#e5e5e5',
        '--frame-text-primary': '#333238',
        '--frame-text-secondary': '#737278',
        '--frame-text-muted': '#a3a3a3',
        '--frame-accent': '#7b5cfd',
        '--frame-accent-bg': '#e8e6fd',
        '--frame-link-color': '#7b5cfd',
        '--frame-divider': '#e5e5e5',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  stackoverflow: {
    name: 'Stack Overflow',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="so-question-header">
        <div class="so-votes">
          <span class="so-upvote">▲</span>
          <span class="so-vote-count">{{upvotes}}</span>
          <span class="so-downvote">▼</span>
        </div>
        <div class="so-question-main">
          <div class="so-question-title">{{title}}</div>
          <div class="so-question-meta">
            <span class="so-tags">{{tags}}</span>
            <span class="so-author">asked by {{author}} {{timeAgo}}</span>
          </div>
        </div>
      </div>
      <div class="so-answers-list">
        <div class="so-answer so-answer-dim">
          <div class="so-answer-votes">
            <span class="so-upvote">▲</span>
            <span class="so-vote-count">5</span>
            <span class="so-downvote">▼</span>
            <span class="so-check">✓</span>
          </div>
          <div class="so-answer-content">
            <div class="so-answer-body">Here's the solution you're looking for...</div>
            <div class="so-answer-meta">answered by HelpfulDev {{timeAgo}}</div>
          </div>
        </div>
        {{userAnswer}}
      </div>
    `,
    neutralContent: `
      <div class="so-answer">
        <div class="so-answer-votes">
          <span class="so-upvote">▲</span>
          <span class="so-vote-count">0</span>
          <span class="so-downvote">▼</span>
        </div>
        <div class="so-answer-content">
          <div class="so-answer-body">{{answer}}</div>
          <div class="so-answer-meta">answered by You just now</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1e1e1e',
        '--frame-surface': '#252526',
        '--frame-border': '#3e3e42',
        '--frame-text-primary': '#d4d4d4',
        '--frame-text-secondary': '#808080',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#f48024',
        '--frame-accent-bg': '#f48024',
        '--frame-link-color': '#4db2ff',
        '--frame-divider': '#3e3e42',
        '--frame-input-bg': '#3c3c3c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f9fa',
        '--frame-border': '#d6d6d6',
        '--frame-text-primary': '#232629',
        '--frame-text-secondary': '#6a737c',
        '--frame-text-muted': '#9fa6ad',
        '--frame-accent': '#f48024',
        '--frame-accent-bg': '#fff0dc',
        '--frame-link-color': '#0077cc',
        '--frame-divider': '#d6d6d6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  hackernews: {
    name: 'Hacker News',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="hn-post-header">
        <div class="hn-upvote">▲</div>
        <div class="hn-post-main">
          <div class="hn-post-title">{{title}}</div>
          <div class="hn-post-meta">
            <span class="hn-domain">{{domain}}</span>
            <span class="hn-points">{{points}} points</span>
            <span class="hn-author">by {{author}}</span>
            <span class="hn-time">{{timeAgo}}</span>
            <span class="hn-comments">{{commentCount}} comments</span>
          </div>
        </div>
      </div>
      <div class="hn-comments-list">
        <div class="hn-comment hn-comment-dim">
          <div class="hn-comment-vote">▲</div>
          <div class="hn-comment-content">
            <div class="hn-comment-meta">
              <span class="hn-comment-author">hn_user</span>
              <span class="hn-comment-time">{{timeAgo}}</span>
            </div>
            <div class="hn-comment-body">Interesting perspective on this topic.</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="hn-comment">
        <div class="hn-comment-vote">▲</div>
        <div class="hn-comment-content">
          <div class="hn-comment-meta">
            <span class="hn-comment-author">You</span>
            <span class="hn-comment-time">Just now</span>
          </div>
          <div class="hn-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#242424',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#dddddd',
        '--frame-text-secondary': '#828282',
        '--frame-text-muted': '#626262',
        '--frame-accent': '#ff6600',
        '--frame-accent-bg': '#ff6600',
        '--frame-link-color': '#ff6600',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f6f6ef',
        '--frame-border': '#d4d4d4',
        '--frame-text-primary': '#222222',
        '--frame-text-secondary': '#828282',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#ff6600',
        '--frame-accent-bg': '#fff0e6',
        '--frame-link-color': '#ff6600',
        '--frame-divider': '#d4d4d4',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  producthunt: {
    name: 'Product Hunt',
    category: 'content',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="ph-post-header">
        <div class="ph-product-icon"></div>
        <div class="ph-product-meta">
          <div class="ph-product-name">{{productName}}</div>
          <div class="ph-product-tagline">{{tagline}}</div>
        </div>
        <button class="ph-upvote-btn">▲ Upvote</button>
      </div>
      <div class="ph-comments-section">
        <div class="ph-comments-header">Comments</div>
        <div class="ph-comment ph-comment-dim">
          <div class="ph-comment-avatar"></div>
          <div class="ph-comment-content">
            <span class="ph-comment-author">Hunter</span>
            <span class="ph-comment-time">2h</span>
            <div class="ph-comment-body">This is exactly what I needed!</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="ph-comment">
        <div class="ph-comment-avatar"></div>
        <div class="ph-comment-content">
          <span class="ph-comment-author">You</span>
          <span class="ph-comment-time">Just now</span>
          <div class="ph-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#999999',
        '--frame-text-muted': '#666666',
        '--frame-accent': '#da552f',
        '--frame-accent-bg': '#da552f',
        '--frame-link-color': '#da552f',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e8e8e8',
        '--frame-text-primary': '#21293c',
        '--frame-text-secondary': '#5f6b7c',
        '--frame-text-muted': '#9ea7b5',
        '--frame-accent': '#da552f',
        '--frame-accent-bg': '#fff0eb',
        '--frame-link-color': '#da552f',
        '--frame-divider': '#e8e8e8',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  devto: {
    name: 'Dev.to',
    category: 'content',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="dev-article-header">
        <div class="dev-article-meta">
          <div class="dev-author-avatar"></div>
          <div class="dev-author-details">
            <span class="dev-author-name">{{author}}</span>
            <span class="dev-post-time">Posted {{timeAgo}}</span>
          </div>
          <button class="dev-follow-btn">Follow</button>
        </div>
        <div class="dev-article-title">{{title}}</div>
        <div class="dev-tags">
          <span class="dev-tag">{{tag1}}</span>
          <span class="dev-tag">{{tag2}}</span>
          <span class="dev-tag">{{tag3}}</span>
        </div>
        <div class="dev-reactions">👍 {{likes}} · 💬 {{comments}}</div>
      </div>
      <div class="dev-comments-section">
        <div class="dev-comment dev-comment-dim">
          <div class="dev-comment-avatar"></div>
          <div class="dev-comment-content">
            <span class="dev-comment-author">Developer</span>
            <span class="dev-comment-time">{{timeAgo}}</span>
            <div class="dev-comment-body">Great article! Really helpful.</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="dev-comment">
        <div class="dev-comment-avatar"></div>
        <div class="dev-comment-content">
          <span class="dev-comment-author">You</span>
          <span class="dev-comment-time">Just now</span>
          <div class="dev-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#242424',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e1e1e1',
        '--frame-text-secondary': '#a3a3a3',
        '--frame-text-muted': '#7a7a7a',
        '--frame-accent': '#3b49df',
        '--frame-accent-bg': '#3b49df',
        '--frame-link-color': '#3b49df',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#e6e6e6',
        '--frame-text-primary': '#171717',
        '--frame-text-secondary': '#575757',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#3b49df',
        '--frame-accent-bg': '#e8ecff',
        '--frame-link-color': '#3b49df',
        '--frame-divider': '#e6e6e6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  medium: {
    name: 'Medium',
    category: 'content',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="md-article-header">
        <div class="md-author-section">
          <div class="md-author-avatar"></div>
          <div class="md-author-meta">
            <span class="md-author-name">{{author}}</span>
            <span class="md-post-time">{{timeAgo}}</span>
          </div>
          <button class="md-follow-btn">Follow</button>
        </div>
        <div class="md-article-title">{{title}}</div>
        <div class="md-article-preview">{{preview}}</div>
        <div class="md-stats">{{claps}} claps · {{responses}} responses</div>
      </div>
      <div class="md-responses-section">
        <div class="md-response md-response-dim">
          <div class="md-response-avatar"></div>
          <div class="md-response-content">
            <span class="md-response-author">Reader</span>
            <span class="md-response-time">{{timeAgo}}</span>
            <div class="md-response-body">Thoughtful piece. Thanks for sharing!</div>
          </div>
        </div>
        {{userResponse}}
      </div>
    `,
    neutralContent: `
      <div class="md-response">
        <div class="md-response-avatar"></div>
        <div class="md-response-content">
          <span class="md-response-author">You</span>
          <span class="md-response-time">Just now</span>
          <div class="md-response-body">{{response}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#1a1a1a',
        '--frame-border': '#2a2a2a',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#1a8917',
        '--frame-accent-bg': '#1a8917',
        '--frame-link-color': '#1a8917',
        '--frame-divider': '#2a2a2a',
        '--frame-input-bg': '#1a1a1a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#242424',
        '--frame-text-secondary': '#6b6b6b',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#1a8917',
        '--frame-accent-bg': '#e8f5e9',
        '--frame-link-color': '#1a8917',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Email Clients
  gmail: {
    name: 'Gmail',
    category: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="gmail-thread-header">
        <div class="gmail-subject">{{subject}}</div>
        <div class="gmail-thread-meta">
          <span class="gmail-from">{{from}}</span>
          <span class="gmail-to">to {{to}}</span>
          <span class="gmail-time">{{time}}</span>
        </div>
      </div>
      <div class="gmail-messages">
        <div class="gmail-message gmail-message-dim">
          <div class="gmail-sender-avatar"></div>
          <div class="gmail-message-content">
            <div class="gmail-sender-info">
              <span class="gmail-sender-name">{{senderName}}</span>
              <span class="gmail-sender-email">&lt;{{senderEmail}}&gt;</span>
              <span class="gmail-message-time">{{timeAgo}}</span>
            </div>
            <div class="gmail-message-body">Check out this link I found!</div>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="gmail-message">
        <div class="gmail-sender-avatar"></div>
        <div class="gmail-message-content">
          <div class="gmail-sender-info">
            <span class="gmail-sender-name">You</span>
            <span class="gmail-sender-email">&lt;{{yourEmail}}&gt;</span>
            <span class="gmail-message-time">Just now</span>
          </div>
          <div class="gmail-link-preview">
            {{titleSection}}
            <div class="gmail-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1f1f1f',
        '--frame-surface': '#2d2d2d',
        '--frame-border': '#3d3d3d',
        '--frame-text-primary': '#e8eaed',
        '--frame-text-secondary': '#9aa0a6',
        '--frame-text-muted': '#5f6368',
        '--frame-accent': '#c4e7fa',
        '--frame-accent-bg': '#c4e7fa',
        '--frame-link-color': '#8ab4f8',
        '--frame-divider': '#3d3d3d',
        '--frame-input-bg': '#2d2d2d',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f2f2f2',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#202124',
        '--frame-text-secondary': '#5f6368',
        '--frame-text-muted': '#9aa0a6',
        '--frame-accent': '#0b57d0',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#0b57d0',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  outlook: {
    name: 'Outlook',
    category: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="ol-thread-header">
        <div class="ol-subject">{{subject}}</div>
        <div class="ol-thread-meta">
          <span class="ol-from">{{from}}</span>
          <span class="ol-time">{{time}}</span>
        </div>
      </div>
      <div class="ol-messages">
        <div class="ol-message ol-message-dim">
          <div class="ol-sender-avatar"></div>
          <div class="ol-message-content">
            <div class="ol-sender-info">
              <span class="ol-sender-name">{{senderName}}</span>
              <span class="ol-sender-email">{{senderEmail}}</span>
              <span class="ol-message-time">{{timeAgo}}</span>
            </div>
            <div class="ol-message-body">You should see this resource!</div>
          </div>
        </div>
        {{userMessage}}
      </div>
    `,
    neutralContent: `
      <div class="ol-message">
        <div class="ol-sender-avatar"></div>
        <div class="ol-message-content">
          <div class="ol-sender-info">
            <span class="ol-sender-name">You</span>
            <span class="ol-sender-email">{{yourEmail}}</span>
            <span class="ol-message-time">Just now</span>
          </div>
          <div class="ol-link-preview">
            {{titleSection}}
            <div class="ol-domain">{{domain}}</div>
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1f1f1f',
        '--frame-surface': '#2b2b2b',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#0078d4',
        '--frame-accent-bg': '#0078d4',
        '--frame-link-color': '#0078d4',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2b2b2b',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f3f2f1',
        '--frame-border': '#edebe9',
        '--frame-text-primary': '#323130',
        '--frame-text-secondary': '#605e5c',
        '--frame-text-muted': '#a19f9d',
        '--frame-accent': '#0078d4',
        '--frame-accent-bg': '#eff6fc',
        '--frame-link-color': '#0078d4',
        '--frame-divider': '#edebe9',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // RSS Readers
  feedly: {
    name: 'Feedly',
    category: 'rss',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="fl-sidebar">
        <div class="fl-feed-title">{{feedTitle}}</div>
        <div class="fl-feed-meta">{{unreadCount}} unread</div>
      </div>
      <div class="fl-main">
        <div class="fl-article-list">
          <div class="fl-article fl-article-dim">
            <div class="fl-article-source">{{feedName}}</div>
            <div class="fl-article-title">Previous Article</div>
            <div class="fl-article-time">{{timeAgo}}</div>
          </div>
          {{userArticle}}
        </div>
      </div>
    `,
    neutralContent: `
      <div class="fl-article">
        <div class="fl-article-source">{{feedName}}</div>
        <div class="fl-article-title">{{title}}</div>
        <div class="fl-article-preview">{{description}}</div>
        <div class="fl-article-time">Just now</div>
        <div class="fl-article-mark">⭐ Mark as read</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#2bb24a',
        '--frame-accent-bg': '#2bb24a',
        '--frame-link-color': '#2bb24a',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f4f4f4',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#2a2a2a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#2bb24a',
        '--frame-accent-bg': '#e8f5e9',
        '--frame-link-color': '#2bb24a',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Note-taking Apps
  notion: {
    name: 'Notion',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="no-page-header">
        <div class="no-page-icon">📄</div>
        <div class="no-page-title">{{pageTitle}}</div>
        <div class="no-page-meta">
          <span class="no-author">{{author}}</span>
          <span class="no-time">{{timeAgo}}</span>
        </div>
      </div>
      <div class="no-content">
        <div class="no-block no-block-dim">
          <div class="no-block-text">Some notes here...</div>
        </div>
        <div class="no-block no-block-dim">
          <div class="no-block-callout">
            <span class="no-emoji">💡</span>
            <span class="no-callout-text">Important note</span>
          </div>
        </div>
        {{userBlock}}
      </div>
    `,
    neutralContent: `
      <div class="no-block">
        <div class="no-link-preview">
          {{imageSection}}
          <div class="no-link-title">{{title}}</div>
          <div class="no-link-domain">{{domain}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#191919',
        '--frame-surface': '#2f2f2f',
        '--frame-border': '#3f3f3f',
        '--frame-text-primary': '#e6e6e6',
        '--frame-text-secondary': '#9a9a9a',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#2383e2',
        '--frame-accent-bg': '#2383e2',
        '--frame-link-color': '#2383e2',
        '--frame-divider': '#3f3f3f',
        '--frame-input-bg': '#2f2f2f',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f7f7f5',
        '--frame-border': '#e6e6e6',
        '--frame-text-primary': '#37352f',
        '--frame-text-secondary': '#787774',
        '--frame-text-muted': '#9b9a97',
        '--frame-accent': '#2383e2',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#2383e2',
        '--frame-divider': '#e6e6e6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  evernote: {
    name: 'Evernote',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="ev-notebook-header">
        <div class="ev-notebook-icon">📒</div>
        <div class="ev-notebook-title">{{notebookName}}</div>
      </div>
      <div class="ev-note-list">
        <div class="ev-note ev-note-dim">
          <div class="ev-note-title">Previous Note</div>
          <div class="ev-note-preview">Some preview text...</div>
          <div class="ev-note-meta">{{timeAgo}}</div>
        </div>
        {{userNote}}
      </div>
    `,
    neutralContent: `
      <div class="ev-note">
        <div class="ev-note-title">{{title}}</div>
        <div class="ev-note-content">
          <div class="ev-link-card">
            {{imageSection}}
            <div class="ev-link-domain">{{domain}}</div>
          </div>
        </div>
        <div class="ev-note-meta">Just now</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#00a82d',
        '--frame-accent-bg': '#00a82d',
        '--frame-link-color': '#00a82d',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#2c2c2c',
        '--frame-text-secondary': '#6a6a6a',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#00a82d',
        '--frame-accent-bg': '#e8f5e9',
        '--frame-link-color': '#00a82d',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Developer Tools
  vscode: {
    name: 'VS Code',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="vs-activity-bar">
        <div class="vs-activity-icon vs-activity-active">📁</div>
        <div class="vs-activity-icon">🔍</div>
        <div class="vs-activity-icon">⎇</div>
        <div class="vs-activity-icon">🐛</div>
      </div>
      <div class="vs-sidebar">
        <div class="vs-explorer">Explorer</div>
        <div class="vs-file vs-file-active">{{fileName}}</div>
        <div class="vs-file">README.md</div>
        <div class="vs-file">package.json</div>
      </div>
      <div class="vs-main-area">
        <div class="vs-editor">
          <div class="vs-tab-bar">
            <div class="vs-tab vs-tab-active">{{fileName}}</div>
            <div class="vs-tab">README.md</div>
          </div>
          <div class="vs-content">
            <div class="vs-comment vs-comment-dim">
              <span class="vs-comment-author">Dev</span>
              <span class="vs-comment-time">{{timeAgo}}</span>
              <div class="vs-comment-body">// TODO: Review this code</div>
            </div>
            {{userComment}}
          </div>
        </div>
        <div class="vs-terminal-panel">
          <div class="vs-terminal-header">Terminal</div>
          <div class="vs-terminal-content">
            <div class="vs-terminal-line">$ npm test</div>
            <div class="vs-terminal-line vs-terminal-success">✓ Tests passed</div>
          </div>
        </div>
      </div>
    `,
    neutralContent: `
      <div class="vs-comment">
        <span class="vs-comment-author">You</span>
        <span class="vs-comment-time">Just now</span>
        <div class="vs-comment-body">{{comment}}</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1e1e1e',
        '--frame-surface': '#252526',
        '--frame-border': '#3e3e42',
        '--frame-text-primary': '#d4d4d4',
        '--frame-text-secondary': '#858585',
        '--frame-text-muted': '#6e6e6e',
        '--frame-accent': '#0078d4',
        '--frame-accent-bg': '#0078d4',
        '--frame-link-color': '#3794ff',
        '--frame-divider': '#3e3e42',
        '--frame-input-bg': '#3c3c3c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f3f3f3',
        '--frame-border': '#e4e4e4',
        '--frame-text-primary': '#333333',
        '--frame-text-secondary': '#616161',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#005fb8',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#e4e4e4',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  jetbrains: {
    name: 'JetBrains IDE',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="jb-sidebar">
        <div class="jb-project-header">{{projectName}}</div>
        <div class="jb-explorer">Project</div>
        <div class="jb-file-tree">
          <div class="jb-folder">
            <div class="jb-folder-name">src</div>
            <div class="jb-file jb-file-active">{{fileName}}</div>
            <div class="jb-file">App.java</div>
          </div>
          <div class="jb-folder">
            <div class="jb-folder-name">test</div>
            <div class="jb-file">Test.java</div>
          </div>
        </div>
      </div>
      <div class="jb-main-area">
        <div class="jb-editor">
          <div class="jb-tab-bar">
            <div class="jb-tab jb-tab-active">{{fileName}}</div>
            <div class="jb-tab">README.md</div>
          </div>
          <div class="jb-content">
            <div class="jb-comment jb-comment-dim">
              <span class="jb-comment-author">Developer</span>
              <span class="jb-comment-time">{{timeAgo}}</span>
              <div class="jb-comment-body">// TODO: Review this implementation</div>
            </div>
            {{userComment}}
          </div>
        </div>
        <div class="jb-status-bar">
          <div class="jb-status-left">
            <span class="jb-status-item">✓</span>
            <span class="jb-status-item">JUnit: OK</span>
          </div>
          <div class="jb-status-right">
            <span class="jb-status-item">Line 42</span>
            <span class="jb-status-item">UTF-8</span>
            <span class="jb-status-item">4 spaces</span>
          </div>
        </div>
      </div>
    `,
    neutralContent: `
      <div class="jb-comment">
        <span class="jb-comment-author">You</span>
        <span class="jb-comment-time">Just now</span>
        <div class="jb-comment-body">{{comment}}</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#2b2b2b',
        '--frame-surface': '#313335',
        '--frame-border': '#4e5254',
        '--frame-text-primary': '#a9b7c6',
        '--frame-text-secondary': '#808080',
        '--frame-text-muted': '#6e6e6e',
        '--frame-accent': '#6c8eba',
        '--frame-accent-bg': '#4e6a91',
        '--frame-link-color': '#589df6',
        '--frame-divider': '#4e5254',
        '--frame-input-bg': '#3c3f41',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#dcdcdc',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#6e6e6e',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#6c8eba',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#dcdcdc',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Project Management
  jira: {
    name: 'Jira',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="ji-issue-header">
        <div class="ji-issue-key">{{issueKey}}</div>
        <div class="ji-issue-title">{{title}}</div>
        <div class="ji-issue-meta">
          <span class="ji-status">{{status}}</span>
          <span class="ji-priority">High</span>
          <span class="ji-assignee">{{assignee}}</span>
        </div>
      </div>
      <div class="ji-activity-stream">
        <div class="ji-comment ji-comment-dim">
          <div class="ji-comment-avatar"></div>
          <div class="ji-comment-content">
            <span class="ji-comment-author">Teammate</span>
            <span class="ji-comment-time">{{timeAgo}}</span>
            <div class="ji-comment-body">Made some progress on this!</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="ji-comment">
        <div class="ji-comment-avatar"></div>
        <div class="ji-comment-content">
          <span class="ji-comment-author">You</span>
          <span class="ji-comment-time">Just now</span>
          <div class="ji-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#0d1216',
        '--frame-surface': '#1a2129',
        '--frame-border': '#2e3947',
        '--frame-text-primary': '#b6c2cf',
        '--frame-text-secondary': '#7a869a',
        '--frame-text-muted': '#5c6779',
        '--frame-accent': '#0052cc',
        '--frame-accent-bg': '#0052cc',
        '--frame-link-color': '#579dff',
        '--frame-divider': '#2e3947',
        '--frame-input-bg': '#1a2129',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f4f5f7',
        '--frame-border': '#dfe1e6',
        '--frame-text-primary': '#172b4d',
        '--frame-text-secondary': '#5e6c84',
        '--frame-text-muted': '#9fadbd',
        '--frame-accent': '#0052cc',
        '--frame-accent-bg': '#deebff',
        '--frame-link-color': '#0052cc',
        '--frame-divider': '#dfe1e6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  trello: {
    name: 'Trello',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="tr-board-header">
        <div class="tr-board-title">{{boardName}}</div>
      </div>
      <div class="tr-card-list">
        <div class="tr-card tr-card-dim">
          <div class="tr-card-title">Another task</div>
          <div class="tr-card-meta">
            <span class="tr-labels">🏷️ Labels</span>
            <span class="tr-checklist">✓ 1/3</span>
          </div>
        </div>
        {{userCard}}
      </div>
    `,
    neutralContent: `
      <div class="tr-card">
        <div class="tr-card-title">{{title}}</div>
        <div class="tr-card-desc">{{description}}</div>
        <div class="tr-card-meta">
          <span class="tr-labels">{{labels}}</span>
          <span class="tr-checklist">{{checklist}}</span>
        </div>
        <div class="tr-card-attachment">
          {{imageSection}}
          <div class="tr-attachment-domain">{{domain}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1e1e1e',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#0079bf',
        '--frame-accent-bg': '#0079bf',
        '--frame-link-color': '#0079bf',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f4f5f7',
        '--frame-border': '#dfe1e6',
        '--frame-text-primary': '#172b4d',
        '--frame-text-secondary': '#5e6c84',
        '--frame-text-muted': '#9fadbd',
        '--frame-accent': '#0079bf',
        '--frame-accent-bg': '#e6f0ff',
        '--frame-link-color': '#0079bf',
        '--frame-divider': '#dfe1e6',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  asana: {
    name: 'Asana',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="as-task-header">
        <div class="as-task-id">{{taskId}}</div>
        <div class="as-task-title">{{title}}</div>
        <div class="as-task-meta">
          <span class="as-project">{{projectName}}</span>
          <span class="as-assignee">{{assignee}}</span>
          <span class="as-due-date">{{dueDate}}</span>
        </div>
      </div>
      <div class="as-comments-section">
        <div class="as-comment as-comment-dim">
          <div class="as-comment-avatar"></div>
          <div class="as-comment-content">
            <span class="as-comment-author">Teammate</span>
            <span class="as-comment-time">{{timeAgo}}</span>
            <div class="as-comment-body">Making good progress on this task!</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="as-comment">
        <div class="as-comment-avatar"></div>
        <div class="as-comment-content">
          <span class="as-comment-author">You</span>
          <span class="as-comment-time">Just now</span>
          <div class="as-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1f1f1f',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#7f54b3',
        '--frame-accent-bg': '#7f54b3',
        '--frame-link-color': '#4da3ff',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#d8d8d8',
        '--frame-text-primary': '#222222',
        '--frame-text-secondary': '#6e6e6e',
        '--frame-text-muted': '#9e9e9e',
        '--frame-accent': '#7f54b3',
        '--frame-accent-bg': '#f4ebff',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#d8d8d8',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  figma: {
    name: 'Figma',
    category: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="fi-file-header">
        <div class="fi-file-icon">🎨</div>
        <div class="fi-file-meta">
          <div class="fi-file-name">{{fileName}}</div>
          <div class="fi-file-time">Edited {{timeAgo}}</div>
        </div>
        <div class="fi-collaborators">
          <div class="fi-collab-avatar">JD</div>
          <div class="fi-collab-avatar">AS</div>
        </div>
      </div>
      <div class="fi-comments-section">
        <div class="fi-comment fi-comment-dim">
          <div class="fi-comment-avatar">JD</div>
          <div class="fi-comment-content">
            <span class="fi-comment-author">Jane Designer</span>
            <span class="fi-comment-time">{{timeAgo}}</span>
            <div class="fi-comment-body">This looks great! 👍</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="fi-comment">
        <div class="fi-comment-avatar">Y</div>
        <div class="fi-comment-content">
          <span class="fi-comment-author">You</span>
          <span class="fi-comment-time">Just now</span>
          <div class="fi-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1e1e1e',
        '--frame-surface': '#2c2c2c',
        '--frame-border': '#3e3e3e',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#f24e1e',
        '--frame-accent-bg': '#f24e1e',
        '--frame-link-color': '#1abcfe',
        '--frame-divider': '#3e3e3e',
        '--frame-input-bg': '#2c2c2c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#f24e1e',
        '--frame-accent-bg': '#ffe8e0',
        '--frame-link-color': '#1abcfe',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  substack: {
    name: 'Substack',
    category: 'content',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="sb-post-header">
        <div class="sb-author-section">
          <div class="sb-author-avatar"></div>
          <div class="sb-author-meta">
            <span class="sb-author-name">{{author}}</span>
            <span class="sb-subscriber-count">{{subscriberCount}} subscribers</span>
          </div>
          <button class="sb-subscribe-btn">Subscribe</button>
        </div>
        <div class="sb-post-title">{{title}}</div>
        <div class="sb-post-preview">{{preview}}</div>
        <div class="sb-post-stats">{{likeCount}} likes · {{commentCount}} comments</div>
      </div>
      <div class="sb-comments-section">
        <div class="sb-comment sb-comment-dim">
          <div class="sb-comment-avatar"></div>
          <div class="sb-comment-content">
            <span class="sb-comment-author">Reader</span>
            <span class="sb-comment-time">{{timeAgo}}</span>
            <div class="sb-comment-body">Excellent post! Really thought-provoking.</div>
          </div>
        </div>
        {{userComment}}
      </div>
    `,
    neutralContent: `
      <div class="sb-comment">
        <div class="sb-comment-avatar"></div>
        <div class="sb-comment-content">
          <span class="sb-comment-author">You</span>
          <span class="sb-comment-time">Just now</span>
          <div class="sb-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#ff6c35',
        '--frame-accent-bg': '#ff6c35',
        '--frame-link-color': '#ff6c35',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f9f9f9',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#ff6c35',
        '--frame-accent-bg': '#fff0e8',
        '--frame-link-color': '#ff6c35',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Generic template for platforms without custom context frames
  generic: {
    name: 'Generic Platform',
    category: 'other',
    hasThemeSupport: false,
    aspectRatio: 'variable',
    chrome: `
      <div class="context-header"><span class="context-title">{{platformName}}</span></div>
      {{cardContent}}
    `,
    neutralContent: '', // Card content is injected directly
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a2e',
        '--frame-surface': '#16213e',
        '--frame-border': '#3a3a5c',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#b0b0b0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#4a9eff',
        '--frame-accent-bg': '#4a9eff',
        '--frame-link-color': '#4a9eff',
        '--frame-divider': '#3a3a5c',
        '--frame-input-bg': '#23263a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f9fa',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#0066cc',
        '--frame-accent-bg': '#e6f2ff',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get platform frame definition
 * @param {string} platformId - Platform ID (e.g., 'twitter', 'slack')
 * @returns {object} Platform frame definition or generic fallback
 */
function getPlatformFrame(platformId) {
  return PLATFORM_FRAMES[platformId] || { ...PLATFORM_FRAMES.generic, name: platformId };
}

/**
 * Check if platform supports theme toggle
 * @param {string} platformId - Platform ID
 * @returns {boolean} True if platform supports dark/light mode
 */
function hasThemeSupport(platformId) {
  const frame = getPlatformFrame(platformId);
  return frame.hasThemeSupport || false;
}

/**
 * Get theme variables for a platform
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {object} CSS custom properties for the theme
 */
function getThemeVars(platformId, theme = 'dark') {
  const frame = getPlatformFrame(platformId);
  return frame.themeVars?.[theme] || frame.themeVars?.dark || {};
}

/**
 * Get platforms that support theme toggle
 * @returns {string[]} Array of platform IDs
 */
function getPlatformsWithThemeSupport() {
  return Object.entries(PLATFORM_FRAMES)
    .filter(([_, frame]) => frame.hasThemeSupport)
    .map(([id, _]) => id);
}

/**
 * Generate CSS for theme variables
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} CSS style string
 */
function generateThemeCSS(platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  const cssVars = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `.${platformId}-context.${theme}-theme {\n${cssVars}\n}`;
}

/**
 * Generate all theme CSS for a platform (both dark and light)
 * @param {string} platformId - Platform ID
 * @returns {string} Complete CSS with theme classes
 */
function generateAllThemeCSS(platformId) {
  let css = `/* Theme variables for ${platformId} */\n`;

  if (hasThemeSupport(platformId)) {
    css += generateThemeCSS(platformId, 'dark') + '\n\n';
    css += generateThemeCSS(platformId, 'light') + '\n';
  } else {
    // For platforms without theme support, use dark as default
    css += generateThemeCSS(platformId, 'dark') + '\n';
  }

  return css;
}

/**
 * Apply theme variables to an element
 * @param {HTMLElement} element - DOM element to apply styles to
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 */
function applyThemeToElement(element, platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  Object.entries(vars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Interpolate template variables in a string
 * @param {string} template - Template string with {{placeholders}}
 * @param {object} vars - Variables to interpolate
 * @returns {string} Interpolated string
 */
function interpolateTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : '';
  });
}

/**
 * Build complete context frame HTML
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data (title, description, image, etc.)
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} Complete context frame HTML
 */
function buildContextFrame(platformId, content, theme = 'dark') {
  const frame = getPlatformFrame(platformId);
  const themeSuffix = hasThemeSupport(platformId) ? ` ${theme}-theme` : '';

  // Build the main content/card HTML
  let mainContent = '';
  if (frame.neutralContent) {
    // Use neutral content template
    mainContent = interpolateTemplate(frame.neutralContent, {
      ...content,
      themeColor: content.themeColor || getThemeVars(platformId, theme)['--frame-accent'],
    });
  }

  // Build link preview section
  let linkPreview = '';
  if (content.title) {
    linkPreview = buildLinkPreviewHTML(platformId, content, theme);
  }

  // Build complete frame
  const frameHTML = interpolateTemplate(frame.chrome, {
    mainResult: mainContent,
    userMessage: mainContent,
    linkPreview,
    linkCard: linkPreview,
    cardContent: content.cardHTML || '',
    ...content,
  });

  return `<div class="context-frame ${platformId}-context${themeSuffix}" style="${getInlineThemeStyles(platformId, theme)}">${frameHTML}</div>`;
}

/**
 * Get inline theme styles as a CSS string
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} Inline style string
 */
function getInlineThemeStyles(platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

/**
 * Build link preview HTML for a platform
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data
 * @param {string} theme - Theme mode
 * @returns {string} Link preview HTML
 */
function buildLinkPreviewHTML(platformId, content, theme = 'dark') {
  const { title, description, image, domain, dominantColor, site } = content;
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Platform-specific link preview formats
  switch (platformId) {
    case 'facebook':
    case 'threads':
      return `
        <div class="fb-link-preview">
          <div class="fb-context-domain">${esc((site || domain || '').toUpperCase())}</div>
          <div class="fb-context-title">${esc(trunc(title, 60))}</div>
          ${description ? `<div class="fb-context-desc">${esc(trunc(description, 100))}</div>` : ''}
          ${image ? `<div class="fb-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="fb-context-placeholder"></div>'}
        </div>
      `;

    case 'twitter':
      return `
        <div class="tw-link-card">
          ${image ? `<div class="tw-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tw-context-placeholder"></div>'}
          <div class="tw-context-meta">
            <div class="tw-context-title">${esc(trunc(title, 60))}</div>
            <div class="tw-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'linkedin':
      return `
        <div class="li-link-preview">
          ${image ? `<div class="li-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="li-context-placeholder"></div>'}
          <div class="li-context-meta">
            <div class="li-context-title">${esc(trunc(title, 80))}</div>
            <div class="li-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'instagram':
      return `
        <div class="ig-link-preview">
          ${image ? `<div class="ig-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="ig-context-placeholder"></div>'}
        </div>
      `;

    case 'youtube':
      return `
        <div class="yt-link-preview">
          ${image ? `<div class="yt-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="yt-context-placeholder"></div>'}
        </div>
      `;

    case 'imessage':
      return `
        <div class="im-link-preview">
          ${site ? `<div class="im-site">${esc(trunc(site, 30))}</div>` : ''}
          <div class="im-title">${esc(trunc(title, 50))}</div>
          ${image ? `<div class="im-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : ''}
        </div>
      `;

    case 'whatsapp':
      return `
        <div class="wa-link-preview">
          ${site ? `<div class="wa-site">${esc(trunc(site, 25))}</div>` : ''}
          <div class="wa-title">${esc(trunc(title, 60))}</div>
          ${description ? `<div class="wa-desc">${esc(trunc(description, 100))}</div>` : ''}
          ${image ? `<div class="wa-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="wa-link-placeholder"></div>'}
        </div>
      `;

    case 'telegram':
      return `
        <div class="tg-link-preview">
          ${image ? `<div class="tg-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tg-link-placeholder"></div>'}
          ${site ? `<div class="tg-site">${esc(trunc(site, 30))}</div>` : ''}
          <div class="tg-title">${esc(trunc(title, 60))}</div>
          ${description ? `<div class="tg-desc">${esc(trunc(description, 120))}</div>` : ''}
        </div>
      `;

    case 'signal':
      const signalImage = image ? `<img src="${esc(image)}" class="signal-link-thumb" alt="" onerror="this.style.display='none'" loading="lazy" />` : '<div class="signal-link-thumb-placeholder"></div>';
      const signalDesc = description ? `<div class="signal-desc">${esc(trunc(description, 100))}</div>` : '';
      return `
        <div class="signal-link-preview">
          ${signalImage}
          <div class="signal-link-meta">
            <div class="signal-title">${esc(trunc(title, 60))}</div>
            ${signalDesc}
            <div class="signal-domain">${esc(trunc(domain || site, 30))}</div>
          </div>
        </div>
      `;

    case 'bluesky':
    case 'mastodon':
      return `
        <div class="bs-link-card">
          ${image ? `<div class="bs-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="bs-context-placeholder"></div>'}
          <div class="bs-context-meta">
            <div class="bs-context-title">${esc(trunc(title, 60))}</div>
            <div class="bs-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'tumblr':
      return `
        <div class="tm-link-preview">
          <div class="tm-title">${esc(trunc(title, 60))}</div>
          ${description ? `<div class="tm-desc">${esc(trunc(description, 120))}</div>` : ''}
          ${image ? `<div class="tm-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : ''}
        </div>
      `;

    case 'teams':
      return `
        <div class="ms-link-preview">
          ${image ? `<div class="ms-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="ms-link-placeholder"></div>'}
          <div class="ms-link-meta">
            <div class="ms-title">${esc(trunc(title, 60))}</div>
            ${description ? `<div class="ms-desc">${esc(trunc(description, 120))}</div>` : ''}
            <div class="ms-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'googlechat':
      return `
        <div class="gc-link-preview">
          ${image ? `<div class="gc-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="gc-link-placeholder"></div>'}
          <div class="gc-title">${esc(trunc(title, 60))}</div>
          <div class="gc-domain">${esc(domain)}</div>
        </div>
      `;

    case 'zoom':
    case 'line':
    case 'kakaotalk':
      return `
        <div class="zm-link-preview">
          ${image ? `<div class="zm-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="zm-link-placeholder"></div>'}
          <div class="zm-title">${esc(trunc(title, 60))}</div>
          <div class="zm-domain">${esc(domain)}</div>
        </div>
      `;

    case 'figma':
      return `
        <div class="fi-link-preview">
          <div class="fi-title">${esc(trunc(title, 50))}</div>
          ${description ? `<div class="fi-desc">${esc(trunc(description, 100))}</div>` : ''}
          <div class="fi-domain">${esc(domain)}</div>
        </div>
      `;

    case 'substack':
      return `
        <div class="sb-link-preview">
          ${image ? `<div class="sb-link-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="sb-link-placeholder"></div>'}
          <div class="sb-link-meta">
            <div class="sb-title">${esc(trunc(title, 80))}</div>
            ${description ? `<div class="sb-desc">${esc(trunc(description, 160))}</div>` : ''}
            <div class="sb-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'gmail':
      return `
        <div class="gmail-title-section">${esc(trunc(title, 70))}</div>
        <div class="gmail-domain">${esc(domain)}</div>
      `;

    case 'outlook':
      return `
        <div class="ol-title-section">${esc(trunc(title, 70))}</div>
        <div class="ol-domain">${esc(domain)}</div>
      `;

    default:
      // Generic link preview
      return `
        <div class="generic-link-preview">
          ${image ? `<div class="generic-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="generic-context-placeholder"></div>'}
          <div class="generic-context-meta">
            <div class="generic-context-title">${esc(trunc(title, 70))}</div>
            ${description ? `<div class="generic-context-desc">${esc(trunc(description, 160))}</div>` : ''}
            <div class="generic-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;
  }
}

/**
 * Get list of all supported platform IDs
 * @returns {string[]} Array of platform IDs
 */
function getSupportedPlatforms() {
  return Object.keys(PLATFORM_FRAMES).filter(id => id !== 'generic');
}

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLATFORM_FRAMES,
    THEME_VAR_NAMES,
    getPlatformFrame,
    hasThemeSupport,
    getThemeVars,
    getPlatformsWithThemeSupport,
    generateThemeCSS,
    generateAllThemeCSS,
    applyThemeToElement,
    buildContextFrame,
    buildLinkPreviewHTML,
    getSupportedPlatforms,
    interpolateTemplate,
    getInlineThemeStyles,
  };
}
