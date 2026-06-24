# Safe Zone and Overlay Implementation Investigation

**Task ID:** bf-1e2v  
**Date:** 2026-06-24

## Overview

VISTA's safe zone feature shows the intersection of crop regions across multiple social platforms. This helps users identify which areas of an OG image will remain visible across all selected platforms.

## Coordinate System

### Native Image Coordinates
- **Coordinate space:** Uses **natural image dimensions** (original pixel dimensions)
  - `cropperState.imageNaturalWidth` - full image width in pixels
  - `cropperState.imageNaturalHeight` - full image height in pixels
  - Example: 1920×1080 image uses coordinates 0-1920 (x) and 0-1080 (y)

### Display Transformation
- **SVG viewBox:** Maps native coordinates to display size
  ```javascript
  svg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);
  ```
- **CSS positioning:** Overlay is absolutely positioned over the image
  ```css
  .cropper-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  ```
- **Image display:** Image is rendered with `object-fit: contain` and limited to `max-height: 600px`
- **Critical detail:** The SVG overlay and image share the same coordinate system through `viewBox`, so crop rectangles are calculated in native image coordinates and automatically scaled to fit the display

## Safe Zone Calculation

### Algorithm

**Location:** `src/public/app.js:2698-2772` (`updateCropperOverlay()`)

```javascript
// Initialize to full image
let safeZone = { x: 0, y: 0, w: imgW, h: imgH };

// For each enabled platform, intersect with safe zone
enabledPids.forEach(pid => {
  const rect = calculateCropRect(PLATFORM_CROPS[pid], imgW, imgH);
  safeZone.x = Math.max(safeZone.x, rect.x);
  safeZone.y = Math.max(safeZone.y, rect.y);
  safeZone.w = Math.min(safeZone.w, rect.x + rect.w) - safeZone.x;
  safeZone.h = Math.min(safeZone.h, rect.y + rect.h) - safeZone.y;
});
```

**Mathematical properties:**
- Initial state: full image (0,0) to (imgW,imgH)
- Each platform's crop region **contracts** the safe zone
- Final result: intersection of all selected platform crops
- If no platforms selected: no safe zone shown

### Platform Crop Configurations

**Location:** `src/public/app.js:852-895` (`PLATFORM_CROPS`)

Each platform defines:
- `category`: For color coding (social, messaging, collaboration, content, email, rss)
- `aspect`: `{min, max}` aspect ratio range
- `cropMode`: Either 'contain' or 'cover'
- `displaySize`: `{w, h}` optimal dimensions (can be null)
- `note`: Human-readable description

**Examples:**
```javascript
facebook: { 
  category: 'social', 
  aspect: { min: 1.91, max: 1.91 },  // 1.91:1 landscape
  cropMode: 'cover', 
  displaySize: { w: 1200, h: 630 }, 
  note: '1200×630 optimal' 
},
slack: { 
  category: 'messaging', 
  aspect: { min: 0, max: Infinity },  // Any aspect ratio
  cropMode: 'contain',  // Full image visible
  displaySize: null, 
  note: 'Full image shown' 
}
```

### Crop Rectangle Calculation

**Location:** `src/public/app.js:2774-2804` (`calculateCropRect()`)

**Contain mode** (full image visible):
```javascript
if (crop.cropMode === 'contain') {
  return { x: 0, y: 0, w: imgW, h: imgH };
}
```

**Cover mode** (center-cropped to aspect ratio):
```javascript
if (crop.cropMode === 'cover') {
  const cropAR = crop.aspect.max || crop.aspect.min;
  const imgAR = imgW / imgH;
  
  if (imgAR > cropAR) {
    // Image wider than target - crop sides
    cropW = imgH * cropAR;
    cropH = imgH;
  } else {
    // Image taller than target - crop top/bottom
    cropW = imgW;
    cropH = imgW / cropAR;
  }
  
  // Center the crop
  const x = (imgW - cropW) / 2;
  const y = (imgH - cropH) / 2;
  
  return { x, y, w: cropW, h: cropH };
}
```

**Math logic:**
- Compare image aspect ratio to target aspect ratio
- If image is wider: calculate width from height and target AR
- If image is taller: calculate height from width and target AR
- Always center the crop region

## Rendering Pipeline

### UI Structure

**HTML:** `src/public/index.html:256-278`
```html
<div class="cropper-container">
  <div class="cropper-main">
    <div class="cropper-viewport">
      <img id="cropperImage" class="cropper-image" alt="" />
      <svg id="cropperOverlay" class="cropper-overlay"></svg>
    </div>
    <div class="cropper-sidebar">
      <!-- Controls and info panels -->
      <div id="safeZoneInfo"></div>
      <div id="imageInfo"></div>
    </div>
  </div>
  <div class="cropper-controls" id="cropperControls"></div>
</div>
```

### SVG Overlay Rendering

**Location:** `src/public/app.js:2703-2768`

1. **Clear previous:** `svg.innerHTML = ''`
2. **Set viewBox:** Match native image dimensions
3. **Draw platform crops:** For each enabled platform
   ```javascript
   const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
   rectEl.setAttribute('x', rect.x);
   rectEl.setAttribute('y', rect.y);
   rectEl.setAttribute('width', rect.w);
   rectEl.setAttribute('height', rect.h);
   rectEl.setAttribute('fill', color);
   rectEl.setAttribute('fill-opacity', '0.15');
   rectEl.setAttribute('stroke', color);
   rectEl.setAttribute('stroke-width', '2');
   rectEl.setAttribute('stroke-dasharray', '8,4');
   ```
4. **Draw safe zone:** Intersection rectangle
   ```javascript
   const safeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
   // ... attributes for white stroke, 4px width, 12,6 dash pattern
   safeRect.classList.add('safe-zone-rect');
   ```
5. **Update info panel:** Show dimensions, coverage %, platform count

### Canvas Export

**Location:** `src/public/app.js:2806-2867` (`exportCropperOverlay()`)

When user clicks "Download Overlay":
1. Create canvas at native image dimensions
2. Draw image
3. Draw platform crops (with hex + alpha for transparency)
4. Draw safe zone (white stroke, thicker)
5. Export as PNG

**Differences from SVG:**
- Uses `ctx.setLineDash()` instead of SVG stroke-dasharray
- Colors use hex + 40 (25% alpha) for fills
- Safe zone stroke is 6px instead of 4px

## Known Issues and Edge Cases

### Potential Issues

1. **No scaling safeguard:** If user uploads extremely large image (e.g., 10000×10000), the overlay SVG viewBox is set to those dimensions. The browser must handle this mapping, which could cause precision issues.

2. **Zero-size safe zone:** If selected platforms have non-overlapping crop regions, the safe zone could have w=0 or h=0. Code checks for this:
   ```javascript
   if (enabledPids.length > 0 && safeZone.w > 0 && safeZone.h > 0)
   ```

3. **Contain vs Cover mixing:** When mixing 'contain' platforms (full image) with 'cover' platforms (cropped), the contain platforms don't constrain the safe zone. This is mathematically correct but might confuse users.

### Edge Cases Handled

1. **No image loaded:** Function checks `if (!imgW || !imgH) return;`
2. **Platform without crop config:** Checks `if (!crop) return;`
3. **No platforms selected:** Doesn't draw safe zone, shows "Select platforms to see safe zone"
4. **Image download:** Safe zone info shows "No image loaded" message

## Rendering Summary

**Rendering happens in two places:**

1. **Live overlay (SVG):** `updateCropperOverlay()` called on:
   - Image load
   - Platform selection toggle
   - Window resize (via CSS)

2. **Export (Canvas):** `exportCropperOverlay()` called on:
   - Download button click
   - Creates PNG with overlays baked in

**CSS ensures proper alignment:**
```css
.cropper-viewport {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cropper-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
```

## Key Files

- `src/public/app.js:852-895` - PLATFORM_CROPS configuration
- `src/public/app.js:2698-2772` - updateCropperOverlay() (SVG rendering)
- `src/public/app.js:2774-2804` - calculateCropRect() (crop math)
- `src/public/app.js:2806-2867` - exportCropperOverlay() (Canvas export)
- `src/public/index.html:256-278` - Cropper UI structure
- `src/public/style.css:1122-1168` - Cropper CSS

## Category Color Scheme

```javascript
const CATEGORY_COLORS = {
  social: '#3b82f6',      // blue
  messaging: '#22c55e',   // green
  collaboration: '#a855f7', // purple
  content: '#f97316',     // orange
  email: '#eab308',       // yellow
  rss: '#ec4899',         // pink
};
```

These colors are used for both platform crop fills and strokes.
