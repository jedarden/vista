# Skeleton Mappings and Scoring Rules Verification

**Date:** 2026-07-23
**Bead:** bf-345i5

## Summary

✅ **All 43 platforms have proper skeleton type mappings**
✅ **All skeleton types are valid (tall, short, text_only)**
✅ **All scoring rules execute without errors**
✅ **No orphaned skeleton mappings found**

## Platform Skeleton Type Mappings

### TALL Skeleton Type (Image-on-top layout)
Used for content-heavy platforms and social media where the image is prominent.

**Social & Microblogging:**
- Facebook (`facebook`)
- X/Twitter (`twitter`)
- LinkedIn (`linkedin`)
- Reddit (`reddit`)
- Mastodon (`mastodon`)
- Bluesky (`bluesky`)
- Threads (`threads`)
- Tumblr (`tumblr`)
- Pinterest (`pinterest`)

**Content Platforms:**
- Medium (`medium`)
- Dev.to (`devto`)
- Substack (`substack`)

**Image & Video Platforms:**
- YouTube (`youtube`)
- Instagram (`instagram`)
- TikTok (`tiktok`)

**Product Discovery:**
- Product Hunt (`producthunt`)

**Social & Discussion:**
- Hacker News (`hackernews`)

**Total TALL platforms:** 18

### SHORT Skeleton Type (Thumbnail-left layout)
Used for messaging apps, collaboration tools, and productivity platforms where space is at a premium.

**Messaging:**
- Slack (`slack`)
- Discord (`discord`)
- WhatsApp (`whatsapp`)
- iMessage (`imessage`)
- Telegram (`telegram`)
- Signal (`signal`)
- Microsoft Teams (`teams`)
- Google Chat (`googlechat`)
- Zoom Chat (`zoom`)
- Line (`line`)
- KakaoTalk (`kakaotalk`)

**Collaboration & Productivity:**
- Notion (`notion`)
- Jira/Confluence (`jira`)
- GitHub (`github`)
- GitLab (`gitlab`)
- Trello (`trello`)
- Figma (`figma`)
- Asana (`asana`)
- Evernote (`evernote`)

**Email:**
- Outlook (`outlook`)
- Gmail (`gmail`)

**RSS / Readers:**
- Feedly (`feedly`)

**Developer Tools:**
- VS Code (`vscode`)
- JetBrains IDEs (`jetbrains`)
- Stack Overflow (`stackoverflow`)

**Total SHORT platforms:** 24

### TEXT_ONLY Skeleton Type (No image region)
Used for search results where text is the primary focus.

**Search:**
- Google Search (`google`)

**Total TEXT_ONLY platforms:** 1

## Platform Distribution

```
TALL:      18 platforms (41.9%)
SHORT:     24 platforms (55.8%)
TEXT_ONLY:  1 platform  (2.3%)
TOTAL:     43 platforms
```

## Scoring Rules Verification

All platforms have scoring rules that execute without errors. The scoring system:

1. **Starts at 100 points** and deducts for missing metadata
2. **Assigns grades** based on final score:
   - A+: 95-100 points
   - A: 85-94 points
   - B: 70-84 points
   - C: 55-69 points
   - D: 35-54 points
   - F: 0-34 points

### Common Scoring Criteria

**Title penalties:**
- Missing title: -40 to -60 points (platform-dependent)
- Title too long: -10 to -20 points

**Description penalties:**
- Missing description: -15 to -30 points
- Description too long: -10 to -15 points

**Image penalties:**
- Missing image: -10 to -50 points (platform-dependent)
- Image too small: -10 to -30 points
- HTTP (not HTTPS): -10 to -30 points
- Image below recommended size: -10 to -20 points

### Platform-Specific Rules

**High-penalty platforms (title-focused):**
- Google Search: -50 for missing title, -30 for missing description
- Hacker News: -60 for missing title (relies heavily on title)
- Product Hunt: -50 for missing title, -30 for missing description

**Image-critical platforms:**
- Pinterest: -50 for missing image (image-centric platform)
- Instagram: -40 for missing image, -20 for non-HTTPS
- WhatsApp: -30 for missing image, -30 for HTTP (HTTPS required)
- Discord: -25 for missing image, -15 for HTTP

**HTTPS-required platforms:**
- Discord, Instagram, Signal, WhatsApp, GitLab, Email clients
- These platforms ignore or penalize HTTP image URLs

## Edge Cases Tested

✅ Empty metadata (all null/missing)
✅ HTTP image URLs (properly penalized)
✅ Oversized titles/descriptions (properly truncated warnings)
✅ Missing image probe data
✅ All platforms handle missing metadata gracefully

## Test Results

**Verification script:** `verify-skeleton-mappings.js`

```bash
Total platforms checked: 43
Skeleton mappings verified: 43
Passed tests: 86
✅ All verifications passed!
```

### Test Scenarios

1. **Complete metadata with optimal image:**
   - Overall grade: A+ (100)
   - 42 platforms with A+, 1 platform with A

2. **Empty metadata (all fields missing):**
   - Overall grade: F (15)
   - All platforms properly penalized

3. **HTTP image URLs:**
   - Properly penalized for HTTPS-requiring platforms
   - Issues logged correctly

## Conclusion

The skeleton type mapping and scoring rules are complete and properly implemented:

- ✅ No missing skeleton type mappings
- ✅ No invalid skeleton types
- ✅ No orphaned mappings (platforms in skeleton-types but not scorer.js)
- ✅ All scoring rules execute without errors
- ✅ Edge cases handled gracefully
- ✅ Platform-appropriate penalties applied correctly

The verification confirms that all 43 platforms in scorer.js have corresponding skeleton type mappings in skeleton-types.js, and all skeleton types are valid values from the SKELETON_TYPES enum.
