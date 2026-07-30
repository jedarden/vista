# Hardcoded Color Values in Frame CSS Files

**Task:** bf-137c6 - Scan and catalog hardcoded colors in frame CSS  
**Date:** 2026-07-25

## Summary

Three frame CSS files were scanned for hardcoded color values (hex codes, `rgb()`, `rgba()`, `linear-gradient()`). The catalog below documents each hardcoded color with its location and proposed CSS variable replacement.

---

## 1. src/public/frame-layouts.css

**Status:** ✅ **NO HARDCODED COLORS**  
This file is well-abstracted and uses CSS variables throughout. No hardcoded colors found.

---

## 2. src/public/frames-theme.css

**Status:** ⚠️ **HARDCODED COLORS IN CSS VARIABLE DEFINITIONS**  

This file defines CSS variables but many variables themselves contain hardcoded color values. These should be refactored into more semantic variables.

### Global Frame Variables (Dark Mode)
Lines 18-33:

| Line | Variable Name | Hardcoded Value | Proposed Semantic Variable |
|------|--------------|-----------------|----------------------------|
| 18 | `--frame-bg-global` | `#1a1a1e` | `--color-bg-dark-primary` |
| 19 | `--frame-surface-global` | `#25252a` | `--color-bg-dark-elevated` |
| 20 | `--frame-border-global` | `#3a3a3f` | `--color-border-dark-default` |
| 21 | `--frame-text-primary-global` | `#e4e4e7` | `--color-text-dark-primary` |
| 22 | `--frame-text-secondary-global` | `#a1a1aa` | `--color-text-dark-secondary` |
| 23 | `--frame-text-muted-global` | `#71717a` | `--color-text-dark-muted` |
| 24 | `--frame-accent-global` | `#6366f1` | `--color-accent-indigo-500` |
| 25 | `--frame-accent-bg-global` | `#4f46e5` | `--color-accent-indigo-600` |
| 26 | `--frame-link-color-global` | `#818cf8` | `--color-link-indigo-400` |
| 27 | `--frame-divider-global` | `#3a3a3f` | `--color-border-dark-default` |
| 28 | `--frame-input-bg-global` | `#2d2d33` | `--color-bg-dark-input` |
| 29 | `--frame-overlay-global` | `rgba(0, 0, 0, 0.5)` | `--color-overlay-dark` |
| 30 | `--frame-shadow-global` | `0 4px 24px rgba(0, 0, 0, 0.4)` | `--shadow-dark-lg` |

### Global Frame Variables (Light Mode)
Lines 80-92:

| Line | Variable Name | Hardcoded Value | Proposed Semantic Variable |
|------|--------------|-----------------|----------------------------|
| 80 | `--frame-bg-global` | `#ffffff` | `--color-bg-light-primary` |
| 81 | `--frame-surface-global` | `#f8f9fa` | `--color-bg-light-elevated` |
| 82 | `--frame-border-global` | `#e5e7eb` | `--color-border-light-default` |
| 83 | `--frame-text-primary-global` | `#1f2937` | `--color-text-light-primary` |
| 84 | `--frame-text-secondary-global` | `#6b7280` | `--color-text-light-secondary` |
| 85 | `--frame-text-muted-global` | `#9ca3af` | `--color-text-light-muted` |
| 86 | `--frame-accent-global` | `#4f46e5` | `--color-accent-indigo-600` |
| 87 | `--frame-accent-bg-global` | `#eef2ff` | `--color-accent-indigo-100` |
| 88 | `--frame-link-color-global` | `#4f46e5` | `--color-link-indigo-600` |
| 89 | `--frame-divider-global` | `#e5e7eb` | `--color-border-light-default` |
| 90 | `--frame-input-bg-global` | `#ffffff` | `--color-bg-light-input` |
| 91 | `--frame-overlay-global` | `rgba(0, 0, 0, 0.1)` | `--color-overlay-light` |
| 92 | `--frame-shadow-global` | `0 4px 24px rgba(0, 0, 0, 0.08)` | `--shadow-light-lg` |

### Google Theme Variables (Dark Mode)
Lines 36-47:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 36 | `--google-bg` | `#202124` | `--color-google-dark-bg` |
| 37 | `--google-surface` | `#303134` | `--color-google-dark-surface` |
| 38 | `--google-border` | `#3c4043` | `--color-google-dark-border` |
| 39 | `--google-text-primary` | `#e8eaed` | `--color-google-dark-text-primary` |
| 40 | `--google-text-secondary` | `#9aa0a6` | `--color-google-dark-text-secondary` |
| 41 | `--google-text-muted` | `#5f6368` | `--color-google-dark-text-muted` |
| 42 | `--google-accent` | `#8ab4f8` | `--color-google-accent-light` |
| 43 | `--google-accent-bg` | `#1a73e8` | `--color-google-accent-dark` |
| 44 | `--google-link-color` | `#8ab4f8` | `--color-google-link` |
| 45 | `--google-divider` | `#3c4043` | `--color-google-border` |
| 46 | `--google-input-bg` | `#303134` | `--color-google-surface` |
| 47 | `--google-overlay` | `rgba(0, 0, 0, 0.6)` | `--color-google-overlay` |

### Google Theme Variables (Light Mode)
Lines 95-106:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 95 | `--google-bg` | `#ffffff` | `--color-google-light-bg` |
| 96 | `--google-surface` | `#f1f3f4` | `--color-google-light-surface` |
| 97 | `--google-border` | `#dfe1e5` | `--color-google-light-border` |
| 98 | `--google-text-primary` | `#202124` | `--color-google-light-text-primary` |
| 99 | `--google-text-secondary` | `#5f6368` | `--color-google-light-text-secondary` |
| 100 | `--google-text-muted` | `#5f6368` | `--color-google-light-text-secondary` |
| 101 | `--google-accent` | `#1a73e8` | `--color-google-accent-dark` |
| 102 | `--google-accent-bg` | `#e8f0fe` | `--color-google-accent-bg-light` |
| 103 | `--google-link-color` | `#1a0dab` | `--color-google-link-classic` |
| 104 | `--google-divider` | `#dfe1e5` | `--color-google-light-border` |
| 105 | `--google-input-bg` | `#ffffff` | `--color-google-light-bg` |
| 106 | `--google-overlay` | `rgba(0, 0, 0, 0.1)` | `--color-overlay-light` |

### Facebook Theme Variables (Dark Mode)
Lines 50-61:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 50 | `--facebook-bg` | `#18191a` | `--color-facebook-dark-bg` |
| 51 | `--facebook-surface` | `#242526` | `--color-facebook-dark-surface` |
| 52 | `--facebook-border` | `#3e4042` | `--color-facebook-dark-border` |
| 53 | `--facebook-text-primary` | `#e4e6eb` | `--color-facebook-dark-text-primary` |
| 54 | `--facebook-text-secondary` | `#b0b3b8` | `--color-facebook-dark-text-secondary` |
| 55 | `--facebook-text-muted` | `#65676b` | `--color-facebook-dark-text-muted` |
| 56 | `--facebook-accent` | `#2d88ff` | `--color-facebook-accent` |
| 57 | `--facebook-link-color` | `#2d88ff` | `--color-facebook-accent` |
| 58 | `--facebook-divider` | `#3e4042` | `--color-facebook-dark-border` |
| 59 | `--facebook-input-bg` | `#242526` | `--color-facebook-dark-surface` |
| 60 | `--facebook-gradient` | `linear-gradient(135deg, #2d88ff 0%, #1877f2 100%)` | `--gradient-facebook` |
| 61 | `--facebook-gradient-hover` | `linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)` | `--gradient-facebook-hover` |

### Facebook Theme Variables (Light Mode)
Lines 109-120:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 109 | `--facebook-bg` | `#f0f2f5` | `--color-facebook-light-bg` |
| 110 | `--facebook-surface` | `#ffffff` | `--color-facebook-light-surface` |
| 111 | `--facebook-border` | `#ced0d4` | `--color-facebook-light-border` |
| 112 | `--facebook-text-primary` | `#050505` | `--color-facebook-light-text-primary` |
| 113 | `--facebook-text-secondary` | `#65676b` | `--color-facebook-light-text-secondary` |
| 114 | `--facebook-text-muted` | `#b0b3b8` | `--color-facebook-light-text-muted` |
| 115 | `--facebook-accent` | `#1877f2` | `--color-facebook-accent-primary` |
| 116 | `--facebook-link-color` | `#1877f2` | `--color-facebook-accent-primary` |
| 117 | `--facebook-divider` | `#ced0d4` | `--color-facebook-light-border` |
| 118 | `--facebook-input-bg` | `#ffffff` | `--color-facebook-light-surface` |
| 119 | `--facebook-gradient` | `linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)` | `--gradient-facebook-light` |
| 120 | `--facebook-gradient-hover` | `linear-gradient(135deg, #2d88ff 0%, #1877f2 100%)` | `--gradient-facebook-hover` |

### LinkedIn Theme Variables (Dark Mode)
Lines 64-75:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 64 | `--linkedin-bg` | `#1d2226` | `--color-linkedin-dark-bg` |
| 65 | `--linkedin-surface` | `#282c31` | `--color-linkedin-dark-surface` |
| 66 | `--linkedin-border` | `#384147` | `--color-linkedin-dark-border` |
| 67 | `--linkedin-text-primary` | `#e4e9ee` | `--color-linkedin-dark-text-primary` |
| 68 | `--linkedin-text-secondary` | `#9ca3af` | `--color-linkedin-dark-text-secondary` |
| 69 | `--linkedin-text-muted` | `#6e7680` | `--color-linkedin-dark-text-muted` |
| 70 | `--linkedin-accent` | `#0a66c2` | `--color-linkedin-accent-primary` |
| 71 | `--linkedin-link-color` | `#0a66c2` | `--color-linkedin-accent-primary` |
| 72 | `--linkedin-divider` | `#384147` | `--color-linkedin-dark-border` |
| 73 | `--linkedin-input-bg` | `#282c31` | `--color-linkedin-dark-surface` |
| 74 | `--linkedin-gradient` | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | `--gradient-linkedin` |
| 75 | `--linkedin-gradient-hover` | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | `--gradient-linkedin-hover` |

### LinkedIn Theme Variables (Light Mode)
Lines 123-134:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 123 | `--linkedin-bg` | `#f3f6f8` | `--color-linkedin-light-bg` |
| 124 | `--linkedin-surface` | `#ffffff` | `--color-linkedin-light-surface` |
| 125 | `--linkedin-border` | `#e0e0e0` | `--color-linkedin-light-border` |
| 126 | `--linkedin-text-primary` | `#191919` | `--color-linkedin-light-text-primary` |
| 127 | `--linkedin-text-secondary` | `#666666` | `--color-linkedin-light-text-secondary` |
| 128 | `--linkedin-text-muted` | `#999999` | `--color-linkedin-light-text-muted` |
| 129 | `--linkedin-accent` | `#0a66c2` | `--color-linkedin-accent-primary` |
| 130 | `--linkedin-link-color` | `#0a66c2` | `--color-linkedin-accent-primary` |
| 131 | `--linkedin-divider` | `#e0e0e0` | `--color-linkedin-light-border` |
| 132 | `--linkedin-input-bg` | `#ffffff` | `--color-linkedin-light-surface` |
| 133 | `--linkedin-gradient` | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | `--gradient-linkedin` |
| 134 | `--linkedin-gradient-hover` | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | `--gradient-linkedin-hover` |

### YouTube Theme Variables (Dark Mode)
Lines 160-172:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 160 | `--youtube-bg` | `#0f0f0f` | `--color-youtube-dark-bg` |
| 161 | `--youtube-surface` | `#1a1a1a` | `--color-youtube-dark-surface` |
| 162 | `--youtube-border` | `#303030` | `--color-youtube-dark-border` |
| 163 | `--youtube-text-primary` | `#ffffff` | `--color-text-light-primary` |
| 164 | `--youtube-text-secondary` | `#aaaaaa` | `--color-youtube-dark-text-secondary` |
| 165 | `--youtube-text-muted` | `#666666` | `--color-text-dark-secondary` |
| 166 | `--youtube-accent` | `#ff0000` | `--color-youtube-red` |
| 167 | `--youtube-accent-bg` | `#cc0000` | `--color-youtube-red-dark` |
| 168 | `--youtube-link-color` | `#3ea6ff` | `--color-youtube-link` |
| 169 | `--youtube-divider` | `#303030` | `--color-youtube-dark-border` |
| 170 | `--youtube-input-bg` | `#1a1a1a` | `--color-youtube-dark-surface` |
| 171 | `--youtube-overlay` | `rgba(0, 0, 0, 0.8)` | `--color-overlay-dark-heavy` |

### YouTube Theme Variables (Light Mode)
Lines 176-188:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 176 | `--youtube-bg` | `#ffffff` | `--color-bg-light-primary` |
| 177 | `--youtube-surface` | `#f9f9f9` | `--color-youtube-light-surface` |
| 178 | `--youtube-border` | `#e5e5e5` | `--color-youtube-light-border` |
| 179 | `--youtube-text-primary` | `#0f0f0f` | `--color-youtube-light-text-primary` |
| 180 | `--youtube-text-secondary` | `#606060` | `--color-youtube-light-text-secondary` |
| 181 | `--youtube-text-muted` | `#999999` | `--color-text-light-muted` |
| 182 | `--youtube-accent` | `#cc0000` | `--color-youtube-red-dark` |
| 183 | `--youtube-accent-bg` | `#ff0000` | `--color-youtube-red` |
| 184 | `--youtube-link-color` | `#065fd4` | `--color-youtube-link-blue` |
| 185 | `--youtube-divider` | `#e5e5e5` | `--color-youtube-light-border` |
| 186 | `--youtube-input-bg` | `#ffffff` | `--color-bg-light-primary` |
| 187 | `--youtube-overlay` | `rgba(0, 0, 0, 0.1)` | `--color-overlay-light` |

### Twitch Theme Variables (Dark Mode)
Lines 192-204:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 192 | `--twitch-bg` | `#0e0e10` | `--color-twitch-dark-bg` |
| 193 | `--twitch-surface` | `#18181b` | `--color-twitch-dark-surface` |
| 194 | `--twitch-border` | `#2d2d31` | `--color-twitch-dark-border` |
| 195 | `--twitch-text-primary` | `#efeff1` | `--color-twitch-dark-text-primary` |
| 196 | `--twitch-text-secondary` | `#b5b5b5` | `--color-twitch-dark-text-secondary` |
| 197 | `--twitch-text-muted` | `#71717a` | `--color-text-dark-muted` |
| 198 | `--twitch-accent` | `#9146ff` | `--color-twitch-purple` |
| 199 | `--twitch-accent-bg` | `#772ce8` | `--color-twitch-purple-dark` |
| 200 | `--twitch-link-color` | `#9146ff` | `--color-twitch-purple` |
| 201 | `--twitch-divider` | `#2d2d31` | `--color-twitch-dark-border` |
| 202 | `--twitch-input-bg` | `#18181b` | `--color-twitch-dark-surface` |
| 203 | `--twitch-overlay` | `rgba(0, 0, 0, 0.75)` | `--color-overlay-dark-heavy` |

### Twitch Theme Variables (Light Mode)
Lines 208-220:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 208 | `--twitch-bg` | `#ffffff` | `--color-bg-light-primary` |
| 209 | `--twitch-surface` | `#f7f7f7` | `--color-twitch-light-surface` |
| 210 | `--twitch-border` | `#e5e5e5` | `--color-twitch-light-border` |
| 211 | `--twitch-text-primary` | `#0e0e10` | `--color-twitch-light-text-primary` |
| 212 | `--twitch-text-secondary` | `#53535f` | `--color-twitch-light-text-secondary` |
| 213 | `--twitch-text-muted` | `#9e9ea7` | `--color-twitch-light-text-muted` |
| 214 | `--twitch-accent` | `#9146ff` | `--color-twitch-purple` |
| 215 | `--twitch-accent-bg` | `#e9d5ff` | `--color-twitch-purple-light` |
| 216 | `--twitch-link-color` | `#9146ff` | `--color-twitch-purple` |
| 217 | `--twitch-divider` | `#e5e5e5` | `--color-twitch-light-border` |
| 218 | `--twitch-input-bg` | `#ffffff` | `--color-bg-light-primary` |
| 219 | `--twitch-overlay` | `rgba(0, 0, 0, 0.5)` | `--color-overlay-dark` |

### Instagram Theme Variables (Dark Mode)
Lines 224-237:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 224 | `--instagram-bg` | `#000000` | `--color-instagram-black` |
| 225 | `--instagram-surface` | `#000000` | `--color-instagram-black` |
| 226 | `--instagram-border` | `#262626` | `--color-instagram-dark-border` |
| 227 | `--instagram-text-primary` | `#ffffff` | `--color-text-light-primary` |
| 228 | `--instagram-text-secondary` | `#a8a8a8` | `--color-instagram-dark-text-secondary` |
| 229 | `--instagram-text-muted` | `#737373` | `--color-instagram-dark-text-muted` |
| 230 | `--instagram-accent` | `#0095f6` | `--color-instagram-blue` |
| 231 | `--instagram-accent-bg` | `#0095f6` | `--color-instagram-blue` |
| 232 | `--instagram-link-color` | `#0095f6` | `--color-instagram-blue` |
| 233 | `--instagram-divider` | `#262626` | `--color-instagram-dark-border` |
| 234 | `--instagram-input-bg` | `#000000` | `--color-instagram-black` |
| 235 | `--instagram-overlay` | `rgba(0, 0, 0, 0.8)` | `--color-overlay-dark-heavy` |
| 236 | `--instagram-gradient` | `linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)` | `--gradient-instagram-rainbow` |

### Instagram Theme Variables (Light Mode)
Lines 241-254:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 241 | `--instagram-bg` | `#ffffff` | `--color-bg-light-primary` |
| 242 | `--instagram-surface` | `#ffffff` | `--color-bg-light-primary` |
| 243 | `--instagram-border` | `#dbdbdb` | `--color-instagram-light-border` |
| 244 | `--instagram-text-primary` | `#000000` | `--color-instagram-light-text-primary` |
| 245 | `--instagram-text-secondary` | `#737373` | `--color-instagram-light-text-secondary` |
| 246 | `--instagram-text-muted` | `#a8a8a8` | `--color-instagram-light-text-muted` |
| 247 | `--instagram-accent` | `#0095f6` | `--color-instagram-blue` |
| 248 | `--instagram-accent-bg` | `#0095f6` | `--color-instagram-blue` |
| 249 | `--instagram-link-color` | `#0095f6` | `--color-instagram-blue` |
| 250 | `--instagram-divider` | `#dbdbdb` | `--color-instagram-light-border` |
| 251 | `--instagram-input-bg` | `#ffffff` | `--color-bg-light-primary` |
| 252 | `--instagram-overlay` | `rgba(0, 0, 0, 0.1)` | `--color-overlay-light` |
| 253 | `--instagram-gradient` | `linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)` | `--gradient-instagram-rainbow` |

### Twitter/X Theme Variables (Dark Mode)
Lines 258-284:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 258 | `--twitter-bg` | `#000000` | `--color-twitter-black` |
| 259 | `--twitter-surface` | `#16181c` | `--color-twitter-dark-surface` |
| 260 | `--twitter-border` | `#2f3336` | `--color-twitter-dark-border` |
| 261 | `--twitter-text-primary` | `#e7e9ea` | `--color-twitter-dark-text-primary` |
| 262 | `--twitter-text-secondary` | `#71767b` | `--color-twitter-dark-text-secondary` |
| 263 | `--twitter-text-muted` | `#71767b` | `--color-twitter-dark-text-secondary` |
| 264 | `--twitter-accent` | `#1d9bf0` | `--color-twitter-blue` |
| 265 | `--twitter-accent-bg` | `#1a8cd8` | `--color-twitter-blue-dark` |
| 266 | `--twitter-link-color` | `#1d9bf0` | `--color-twitter-blue` |
| 267 | `--twitter-divider` | `#2f3336` | `--color-twitter-dark-border` |
| 268 | `--twitter-input-bg` | `#16181c` | `--color-twitter-dark-surface` |
| 269 | `--twitter-overlay` | `rgba(0, 0, 0, 0.8)` | `--color-overlay-dark-heavy` |
| 271 | `--x-bg-primary` | `#000000` | `--color-twitter-black` |
| 272 | `--x-bg-secondary` | `#16181c` | `--color-twitter-dark-surface` |
| 273 | `--x-bg-tertiary` | `#2f3336` | `--color-twitter-dark-border` |
| 274 | `--x-border-color` | `#2f3336` | `--color-twitter-dark-border` |
| 275 | `--x-text-primary` | `#e7e9ea` | `--color-twitter-dark-text-primary` |
| 276 | `--x-text-secondary` | `#71767b` | `--color-twitter-dark-text-secondary` |
| 277 | `--x-text-muted` | `#71767b` | `--color-twitter-dark-text-secondary` |
| 278 | `--x-accent-blue` | `#1d9bf0` | `--color-twitter-blue` |
| 279 | `--x-accent-blue-hover` | `#1a8cd8` | `--color-twitter-blue-dark` |
| 280 | `--x-like-color` | `#f91880` | `--color-twitter-pink` |
| 281 | `--x-retweet-color` | `#00ba7c` | `--color-twitter-green` |
| 282 | `--x-reply-color` | `#71767b` | `--color-twitter-dark-text-secondary` |
| 283 | `--x-view-color` | `#71767b` | `--color-twitter-dark-text-secondary` |

### Twitter/X Theme Variables (Light Mode)
Lines 288-314:

| Line | Variable | Hardcoded | Proposed |
|------|-----------|-----------|----------|
| 288 | `--twitter-bg` | `#ffffff` | `--color-bg-light-primary` |
| 289 | `--twitter-surface` | `#f7f9f9` | `--color-twitter-light-surface` |
| 290 | `--twitter-border` | `#eff3f4` | `--color-twitter-light-border` |
| 291 | `--twitter-text-primary` | `#0f1419` | `--color-twitter-light-text-primary` |
| 292 | `--twitter-text-secondary` | `#536471` | `--color-twitter-light-text-secondary` |
| 293 | `--twitter-text-muted` | `#536471` | `--color-twitter-light-text-secondary` |
| 294 | `--twitter-accent` | `#1d9bf0` | `--color-twitter-blue` |
| 295 | `--twitter-accent-bg` | `#1a8cd8` | `--color-twitter-blue-dark` |
| 296 | `--twitter-link-color` | `#1d9bf0` | `--color-twitter-blue` |
| 297 | `--twitter-divider` | `#eff3f4` | `--color-twitter-light-border` |
| 298 | `--twitter-input-bg` | `#ffffff` | `--color-bg-light-primary` |
| 299 | `--twitter-overlay` | `rgba(0, 0, 0, 0.1)` | `--color-overlay-light` |
| 301 | `--x-bg-primary` | `#ffffff` | `--color-bg-light-primary` |
| 302 | `--x-bg-secondary` | `#f7f9f9` | `--color-twitter-light-surface` |
| 303 | `--x-bg-tertiary` | `#eff3f4` | `--color-twitter-light-border` |
| 304 | `--x-border-color` | `#eff3f4` | `--color-twitter-light-border` |
| 305 | `--x-text-primary` | `#0f1419` | `--color-twitter-light-text-primary` |
| 306 | `--x-text-secondary` | `#536471` | `--color-twitter-light-text-secondary` |
| 307 | `--x-text-muted` | `#536471` | `--color-twitter-light-text-secondary` |
| 308 | `--x-accent-blue` | `#1d9bf0` | `--color-twitter-blue` |
| 309 | `--x-accent-blue-hover` | `#1a8cd8` | `--color-twitter-blue-dark` |
| 310 | `--x-like-color` | `##f91880` | `--color-twitter-pink` |
| 311 | `--x-retweet-color` | `#00ba7c` | `--color-twitter-green` |
| 312 | `--x-reply-color` | `#536471` | `--color-twitter-light-text-secondary` |
| 313 | `--x-view-color` | `#536471` | `--color-twitter-light-text-secondary` |

### Hardcoded Fallback Values in Variable Hooks
Lines 738-773 (and similar patterns throughout):

| Line | Context | Hardcoded Value | Issue |
|------|---------|-----------------|-------|
| 738 | `.facebook-context` fallback | `linear-gradient(135deg, #2d88ff 0%, #1877f2 100%)` | Duplicate gradient definition |
| 739 | `.facebook-context` fallback | `linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)` | Duplicate gradient definition |
| 772 | `.linkedin-context` fallback | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | Duplicate gradient definition |
| 773 | `.linkedin-context` fallback | `linear-gradient(135deg, #0a66c2 0%, #004182 100%)` | Duplicate gradient definition |

---

## 3. src/public/social-platforms-frames.css

**Status:** ⚠️ **HARDCODED COLORS IN COMPONENT STYLES**

### Hardcoded Colors Found

| Line | Selector | Property | Hardcoded Value | Proposed Variable |
|------|----------|----------|-----------------|------------------|
| 51 | `.facebook-context .fb-avatar` | `color` | `#ffffff` | `--color-text-light-primary` |
| 145 | `.facebook-context .fb-context-placeholder` | `color` | `#ffffff` | `--color-text-light-primary` |
| 215 | `.instagram-context .ig-avatar` | `color` | `#ffffff` | `--color-text-light-primary` |
| 268 | `.instagram-context .ig-context-placeholder` | `color` | `#ffffff` | `--color-text-light-primary` |
| 363 | `.linkedin-context .li-avatar` | `color` | `#ffffff` | `--color-text-light-primary` |
| 424 | `.linkedin-context .li-context-placeholder` | `color` | `#ffffff` | `--color-text-light-primary` |

### Notes

All instances of `#ffffff` (white) are used for avatar placeholder text and should be replaced with a semantic variable that can adapt to the theme context.

---

## Summary Statistics

| File | Total Hardcoded Values | Type |
|------|----------------------|-----|
| `frame-layouts.css` | 0 | ✅ Clean |
| `frames-theme.css` | ~180+ | CSS Variable Definitions |
| `social-platforms-frames.css` | 6 | Component Styles |

**Total Hardcoded Colors:** ~186+

---

## Recommendations

1. **Priority 1: Extract Common Colors**
   - Create a base color palette for frequently used values:
     - `#ffffff` → `--color-white`
     - `#000000` → `--color-black`
     - `rgba(0, 0, 0, 0.1)` → `--overlay-light`
     - `rgba(0, 0, 0, 0.5)` → `--overlay-medium`
     - `rgba(0, 0, 0, 0.8)` → `--overlay-heavy`

2. **Priority 2: Standardize Variable Naming**
   - Use consistent naming conventions across all platforms
   - Pattern: `--{platform}-{mode}-{element}-{state}`
   - Example: `--facebook-dark-bg-primary`, `--facebook-light-bg-primary`

3. **Priority 3: Eliminate Duplicate Definitions**
   - Gradients are defined in multiple places (variable definitions AND fallbacks)
   - Create a single source of truth for each gradient

4. **Priority 4: Component Color Abstraction**
   - Replace hardcoded `#ffffff` in component files with semantic variables
   - Ensure avatar text colors adapt to dark/light mode context

---

## Next Steps

1. Create a comprehensive color token system
2. Refactor variable definitions to use semantic tokens
3. Update component styles to use semantic variables
4. Test dark/light mode switching across all platforms
5. Document final variable naming convention

---

**End of Catalog**
