# Theme Subscription Utility

## Overview

The Theme Subscription Utility provides a clean, type-safe API for platform frame components to subscribe to and react to theme changes without requiring a page reload.

## Location

- **Utility File:** `src/public/theme-subscription.js`
- **TypeScript Definitions:** `src/types/theme-subscription.d.ts`
- **Test File:** `test-theme-subscription.html`

## Features

- **Subscribe/Unsubscribe API**: Clean callback-based interface for theme change notifications
- **Current Theme Access**: Get the current theme value synchronously
- **Platform Frame Integration**: Helper functions for automatic theme application to platform frames
- **Type Safety**: Full TypeScript definitions for type checking in components
- **Zero Dependencies**: Works with existing frames-theme.js infrastructure

## API Reference

### `subscribe(callback: ThemeChangeCallback): SubscriberId`

Subscribe to theme changes. The callback will be invoked immediately with the current theme, and then whenever the theme changes.

**Parameters:**
- `callback` - Function to call when theme changes, receives theme string ('dark' or 'light')

**Returns:** Subscriber ID (use this ID to unsubscribe)

**Example:**
```javascript
const subscriberId = ThemeSubscription.subscribe((theme) => {
  console.log('Theme changed to:', theme);
  // Update your component here
});
```

### `unsubscribe(subscriberId: SubscriberId): boolean`

Unsubscribe from theme changes using the subscriber ID returned from `subscribe()`.

**Parameters:**
- `subscriberId` - The subscriber ID returned from `subscribe()`

**Returns:** `true` if subscriber was found and removed, `false` otherwise

**Example:**
```javascript
ThemeSubscription.unsubscribe(subscriberId);
```

### `getCurrentTheme(): ThemeMode`

Get the current theme value synchronously.

**Returns:** Current theme ('dark' or 'light')

**Example:**
```javascript
const currentTheme = ThemeSubscription.getCurrentTheme();
console.log('Current theme:', currentTheme);
```

### `applyThemeToFrame(frameElement, platform, theme): void`

Apply theme to a platform frame element. Updates CSS classes and CSS variables for the platform.

**Parameters:**
- `frameElement` - The frame DOM element
- `platform` - Platform ID (e.g., 'twitter', 'facebook')
- `theme` - Theme ('dark' or 'light')

**Example:**
```javascript
const frameElement = document.getElementById('my-frame');
ThemeSubscription.applyThemeToFrame(frameElement, 'twitter', 'dark');
```

### `subscribePlatformFrame(platform, frameId): UnsubscribeFunction`

Create a theme subscription for a specific platform frame. This is a convenience function that combines subscription with automatic theme application.

**Parameters:**
- `platform` - Platform ID (e.g., 'twitter', 'facebook')
- `frameId` - The DOM element ID of the frame

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsubscribe = ThemeSubscription.subscribePlatformFrame('twitter', 'my-frame-id');
// Later: unsubscribe();
```

## Usage Examples

### Example 1: Basic Subscription in TypeScript Component

```typescript
import type { ThemeMode, ThemeChangeCallback } from '../types/theme-subscription';

class MyPlatformFrame {
  private subscriberId: string | null = null;

  initialize() {
    // Subscribe to theme changes
    this.subscriberId = window.ThemeSubscription.subscribe(
      (theme: ThemeMode) => {
        this.onThemeChange(theme);
      }
    );
  }

  private onThemeChange(theme: ThemeMode) {
    // Update component based on theme
    this.updateStyles(theme);
    this.renderContent(theme);
  }

  destroy() {
    // Clean up subscription
    if (this.subscriberId) {
      window.ThemeSubscription.unsubscribe(this.subscriberId);
    }
  }
}
```

### Example 2: Platform Frame with Automatic Theme Application

```typescript
class TwitterFrame implements BasePlatformFrame {
  private frameId: string;
  private unsubscribe: (() => void) | null = null;

  constructor(frameId: string) {
    this.frameId = frameId;
  }

  mount() {
    // Subscribe to theme changes with automatic application
    this.unsubscribe = window.ThemeSubscription.subscribePlatformFrame(
      'twitter',
      this.frameId
    );
  }

  unmount() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

### Example 3: Reactive Theme State in Custom Element

```typescript
class CustomPlatformFrame extends HTMLElement {
  private currentTheme: ThemeMode = 'dark';

  connectedCallback() {
    // Get initial theme
    this.currentTheme = window.ThemeSubscription.getCurrentTheme();
    this.render();

    // Subscribe to theme changes
    const subscriberId = window.ThemeSubscription.subscribe((theme) => {
      this.currentTheme = theme;
      this.render();
    });

    // Store subscriber ID for cleanup
    this.dataset.themeSubscriberId = subscriberId;
  }

  disconnectedCallback() {
    // Clean up subscription
    const subscriberId = this.dataset.themeSubscriberId;
    if (subscriberId) {
      window.ThemeSubscription.unsubscribe(subscriberId);
    }
  }

  private render() {
    // Render based on currentTheme
    this.className = `custom-frame ${this.currentTheme}-theme`;
    // ... rest of rendering logic
  }
}
```

## Architecture

### Theme Detection

The utility uses a `MutationObserver` to watch for changes to the `data-theme` attribute on `document.documentElement`. When the theme changes, all subscribers are notified with the new theme value.

### Integration with frames-theme.js

The utility integrates with the existing `frames-theme.js` system:
- Reads theme from `document.documentElement[data-theme]`
- Uses `PLATFORM_FRAMES` data for platform-specific CSS variables
- Compatible with existing theme management functions

### CSS Variable System

When applying theme to a platform frame, the utility:
1. Updates CSS classes (`dark-theme`, `light-theme`)
2. Updates `data-theme` and `data-frame-theme` attributes
3. Applies platform-specific CSS variables from `PLATFORM_FRAMES`

## Testing

Run the test file in a browser:

```bash
# Serve the file (e.g., using Python's built-in server)
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/test-theme-subscription.html
```

The test file demonstrates:
- Theme subscription and unsubscription
- Platform frame automatic theme application
- Manual theme application to frames
- Current theme access
- Subscriber count tracking

## Migration from Direct DOM Manipulation

### Before (Direct DOM Manipulation)

```typescript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      const newTheme = document.documentElement.getAttribute('data-theme');
      // Manual update logic
      this.updateFrame(newTheme);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
```

### After (Using Theme Subscription Utility)

```typescript
const subscriberId = window.ThemeSubscription.subscribe((theme) => {
  this.updateFrame(theme);
});

// Clean up
window.ThemeSubscription.unsubscribe(subscriberId);
```

## Benefits

1. **Simplified API**: No need to manage MutationObserver instances
2. **Automatic Cleanup**: Built-in subscription management
3. **Type Safety**: Full TypeScript support
4. **Consistency**: Standardized approach across all platform frames
5. **Testability**: Easier to test theme handling logic
6. **Less Boilerplate**: Reduces code duplication

## Error Handling

The utility includes error handling for subscriber callbacks:
- Errors in callbacks are caught and logged to console
- Errors don't prevent other subscribers from being notified
- Safe handling of null/undefined frame elements

## Browser Support

- Modern browsers with MutationObserver support
- ES5+ JavaScript (no bleeding-edge features required)
- Works in all browsers supported by the main application

## Future Enhancements

Potential improvements for future versions:
- Add theme transition support (fade between themes)
- Add theme persistence options
- Add batch subscription/unsubscription for multiple frames
- Add debug mode for detailed subscription tracking
