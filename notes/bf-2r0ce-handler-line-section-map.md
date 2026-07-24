# Filter Change Handler → Line Number → Section Mapping

Structured mapping of each filter change handler to its exact location in `/home/coding/vista/src/public/app.js`

## Mapping Structure

```javascript
{
  "handlerName": {
    "line": <number>,
    "section": "<section_name>",
    "type": "<named_function|inline_handler|guard_function|render_function>"
  }
}
```

## Primary Filter Handler Functions

| Handler | Line | Section | Type |
|---------|------|---------|------|
| `syncGroupToggles` | 3530 | Cropper Section | named_function |
| `updateEnabledPlatforms` | 3551 | Cropper Section | named_function |
| `updateCropperOverlay` | 3600 | Cropper Section | named_function |
| `renderMetadataTable` | 3941 | Metadata Section | named_function |
| `handleHeatmapSort` | 6101 | Sitemap/Heatmap Section | named_function |
| `toggleFavorite` | 7867 | Platform Preferences Section | named_function |
| `toggleHidden` | 7977 | Platform Preferences Section | named_function |
| `updateFavoritesList` | 7990 | Platform Preferences Section | named_function |
| `filterCommands` | 9177 | Command Palette Section | named_function |

## Render Functions Triggered by Filters

| Handler | Line | Section | Type |
|---------|------|---------|------|
| `renderPreviews` | 1583 | Main Rendering Section | render_function |
| `renderTextPreviewsOnly` | 1728 | Main Rendering Section | render_function |
| `updatePreviewsWithEdits` | 6737 | Editor Section | render_function |

## Guard Functions for Filter Operations

| Handler | Line | Section | Type |
|---------|------|---------|------|
| `shouldDeferFilterOperation` | 7891 | Smart Ordering Section | guard_function |
| `isSmartOrdering` | 7933 | Smart Ordering Section | guard_function |
| `queueFilterOperation` | 7942 | Smart Ordering Section | guard_function |
| `processPendingFilterOperations` | 7952 | Smart Ordering Section | guard_function |

## Inline Filter Handlers (addEventListener callbacks)

| Location | Line | Section | Target Element | Handler Action |
|----------|------|---------|----------------|----------------|
| Inline handler | 3481 | Cropper Section | `.cropper-group-toggle` | Group checkbox change → toggles all platforms in group |
| Inline handler | 3497 | Cropper Section | `.cropper-platform-toggle input` | Platform checkbox change → updates enabled platforms |
| Inline handler | 3991 | Metadata Section | `#metadataFilterInput` | Text input → re-renders metadata table with filter |
| Inline handler | 8207 | What-If Panel Section | `.what-if-toggle input` | Checkbox toggle → updates disabled tags set |

## JSON Format

```json
{
  "primary_handlers": {
    "syncGroupToggles": {"line": 3530, "section": "Cropper Section", "type": "named_function"},
    "updateEnabledPlatforms": {"line": 3551, "section": "Cropper Section", "type": "named_function"},
    "updateCropperOverlay": {"line": 3600, "section": "Cropper Section", "type": "named_function"},
    "renderMetadataTable": {"line": 3941, "section": "Metadata Section", "type": "named_function"},
    "handleHeatmapSort": {"line": 6101, "section": "Sitemap/Heatmap Section", "type": "named_function"},
    "toggleFavorite": {"line": 7867, "section": "Platform Preferences Section", "type": "named_function"},
    "toggleHidden": {"line": 7977, "section": "Platform Preferences Section", "type": "named_function"},
    "updateFavoritesList": {"line": 7990, "section": "Platform Preferences Section", "type": "named_function"},
    "filterCommands": {"line": 9177, "section": "Command Palette Section", "type": "named_function"}
  },
  "render_functions": {
    "renderPreviews": {"line": 1583, "section": "Main Rendering Section", "type": "render_function"},
    "renderTextPreviewsOnly": {"line": 1728, "section": "Main Rendering Section", "type": "render_function"},
    "updatePreviewsWithEdits": {"line": 6737, "section": "Editor Section", "type": "render_function"}
  },
  "guard_functions": {
    "shouldDeferFilterOperation": {"line": 7891, "section": "Smart Ordering Section", "type": "guard_function"},
    "isSmartOrdering": {"line": 7933, "section": "Smart Ordering Section", "type": "guard_function"},
    "queueFilterOperation": {"line": 7942, "section": "Smart Ordering Section", "type": "guard_function"},
    "processPendingFilterOperations": {"line": 7952, "section": "Smart Ordering Section", "type": "guard_function"}
  },
  "inline_handlers": {
    "cropper_group_toggle": {"line": 3481, "section": "Cropper Section", "target": ".cropper-group-toggle"},
    "cropper_platform_toggle": {"line": 3497, "section": "Cropper Section", "target": ".cropper-platform-toggle input"},
    "metadata_filter_input": {"line": 3991, "section": "Metadata Section", "target": "#metadataFilterInput"},
    "what_if_toggle": {"line": 8207, "section": "What-If Panel Section", "target": ".what-if-toggle input"}
  }
}
```

## Summary

**Total Filter Change Handlers: 16**

- **Primary named functions:** 9
- **Render functions:** 3  
- **Guard functions:** 4
- **Inline handlers:** 4

**Spatial Distribution by Section:**
- Cropper Section: 3 handlers (lines 3530-3600)
- Platform Preferences Section: 3 handlers (lines 7867-7990)
- Smart Ordering Section: 4 handlers (lines 7891-7952)
- Metadata Section: 1 handler (line 3941) + 1 inline (line 3991)
- Command Palette Section: 1 handler (line 9177)
- Sitemap/Heatmap Section: 1 handler (line 6101)
- Main Rendering Section: 2 handlers (lines 1583, 1728)
- Editor Section: 1 handler (line 6737)
- What-If Panel Section: 1 inline handler (line 8207)
