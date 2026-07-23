# Task bf-265zd: VS Code and JetBrains Platform Enum

## Status: Already Complete

### Verification

Both `vscode` and `jetbrains` platforms are already defined in `PLATFORM_FRAMES` with `hasThemeSupport: true`:

#### VS Code (line 2500)
```javascript
vscode: {
  name: 'VS Code',
  category: 'collaboration',
  hasThemeSupport: true,  // ✅
  aspectRatio: 'variable',
  // ... complete chrome, neutralContent, themeVars
}
```

#### JetBrains (line 2581)
```javascript
jetbrains: {
  name: 'JetBrains IDE',
  category: 'collaboration',
  hasThemeSupport: true,  // ✅
  aspectRatio: 'variable',
  // ... complete chrome, neutralContent, themeVars
}
```

### How PLATFORMS_WITH_THEME Works

The `PLATFORMS_WITH_THEME` array is not a hardcoded enum - it's derived dynamically:

```javascript
function getPlatformsWithThemeSupport() {
  return Object.entries(PLATFORM_FRAMES)
    .filter(([_, frame]) => frame.hasThemeSupport)
    .map(([id, _]) => id);
}
```

Both `vscode` and `jetbrains` are already included because they have `hasThemeSupport: true`.

### Acceptance Criteria Met

- ✅ PLATFORMS_WITH_THEME enum includes 'vscode' entry
- ✅ PLATFORMS_WITH_THEME enum includes 'jetbrains' entry
- ✅ Both entries have appropriate display names
- ✅ Both entries have platform-specific config (themeVars, chrome, neutralContent)
- ✅ Code compiles without errors

## Context

This appears to be a follow-up task to bead bf-12qh2 which noted that IDE context frames were already implemented.
