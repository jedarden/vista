# Bead bf-xpp8d: DOM Element Mapping for Filter Handlers

## Task Completed
Located DOM elements for each filter handler in `/home/coding/vista/src/public/app.js`.

## Handler to DOM Element Mapping

### Single-Attachment Handlers (8 handlers)

| Handler | DOM Selector | Event Type | Line Number |
|---------|--------------|-------------|-------------|
| generateCodeSnippet | `#snippetFramework` | change | 6813 |
| handleBgImageUpload | `#oggenBgImageInput` | change | 315 |
| handleBgTypeChange | `#oggenBgType` | change | 310 |
| handleHeatmapSort | `#heatmapSort` | change | 332 |
| handleLogoPosChange | `#oggenLogoPos` | change | 321 |
| handleLogoUpload | `#oggenLogoInput` | change | 322 |
| importPreferences | `#importPrefsInput` | change | 6831 |
| updateBadgePreview | `#badgeStyleSelect` | change | 296 |

### Multi-Attachment Handler (1 handler)

**updateOggenCanvas** - Attached to 10 different elements:

| DOM Selector | Event Type | Line Number |
|--------------|------------|-------------|
| `#oggenBgColor` | input | 311 |
| `#oggenGradientStart` | input | 312 |
| `#oggenGradientEnd` | input | 313 |
| `#oggenGradientDir` | change | 314 |
| `#oggenBgImageSize` | change | 316 |
| `#oggenTitle` | input | 317 |
| `#oggenSubtitle` | input | 318 |
| `#oggenFont` | change | 319 |
| `#oggenTextColor` | input | 320 |
| `#oggenLogoSize` | input | 323 |

## Key Findings

1. **Safe attachment pattern**: All handlers use optional chaining (`?.`) to prevent errors if elements don't exist
2. **Cached DOM references**: Most handlers use pre-cached element variables via the `$` helper function
3. **Event types**: Handlers use either `input` (for real-time updates on text/color inputs) or `change` (for discrete selections)
4. **Special case**: `updateOggenCanvas` is the OG generator's central update function, called by 10 different form controls

## Output File
Complete mapping saved to: `/tmp/handler-to-element-mapping.json`

## Acceptance Criteria Met
✅ For each handler, identified the target DOM element selector
✅ Handled ambiguous cases (updateOggenCanvas has 10 attachments)
✅ Saved intermediate mapping to /tmp/handler-to-element-mapping.json
