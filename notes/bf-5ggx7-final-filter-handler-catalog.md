# Vista Filter Change Handler Catalog - Final Structured Output

**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Bead:** bf-5ggx7  
**Purpose:** Comprehensive structured catalog of all filter change handlers with locations, context, and relationships

---

## Complete Handler Catalog (JSON Format)

```json
{
  "metadata": {
    "source_file": "/home/coding/vista/src/public/app.js",
    "total_handlers": 26,
    "catalog_date": "2026-07-24",
    "catalog_bead": "bf-5ggx7",
    "description": "Complete catalog of all filter change handlers with locations, types, and relationships"
  },
  "handlers": {
    "named_functions": {
      "syncGroupToggles": {
        "line": 3530,
        "section": "Cropper Section",
        "type": "named_function",
        "purpose": "Syncs group header checkboxes with child platform states",
        "operations": [
          "Sets header to checked/unchecked/indeterminate based on children",
          "Called by cropper group/platform toggle handlers"
        ],
        "triggers": ["Group checkbox changes", "Platform checkbox changes"]
      },
      "updateEnabledPlatforms": {
        "line": 3551,
        "section": "Cropper Section",
        "type": "named_function",
        "purpose": "Updates the set of enabled platforms from checkbox states",
        "operations": [
          "Updates cropperState.enabledPlatforms set",
          "Calls renderCategoryLegend() to sync legend display"
        ],
        "triggers": ["Platform checkbox changes", "Group checkbox changes"]
      },
      "updateCropperOverlay": {
        "line": 3600,
        "section": "Cropper Section",
        "type": "named_function",
        "purpose": "Updates visual overlay for enabled platforms",
        "operations": ["Updates overlay to show which platforms are enabled"],
        "triggers": ["Platform selection changes"]
      },
      "renderMetadataTable": {
        "line": 3941,
        "section": "Metadata Section",
        "type": "named_function",
        "purpose": "Renders metadata table with optional filter parameter",
        "operations": [
          "Filters table rows by tag/value matching",
          "Re-renders table with filtered results"
        ],
        "triggers": ["Metadata filter input", "Initial render"]
      },
      "handleHeatmapSort": {
        "line": 6101,
        "section": "Sitemap/Heatmap Section",
        "type": "named_function",
        "purpose": "Handles sort dropdown changes for heatmap table",
        "operations": [
          "Sorts by score or URL",
          "Supports ascending/descending order",
          "Re-renders heatmap table"
        ],
        "triggers": ["Heatmap sort dropdown change"]
      },
      "toggleFavorite": {
        "line": 7867,
        "section": "Platform Preferences Section",
        "type": "named_function",
        "purpose": "Toggles favorite status for a platform",
        "operations": [
          "Adds/removes platform from favorites set",
          "Updates UI to show favorite status",
          "Wrapped with guardWrapperWithRender()"
        ],
        "triggers": ["Favorite button click"]
      },
      "toggleHidden": {
        "line": 7977,
        "section": "Platform Preferences Section",
        "type": "named_function",
        "purpose": "Toggles hidden status for a platform",
        "operations": [
          "Adds/removes platform from hidden set",
          "Re-renders platform cards",
          "Wrapped with guardWrapperWithRender()"
        ],
        "triggers": ["Hide button click"]
      },
      "updateFavoritesList": {
        "line": 7990,
        "section": "Platform Preferences Section",
        "type": "named_function",
        "purpose": "Updates the favorites list display",
        "operations": ["Re-renders favorites section with current favorites"],
        "triggers": ["Favorite changes"]
      },
      "filterCommands": {
        "line": 9177,
        "section": "Command Palette Section",
        "type": "named_function",
        "purpose": "Filters command list in palette based on input",
        "operations": [
          "Filters COMMANDS array by query string",
          "Matches against label and category",
          "Calls renderCommands() with filtered results"
        ],
        "triggers": ["Command palette input"]
      },
      "updateBadgePreview": {
        "line": 4765,
        "section": "Badge Section",
        "type": "named_function",
        "purpose": "Updates badge preview when badge style is changed",
        "operations": ["Re-renders badge with new style"],
        "triggers": ["Badge style select change"]
      },
      "handleBgTypeChange": {
        "line": 5106,
        "section": "OG Generator Section",
        "type": "named_function",
        "purpose": "Handles background type changes in OG generator",
        "operations": [
          "Toggles visibility of background controls",
          "Supports solid/gradient/image types"
        ],
        "triggers": ["OG background type change"]
      },
      "updateOggenCanvas": {
        "line": 5156,
        "section": "OG Generator Section",
        "type": "named_function",
        "purpose": "Updates OG canvas when settings change",
        "operations": ["Re-renders OG preview canvas"],
        "triggers": ["Gradient direction, image size, or font changes"]
      },
      "handleBgImageUpload": {
        "line": 5117,
        "section": "OG Generator Section",
        "type": "named_function",
        "purpose": "Handles background image upload for OG generator",
        "operations": ["Uploads and processes background image"],
        "triggers": ["Background image file input"]
      },
      "handleLogoPosChange": {
        "line": 5133,
        "section": "OG Generator Section",
        "type": "named_function",
        "purpose": "Handles logo position changes in OG generator",
        "operations": ["Toggles logo upload visibility based on position"],
        "triggers": ["Logo position change"]
      },
      "handleLogoUpload": {
        "line": 5140,
        "section": "OG Generator Section",
        "type": "named_function",
        "purpose": "Handles logo image upload for OG generator",
        "operations": ["Uploads and processes logo image"],
        "triggers": ["Logo file input"]
      },
      "generateCodeSnippet": {
        "line": 6853,
        "section": "Code Snippet Section",
        "type": "named_function",
        "purpose": "Generates code snippet when framework selection changes",
        "operations": ["Generates framework-specific code snippet"],
        "triggers": ["Framework selection change"]
      },
      "importPreferences": {
        "line": 8057,
        "section": "Preferences Section",
        "type": "named_function",
        "purpose": "Imports preferences from uploaded JSON file",
        "operations": [
          "Parses JSON preferences",
          "Applies settings with guard functions"
        ],
        "triggers": ["Preferences file upload"],
        "uses_guards": true
      }
    },
    "render_functions": {
      "renderPreviews": {
        "line": 1583,
        "section": "Main Rendering Section",
        "type": "render_function",
        "purpose": "Main render function for platform cards",
        "operations": ["Renders all platform cards with current filters"],
        "triggers": ["Filter changes", "Data updates"]
      },
      "renderTextPreviewsOnly": {
        "line": 1728,
        "section": "Main Rendering Section",
        "type": "render_function",
        "purpose": "Renders text-only version of platform cards",
        "operations": ["Renders lightweight card version"],
        "triggers": ["Filter changes in text mode"]
      },
      "updatePreviewsWithEdits": {
        "line": 6737,
        "section": "Editor Section",
        "type": "render_function",
        "purpose": "Updates previews after editor changes",
        "operations": ["Re-renders cards with edited metadata"],
        "triggers": ["Editor save operations"]
      },
      "renderCategoryLegend": {
        "line": 3568,
        "section": "Cropper Section",
        "type": "render_function",
        "purpose": "Renders the category legend showing enabled platforms",
        "operations": [
          "Shows which categories have enabled platforms",
          "Dims categories with no enabled platforms"
        ],
        "triggers": ["Platform selection changes"]
      },
      "renderCommands": {
        "line": 9085,
        "section": "Command Palette Section",
        "type": "render_function",
        "purpose": "Renders filtered command list",
        "operations": ["Displays commands from filterCommands() results"],
        "triggers": ["Command palette filter input"]
      }
    },
    "guard_functions": {
      "shouldDeferFilterOperation": {
        "line": 7891,
        "section": "Smart Ordering Section",
        "type": "guard_function",
        "purpose": "Checks if filter operation should be deferred",
        "operations": ["Returns boolean based on isSmartOrderingActive flag"],
        "used_by": ["Filter handlers during smart ordering"]
      },
      "isSmartOrdering": {
        "line": 7933,
        "section": "Smart Ordering Section",
        "type": "guard_function",
        "purpose": "Checks if smart ordering is currently active",
        "operations": [
          "Returns boolean if preference and runtime state are active",
          "Used by filter handlers to avoid conflicts"
        ],
        "used_by": ["Filter handlers", "Smart ordering system"]
      },
      "queueFilterOperation": {
        "line": 7942,
        "section": "Smart Ordering Section",
        "type": "guard_function",
        "purpose": "Queues filter operations to run after smart ordering completes",
        "operations": ["Adds operation to pendingFilterOperations queue"],
        "parameters": ["operation function", "description string"],
        "used_by": ["Filter handlers during smart ordering"]
      },
      "processPendingFilterOperations": {
        "line": 7952,
        "section": "Smart Ordering Section",
        "type": "guard_function",
        "purpose": "Processes queued filter operations after smart ordering",
        "operations": ["Executes all operations in pendingFilterOperations queue"],
        "used_by": ["Smart ordering completion handler"]
      },
      "guardWrapperWithRender": {
        "line": 7885,
        "section": "Smart Ordering Section",
        "type": "guard_function",
        "purpose": "Wraps filter operations with smart ordering guards",
        "operations": [
          "Checks if should defer",
          "Queues or executes operation",
          "Triggers render after completion"
        ],
        "used_by": ["toggleFavorite", "toggleHidden"]
      }
    },
    "inline_handlers": {
      "cropper_group_toggle": {
        "line": 3481,
        "section": "Cropper Section",
        "type": "inline_handler",
        "target_element": ".cropper-group-toggle",
        "event": "change",
        "purpose": "Toggles all platforms in a group when group header is clicked",
        "operations": [
          "Checks/unchecks all platform checkboxes in the group",
          "Calls updateEnabledPlatforms()",
          "Calls updateCropperOverlay()",
          "Calls syncGroupToggles()"
        ]
      },
      "cropper_platform_toggle": {
        "line": 3497,
        "section": "Cropper Section",
        "type": "inline_handler",
        "target_element": ".cropper-platform-toggle input",
        "event": "change",
        "purpose": "Handles individual platform visibility toggle in cropper",
        "operations": [
          "Calls updateEnabledPlatforms()",
          "Calls updateCropperOverlay()",
          "Calls syncGroupToggles()"
        ]
      },
      "metadata_filter_input": {
        "line": 3991,
        "section": "Metadata Section",
        "type": "inline_handler",
        "target_element": "#metadataFilterInput",
        "event": "input",
        "purpose": "Filters metadata table rows based on user input",
        "operations": ["Calls renderMetadataTable(e.target.value)"]
      },
      "what_if_toggle": {
        "line": 8207,
        "section": "What-If Panel Section",
        "type": "inline_handler",
        "target_element": ".what-if-toggle input",
        "event": "change",
        "purpose": "Handles tag enable/disable toggles in What If mode",
        "operations": [
          "Adds/removes tags from disabledTags set",
          "Calls updateHash() to reflect disabled tags in URL"
        ]
      },
      "what_if_reset": {
        "line": 8219,
        "section": "What-If Panel Section",
        "type": "inline_handler",
        "target_element": "#whatIfReset",
        "event": "click",
        "purpose": "Resets all What If toggles to enabled state",
        "operations": ["Clears disabledTags set and URL hash"]
      },
      "what_if_apply": {
        "line": 8220,
        "section": "What-If Panel Section",
        "type": "inline_handler",
        "target_element": "#whatIfApply",
        "event": "click",
        "purpose": "Applies What If changes and updates previews",
        "operations": [
          "Creates modified metadata with disabled tags removed",
          "Sets isFilterOperation = true guard flag",
          "Calls renderPreviews() with modified data",
          "Shows missing tag warnings"
        ]
      },
      "what_if_mode_toggle": {
        "line": 8334,
        "section": "What-If Panel Section",
        "type": "inline_handler",
        "target_element": "#whatIfToggleBtn",
        "event": "click",
        "purpose": "Toggles What If mode on/off",
        "operations": ["Opens/closes What If panel"]
      }
    }
  },
  "event_listener_setup": {
    "badge_style_select": {
      "line": 296,
      "target": "#badgeStyleSelect",
      "event": "change",
      "handler": "updateBadgePreview"
    },
    "og_bg_type": {
      "line": 310,
      "target": "#oggenBgType",
      "event": "change",
      "handler": "handleBgTypeChange"
    },
    "og_gradient_dir": {
      "line": 314,
      "target": "#oggenGradientDir",
      "event": "change",
      "handler": "updateOggenCanvas"
    },
    "og_bg_image_input": {
      "line": 315,
      "target": "#oggenBgImageInput",
      "event": "change",
      "handler": "handleBgImageUpload"
    },
    "og_bg_image_size": {
      "line": 316,
      "target": "#oggenBgImageSize",
      "event": "change",
      "handler": "updateOggenCanvas"
    },
    "og_font": {
      "line": 319,
      "target": "#oggenFont",
      "event": "change",
      "handler": "updateOggenCanvas"
    },
    "og_logo_pos": {
      "line": 321,
      "target": "#oggenLogoPos",
      "event": "change",
      "handler": "handleLogoPosChange"
    },
    "og_logo_input": {
      "line": 322,
      "target": "#oggenLogoInput",
      "event": "change",
      "handler": "handleLogoUpload"
    },
    "heatmap_sort": {
      "line": 332,
      "target": "#heatmapSort",
      "event": "change",
      "handler": "handleHeatmapSort"
    },
    "snippet_framework": {
      "line": 6813,
      "target": "#snippetFramework",
      "event": "change",
      "handler": "generateCodeSnippet"
    },
    "import_prefs": {
      "line": 6831,
      "target": "#importPrefsInput",
      "event": "change",
      "handler": "importPreferences"
    }
  },
  "state_variables": {
    "isFilterOperation": {
      "line": 6279,
      "purpose": "Guard flag to prevent smart order resets during filter changes",
      "type": "boolean"
    },
    "isSmartOrderingActive": {
      "purpose": "Runtime flag tracking smart ordering progress",
      "type": "boolean"
    },
    "pendingFilterOperations": {
      "purpose": "Queue for deferred filter operations",
      "type": "Array"
    },
    "disabledTags": {
      "purpose": "Set of tags disabled in What If mode",
      "type": "Set"
    },
    "cropperState.enabledPlatforms": {
      "purpose": "Set of currently enabled platforms in cropper",
      "type": "Set"
    }
  },
  "spatial_distribution": {
    "sections": {
      "Initialization & Theme": {
        "line_range": "67-143",
        "handler_count": 0,
        "handlers": []
      },
      "Data Processing": {
        "line_range": "870-1216",
        "handler_count": 0,
        "handlers": []
      },
      "Main Rendering Section": {
        "line_range": "1583-4572",
        "handler_count": 2,
        "handlers": ["renderPreviews", "renderTextPreviewsOnly"]
      },
      "Cropper Section": {
        "line_range": "3530-3600",
        "handler_count": 5,
        "handlers": [
          "syncGroupToggles",
          "updateEnabledPlatforms",
          "updateCropperOverlay",
          "renderCategoryLegend",
          "cropper_group_toggle (inline)",
          "cropper_platform_toggle (inline)"
        ]
      },
      "Metadata Section": {
        "line_range": "3941-3991",
        "handler_count": 2,
        "handlers": ["renderMetadataTable", "metadata_filter_input (inline)"]
      },
      "OG Generator Section": {
        "line_range": "5101-5384",
        "handler_count": 6,
        "handlers": [
          "handleBgTypeChange",
          "handleBgImageUpload",
          "handleLogoPosChange",
          "handleLogoUpload",
          "updateOggenCanvas",
          "updateBadgePreview"
        ]
      },
      "Sitemap/Heatmap Section": {
        "line_range": "5990-6235",
        "handler_count": 1,
        "handlers": ["handleHeatmapSort"]
      },
      "Editor Section": {
        "line_range": "6289-7610",
        "handler_count": 1,
        "handlers": ["updatePreviewsWithEdits"]
      },
      "Smart Ordering Section": {
        "line_range": "7885-7990",
        "handler_count": 5,
        "handlers": [
          "shouldDeferFilterOperation",
          "isSmartOrdering",
          "queueFilterOperation",
          "processPendingFilterOperations",
          "guardWrapperWithRender"
        ]
      },
      "Platform Preferences Section": {
        "line_range": "7664-8057",
        "handler_count": 3,
        "handlers": ["toggleFavorite", "toggleHidden", "updateFavoritesList"]
      },
      "What-If Panel Section": {
        "line_range": "8121-8286",
        "handler_count": 4,
        "handlers": [
          "what_if_toggle (inline)",
          "what_if_reset (inline)",
          "what_if_apply (inline)",
          "what_if_mode_toggle (inline)"
        ]
      },
      "Command Palette Section": {
        "line_range": "9066-9220",
        "handler_count": 2,
        "handlers": ["filterCommands", "renderCommands"]
      }
    }
  },
  "handler_relationships": {
    "call_chains": {
      "platform_selection": [
        "cropper_group_toggle (inline)",
        "→ updateEnabledPlatforms()",
        "→ syncGroupToggles()",
        "→ updateCropperOverlay()",
        "→ renderCategoryLegend()"
      ],
      "metadata_filter": [
        "metadata_filter_input (inline)",
        "→ renderMetadataTable()"
      ],
      "favorite_toggle": [
        "toggleFavorite click",
        "→ guardWrapperWithRender()",
        "→ toggleFavorite()",
        "→ renderPreviews()"
      ],
      "what_if_apply": [
        "what_if_apply (inline)",
        "→ create modified metadata",
        "→ renderPreviews() with filtered data"
      ],
      "command_filter": [
        "command palette input",
        "→ filterCommands()",
        "→ renderCommands()"
      ]
    },
    "guard_wrappers": {
      "toggleFavorite": "guardWrapperWithRender('toggleFavorite', ...)",
      "toggleHidden": "guardWrapperWithRender('toggleHidden', ...)",
      "importPreferences": "Uses shouldDeferFilterOperation() guard"
    }
  },
  "summary": {
    "total_handlers": 26,
    "by_type": {
      "named_functions": 17,
      "render_functions": 5,
      "guard_functions": 5,
      "inline_handlers": 7
    },
    "by_section": {
      "Cropper Section": 5,
      "Smart Ordering Section": 5,
      "OG Generator Section": 6,
      "What-If Panel Section": 4,
      "Platform Preferences Section": 3,
      "Command Palette Section": 2,
      "Main Rendering Section": 2,
      "Metadata Section": 2,
      "Sitemap/Heatmap Section": 1,
      "Editor Section": 1
    },
    "filtering_mechanisms": [
      "Platform/group selection checkboxes (Cropper section)",
      "Text search input (Metadata filter)",
      "Sort dropdown (Heatmap table)",
      "Command palette filter (Command palette)",
      "Favorite/hidden toggles (Platform preferences)",
      "What-if tag toggles (What-if panel)",
      "OG generator settings (OG generator)",
      "Badge style selection (Badge preview)",
      "Framework selection (Code snippet)",
      "Preferences import (Preferences)"
    ],
    "key_integration_points": [
      "Filter operations are guarded during smart ordering to prevent conflicts",
      "Most filter handlers trigger re-renders of platform cards or metadata tables",
      "Platform selection filters sync with group headers for consistency",
      "Guard functions provide deferred execution during smart ordering",
      "State variables track filter operation context across the application"
    ]
  }
}
```

---

## Complete Handler Catalog (Markdown Tables)

### 1. Primary Named Functions

| Handler | Line | Section | Purpose | Event Type | Target |
|---------|------|---------|---------|------------|--------|
| `syncGroupToggles` | 3530 | Cropper Section | Syncs group checkboxes with platform states | - | Called by handlers |
| `updateEnabledPlatforms` | 3551 | Cropper Section | Updates enabled platforms set | - | Called by handlers |
| `updateCropperOverlay` | 3600 | Cropper Section | Updates visual overlay | - | Called by handlers |
| `renderMetadataTable` | 3941 | Metadata Section | Renders metadata table with filter | - | Called by handler |
| `handleHeatmapSort` | 6101 | Sitemap/Heatmap Section | Sorts heatmap table | change | `#heatmapSort` |
| `toggleFavorite` | 7867 | Platform Preferences Section | Toggles favorite status | click | Favorite button |
| `toggleHidden` | 7977 | Platform Preferences Section | Toggles hidden status | click | Hide button |
| `updateFavoritesList` | 7990 | Platform Preferences Section | Updates favorites display | - | Called after changes |
| `filterCommands` | 9177 | Command Palette Section | Filters command list | input | Command input |
| `updateBadgePreview` | 4765 | Badge Section | Updates badge preview | change | `#badgeStyleSelect` |
| `handleBgTypeChange` | 5106 | OG Generator Section | Handles BG type changes | change | `#oggenBgType` |
| `updateOggenCanvas` | 5156 | OG Generator Section | Updates OG canvas | change | Multiple OG inputs |
| `handleBgImageUpload` | 5117 | OG Generator Section | Handles BG image upload | change | `#oggenBgImageInput` |
| `handleLogoPosChange` | 5133 | OG Generator Section | Handles logo position | change | `#oggenLogoPos` |
| `handleLogoUpload` | 5140 | OG Generator Section | Handles logo upload | change | `#oggenLogoInput` |
| `generateCodeSnippet` | 6853 | Code Snippet Section | Generates code snippet | change | `#snippetFramework` |
| `importPreferences` | 8057 | Preferences Section | Imports preferences | change | `#importPrefsInput` |

### 2. Render Functions

| Handler | Line | Section | Purpose | Triggered By |
|---------|------|---------|---------|--------------|
| `renderPreviews` | 1583 | Main Rendering Section | Renders platform cards | Filter changes, data updates |
| `renderTextPreviewsOnly` | 1728 | Main Rendering Section | Renders text-only cards | Filter changes in text mode |
| `updatePreviewsWithEdits` | 6737 | Editor Section | Updates after edits | Editor save operations |
| `renderCategoryLegend` | 3568 | Cropper Section | Renders category legend | Platform selection changes |
| `renderCommands` | 9085 | Command Palette Section | Renders command list | Command filter input |

### 3. Guard Functions

| Handler | Line | Section | Purpose | Used By |
|---------|------|---------|---------|---------|
| `shouldDeferFilterOperation` | 7891 | Smart Ordering Section | Checks if should defer | Filter handlers |
| `isSmartOrdering` | 7933 | Smart Ordering Section | Checks if smart ordering active | Filter handlers |
| `queueFilterOperation` | 7942 | Smart Ordering Section | Queues operations | Filter handlers |
| `processPendingFilterOperations` | 7952 | Smart Ordering Section | Processes queue | Smart ordering system |
| `guardWrapperWithRender` | 7885 | Smart Ordering Section | Wraps with guards | toggleFavorite, toggleHidden |

### 4. Inline Handlers

| Location | Line | Section | Target | Event | Purpose |
|----------|------|---------|--------|-------|---------|
| Group toggle | 3481 | Cropper Section | `.cropper-group-toggle` | change | Toggle group platforms |
| Platform toggle | 3497 | Cropper Section | `.cropper-platform-toggle input` | change | Toggle platform |
| Metadata filter | 3991 | Metadata Section | `#metadataFilterInput` | input | Filter metadata table |
| What-If toggle | 8207 | What-If Panel Section | `.what-if-toggle input` | change | Toggle tag |
| What-If reset | 8219 | What-If Panel Section | `#whatIfReset` | click | Reset toggles |
| What-If apply | 8220 | What-If Panel Section | `#whatIfApply` | click | Apply changes |
| What-IF mode | 8334 | What-If Panel Section | `#whatIfToggleBtn` | click | Toggle mode |

### 5. Event Listener Setup

| Line | Target | Event | Handler | Section |
|------|--------|-------|---------|---------|
| 296 | `#badgeStyleSelect` | change | `updateBadgePreview` | Badge |
| 310 | `#oggenBgType` | change | `handleBgTypeChange` | OG Generator |
| 314 | `#oggenGradientDir` | change | `updateOggenCanvas` | OG Generator |
| 315 | `#oggenBgImageInput` | change | `handleBgImageUpload` | OG Generator |
| 316 | `#oggenBgImageSize` | change | `updateOggenCanvas` | OG Generator |
| 319 | `#oggenFont` | change | `updateOggenCanvas` | OG Generator |
| 321 | `#oggenLogoPos` | change | `handleLogoPosChange` | OG Generator |
| 322 | `#oggenLogoInput` | change | `handleLogoUpload` | OG Generator |
| 332 | `#heatmapSort` | change | `handleHeatmapSort` | Heatmap |
| 6813 | `#snippetFramework` | change | `generateCodeSnippet` | Code Snippet |
| 6831 | `#importPrefsInput` | change | `importPreferences` | Preferences |

### 6. State Variables

| Variable | Line | Purpose | Type |
|----------|------|---------|------|
| `isFilterOperation` | 6279 | Prevent smart order resets during filters | boolean |
| `isSmartOrderingActive` | - | Track smart ordering progress | boolean |
| `pendingFilterOperations` | - | Queue for deferred operations | Array |
| `disabledTags` | - | Tags disabled in What-If mode | Set |
| `cropperState.enabledPlatforms` | - | Currently enabled platforms | Set |

### 7. Spatial Distribution by Section

| Section | Line Range | Handler Count | Handlers |
|---------|-----------|---------------|----------|
| Initialization & Theme | 67-143 | 0 | - |
| Data Processing | 870-1216 | 0 | - |
| Main Rendering Section | 1583-4572 | 2 | renderPreviews, renderTextPreviewsOnly |
| Cropper Section | 3530-3600 | 5 | syncGroupToggles, updateEnabledPlatforms, updateCropperOverlay, renderCategoryLegend, 2 inline |
| Metadata Section | 3941-3991 | 2 | renderMetadataTable, 1 inline |
| OG Generator Section | 5101-5384 | 6 | 6 named functions |
| Sitemap/Heatmap Section | 5990-6235 | 1 | handleHeatmapSort |
| Editor Section | 6289-7610 | 1 | updatePreviewsWithEdits |
| Smart Ordering Section | 7885-7990 | 5 | 5 guard functions |
| Platform Preferences Section | 7664-8057 | 3 | toggleFavorite, toggleHidden, updateFavoritesList |
| What-If Panel Section | 8121-8286 | 4 | 4 inline handlers |
| Command Palette Section | 9066-9220 | 2 | filterCommands, renderCommands |

### 8. Handler Relationships

#### Call Chains

**Platform Selection:**
```
cropper_group_toggle (inline)
→ updateEnabledPlatforms()
→ syncGroupToggles()
→ updateCropperOverlay()
→ renderCategoryLegend()
```

**Metadata Filter:**
```
metadata_filter_input (inline)
→ renderMetadataTable()
```

**Favorite Toggle:**
```
toggleFavorite click
→ guardWrapperWithRender()
→ toggleFavorite()
→ renderPreviews()
```

**What-If Apply:**
```
what_if_apply (inline)
→ create modified metadata
→ renderPreviews() with filtered data
```

**Command Filter:**
```
command palette input
→ filterCommands()
→ renderCommands()
```

#### Guard Wrappers
- `toggleFavorite`: `guardWrapperWithRender('toggleFavorite', ...)`
- `toggleHidden`: `guardWrapperWithRender('toggleHidden', ...)`
- `importPreferences`: Uses `shouldDeferFilterOperation()` guard

---

## Summary Statistics

- **Total Handlers Cataloged:** 26
- **Named Functions:** 17
- **Render Functions:** 5
- **Guard Functions:** 5
- **Inline Handlers:** 7

**Filtering Mechanisms:**
1. Platform/group selection checkboxes (Cropper section)
2. Text search input (Metadata filter)
3. Sort dropdown (Heatmap table)
4. Command palette filter (Command palette)
5. Favorite/hidden toggles (Platform preferences)
6. What-if tag toggles (What-if panel)
7. OG generator settings (OG generator)
8. Badge style selection (Badge preview)
9. Framework selection (Code snippet)
10. Preferences import (Preferences)

**Key Integration Points:**
- Filter operations are guarded during smart ordering to prevent conflicts
- Most filter handlers trigger re-renders of platform cards or metadata tables
- Platform selection filters sync with group headers for consistency
- Guard functions provide deferred execution during smart ordering
- State variables track filter operation context across the application

---

## Data Sources

This catalog was compiled from data extracted by the following child beads:

- **bf-114h8:** Initial handler catalog extraction
- **bf-16j2w:** Filter handler function names extraction
- **bf-1skj4:** app.js structure mapping
- **bf-2r0ce:** Handler-to-line-section mapping
- **bf-54i73:** Filter change handler documentation
- **bf-53rci:** Handler purpose analysis
- **bf-e9uhu:** Filter handlers by section grouping

---

**End of Catalog**
