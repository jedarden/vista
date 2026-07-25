# Platform Frames Import Path Documentation

## Task: Determine platform-frames.config.ts import path

### Files Located
- **Source file (renderPlatformWithContext):** `/home/coding/vista/src/public/app.js`
- **Target file:** `/home/coding/vista/src/platform-frames.config.ts`

### Relative Import Path Calculation
**From:** `src/public/app.js`  
**To:** `src/platform-frames.config.ts`

**Path:** `../platform-frames.config.ts`

### Verification
✓ Path resolves correctly from source directory  
✓ Follows standard TypeScript/Node module resolution  
✓ Already documented in app.js header comments (line 7)

### Implementation Notes
- The `app.js` file is the runtime location of `renderPlatformWithContext()`
- Current documentation in app.js already includes the correct import path as a JSDoc comment
- The platform-frames.config.ts is loaded at runtime through a separate global script mechanism, not via direct ES6 imports in the JavaScript bundle
- TypeScript import syntax would be: `import { PlatformFramesConfig } from '../platform-frames.config';`

### Verification Command
```bash
cd /home/coding/vista/src/public && ls -la ../platform-frames.config.ts
# Output: -rw-r--r-- 1 coding users 31004 Jul 25 10:17 ../platform-frames.config.ts
```

### Summary
The correct relative import path from the `renderPlatformWithContext` function location (`src/public/app.js`) to `platform-frames.config.ts` is **`../platform-frames.config.ts`**.

This path:
- Goes up one directory level from `public/` to `src/`
- Accesses the `platform-frames.config.ts` file in the parent directory
- Follows standard TypeScript/Node relative path resolution rules
- Is already documented in the existing codebase header comments
