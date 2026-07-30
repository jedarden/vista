# card-theme-toggle Button Structure Documentation

## Overview
The card-theme-toggle button is a theme switching control for Twitter/X and other supported platform cards in the Vista application. It allows users to toggle between dark and light modes within individual cards.

## Button Location
The button is rendered in **two locations** within `src/public/app.js`:

1. **Line 1877** - In `createPlatformCard()` function (initial card creation)
2. **Line 2045** - In `renderPlatformWithContext()` function (context view rendering)

## HTML Structure

```html
<button class="card-theme-toggle" data-pid="${pid}" title="Toggle theme" aria-label="Toggle light/dark theme" disabled>
  <span class="theme-icon">${cardContextState[pid].theme === 'dark' ? '🌙' : '☀️'}</span>
</button>
```

### Key Attributes
- **Class**: `card-theme-toggle`
- **Data attribute**: `data-pid="${pid}"` (platform ID)
- **Title**: "Toggle theme"
- **ARIA label**: "Toggle light/dark theme"
- **Initial state**: `disabled` (becomes enabled when card loads)

### Child Element
- **`.theme-icon`**: Span containing emoji icon (🌙 for dark, ☀️ for light)

## Positioning & Layout

### Parent Container
- **Container**: `.card-header-controls` div
- **CSS** (line 1386-1387):
  ```css
  .card-header-controls { 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    margin-left: auto;
  }
  ```

The button is positioned in a flexbox container with other controls:
1. card-theme-toggle (if platform supports themes)
2. card-screenshot-btn
3. card-context-toggle
4. Card grade badge

## CSS Styling

### Primary Styles (lines 4960-4961)
```css
.card-theme-toggle {
  padding: 4px 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--transition);
  font-size: 14px;
}

.card-theme-toggle:hover {
  background: var(--bg3);
}
```

### Secondary Styles (lines 1387-1393)
```css
.card-context-toggle, .card-theme-toggle, .card-screenshot-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--text3);
  background: var(--bg3);
  border: 1px solid var(--border);
  transition: var(--transition);
}

.card-context-toggle:hover, .card-theme-toggle:hover, .card-screenshot-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
```

### Icon Styling (line 1396)
```css
.context-icon, .theme-icon { 
  font-size: 12px; 
}
```

### Responsive Design
At line 6966, the button is included in a media query group (likely mobile optimization)

## JavaScript Implementation

### State Management
- **Global variable**: `cardContextState` (line 7)
  ```javascript
  let cardContextState = {}; // { pid: { context: boolean, theme: 'dark'|'light' } }
  ```

- **Initialization** (lines 1864, 2032):
  ```javascript
  cardContextState[pid] = { context: false, theme: 'dark' };
  ```

### Event Listeners
Attached in two places:

1. **Line 2001** - When card loads:
   ```javascript
   themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
   ```

2. **Line 2096** - In card creation:
   ```javascript
   themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
   ```

### Key Functions

#### `toggleCardTheme(pid, data)` (line 2175-2184)
```javascript
function toggleCardTheme(pid, data) {
  cardContextState[pid].theme = cardContextState[pid].theme === 'dark' ? 'light' : 'dark';
  if (cardContextState[pid].context) {
    const body = document.getElementById(`card-body-${pid}`);
    if (body) {
      body.innerHTML = renderPlatformWithContext(
        pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme
      );
    }
  }
  updateCardHeader(pid);
}
```

#### `updateCardHeader(pid)` (line 2186-2201)
```javascript
function updateCardHeader(pid) {
  const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
  if (!card) return;

  const themeToggle = card.querySelector('.card-theme-toggle');
  if (themeToggle) {
    themeToggle.querySelector('.theme-icon').textContent = 
      cardContextState[pid].theme === 'dark' ? '🌙' : '☀️';
  }
}
```

## Platform Support

### Supported Platforms
The button is conditionally rendered based on `PLATFORMS_WITH_THEME` constant (line 2158-2159):
```javascript
const PLATFORMS_WITH_THEME = typeof getPlatformsWithThemeSupport === 'function'
  ? getPlatformsWithThemeSupport()
```

At least **Twitter/X** is confirmed to be in this list (per test-twitter-theme-toggle.html line 141-146).

### Conditional Rendering (lines 1870-1880)
```javascript
const supportsTheme = PLATFORMS_WITH_THEME.includes(pid);

header.innerHTML = `
  ...
  <div class="card-header-controls">
    ${supportsTheme ? `
      <button class="card-theme-toggle" ...>
      </button>
    ` : ''}
    ...
  </div>
`;
```

## Button States

| State | Description | Icon |
|-------|-------------|------|
| **Dark theme** | Default state | 🌙 |
| **Light theme** | After first click | ☀️ |
| **Disabled** | Before card loads | Either icon (unchangeable) |
| **Enabled** | After card loads | Clickable |

## Accessibility Features

- **ARIA label**: "Toggle light/dark theme"
- **Title attribute**: "Toggle theme"
- **Visual feedback**: Hover effect with border color and text color change
- **Icon indication**: Emoji icons (🌙/☀️) provide visual state indication

## CSS Variables Used

- `--transition`: Animation timing
- `--bg3`: Background color for hover state
- `--text3`: Default text color
- `--accent`: Accent color for hover/focus states
- `--border`: Border color

## Verification Notes

- Button exists in both initial card render and context view render
- Event listeners are properly attached after card loads
- Icon updates dynamically via `updateCardHeader()` function
- Theme state persists in `cardContextState` object
- Button is only shown for platforms in `PLATFORMS_WITH_THEME` array
