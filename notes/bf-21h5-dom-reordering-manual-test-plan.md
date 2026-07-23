# DOM Reordering Verification Test Plan

## Test Objective
Verify that DOM reordering matches expected platform preference order when different URL types are inspected in VISTA.

## Application Context
- Server running on: http://localhost:3000
- Smart ordering feature: Automatically reorders platform cards based on detected page type
- Page types detected: article, product, video, website (default)

## Platform Order Rules by Page Type

### Article Page Type
- **Detection**: `og:type=article`, schema.org Article/NewsArticle, or URL patterns like `/blog/`, `/article/`, `/post/`
- **Expected platform order**: `twitter, facebook, linkedin, reddit, bluesky, threads, mastodon`
- **Rationale**: Articles are prioritized for text-based social sharing platforms

### Product Page Type
- **Detection**: `og:type=product`, schema.org Product, or URL patterns like `/product/`, `/shop/`, `/item/`
- **Expected platform order**: `pinterest, facebook, instagram, twitter, linkedin`
- **Rationale**: Products benefit from visual-first platforms (Pinterest, Instagram)

### Video Page Type
- **Detection**: `og:type=video`, or schema.org VideoObject
- **Expected platform order**: `twitter, facebook, youtube, tiktok, instagram`
- **Rationale**: Video content prioritizes video-capable platforms

### Website (Default) Page Type
- **Detection**: Any URL not matching specific patterns
- **Expected platform order**: `google, facebook, twitter, linkedin, slack, discord`
- **Rationale**: General web presence prioritizes SEO and broad social networks

## Test Cases

### Test Case 1: Article Page
- **URL**: `https://blog.example.com/2024/07/my-article`
- **Expected Page Type**: `article`
- **Expected Top Platforms**: twitter, facebook, linkedin, reddit
- **Manual Test Steps**:
  1. Open http://localhost:3000
  2. Open browser DevTools (F12) → Elements panel
  3. Enter URL in input field
  4. Click "Inspect" button
  5. Wait for platform cards to load
  6. In DevTools Elements panel, find `.preview-grid` container
  7. Examine `.platform-card` elements in order
  8. Verify first cards are: Twitter, Facebook, LinkedIn, Reddit

### Test Case 2: Product Page
- **URL**: `https://shop.example.com/products/awesome-product`
- **Expected Page Type**: `product`
- **Expected Top Platforms**: pinterest, facebook, instagram, twitter
- **Manual Test Steps**:
  1. Same as Test Case 1
  2. Verify first cards are: Pinterest, Facebook, Instagram, Twitter

### Test Case 3: General Website
- **URL**: `https://example.com`
- **Expected Page Type**: `website`
- **Expected Top Platforms**: google, facebook, twitter, linkedin
- **Manual Test Steps**:
  1. Same as Test Case 1
  2. Verify first cards are: Google, Facebook, Twitter, LinkedIn

## Verification Method via DevTools Console

Alternative to Elements panel - use Console to check order:

```javascript
// Get current platform order from DOM
const platforms = Array.from(document.querySelectorAll('.platform-card')).map(card => {
  return card.dataset.platform;
});
console.log('Platform order:', platforms);
console.log('First 5 platforms:', platforms.slice(0, 5));
```

## Smart Ordering Implementation Verification

The code implements smart ordering as follows:
1. `detectPageType(meta)` determines page type from meta tags and URL patterns
2. `getPlatformOrderForPageType(pageType)` returns expected platform order
3. `applySmartOrdering()` sorts platform cards according to preferred order
4. New order is persisted to `localStorage['vista-platform-prefs']`
5. `renderPreviews()` re-renders cards in the new order

## Expected localStorage State

After smart ordering runs, localStorage should contain:
```json
{
  "favorites": [],
  "hidden": [],
  "columnCount": 3,
  "smartOrdering": true,
  "cardOrder": {
    "social": ["twitter", "facebook", "linkedin", "reddit", ...],
    "messaging": ["whatsapp", "telegram", ...],
    "collaboration": ["slack", "discord", ...]
  }
}
```

## Test Execution Notes

- Browser automation (puppeteer) is not available due to system library constraints
- Manual verification using browser DevTools is required
- Each test case should be run independently
- Clear localStorage between tests if needed: `localStorage.clear()`
